import { describe, expect, test } from "vitest";
import { createGasTestRuntime } from "../gasTestRuntime.js";
import * as testUtils from "../testUtils.js";

const VALID_GASTO_PARTS = [
  "GASTO",
  "10/06",
  "5000",
  "ARS",
  "Efectivo",
  "0",
  "Entrada cine",
  "-",
  "-"
];

const VALID_TC_PARTS = [
  "TC",
  "10/06",
  "12000",
  "ARS",
  "0",
  "3",
  "Compra con tarjeta",
  "-",
  "-"
];

const VALID_INGRESO_PARTS = [
  "INGRESO",
  "10/06",
  "100000",
  "ARS",
  "Sueldo"
];

const VALID_DEUDA_PARTS = [
  "DEUDA",
  "100000",
  "ARS",
  "Préstamo"
];

const VALID_PAGO_DEUDA_PARTS = [
  "PAGO DEUDA",
  "40000"
];

function replacePart(parts, index, value) {
  const result = [...parts];
  result[index] = value;
  return result;
}

function getChatId(app) {
  return testUtils.getGlobal(app, "TELEGRAM_CHAT_ID");
}

function invokeCommand(app, globalName, methodName, ...args) {
  const command = testUtils.getGlobal(app, globalName);
  return command[methodName](...args);
}

function expectMessageErrors(app, MSG_ERRORS, errorKeys) {
  const message = app.lastMessage();

  for (const errorKey of errorKeys) {
    expect(message).toContain(MSG_ERRORS[errorKey]);
  }
}

function expectSheetsEmpty(app, sheetNames) {
  for (const sheetName of sheetNames) {
    expect(testUtils.sheetObjects(app, sheetName)).toHaveLength(0);
  }
}

function expectNoState(app) {
  expect(app.props.size).toBe(0);
}

function startReminder(app, description = "Recordatorio test") {
  app.sendMessage(testUtils.fullRecordatorio({
    detalle: description
  }));

  expect(app.lastMessage()).toContain("Elegí el TIPO");
}

describe("Los flujos usan sus validators", () => {
  describe("ExpenseValidator / GASTO", () => {
    const cases = [
      {
        name: "validateDateInput",
        parts: replacePart(
          VALID_GASTO_PARTS,
          1,
          "31/02"
        ),
        errorKeys: ["FECHA_INVALIDA"]
      },
      {
        name: "validateAmountInput",
        parts: replacePart(
          VALID_GASTO_PARTS,
          2,
          "abc"
        ),
        errorKeys: ["MONTO_INVALIDO"]
      },
      {
        name: "validateCoinInput",
        parts: replacePart(
          VALID_GASTO_PARTS,
          3,
          "EUR"
        ),
        errorKeys: ["MONEDA_INVALIDA"]
      },
      {
        name: "validateMethodInput",
        parts: replacePart(
          VALID_GASTO_PARTS,
          4,
          "   "
        ),
        errorKeys: ["METODO_INVALIDO"]
      },
      {
        name: "validateSavingInput",
        parts: replacePart(
          VALID_GASTO_PARTS,
          5,
          "abc"
        ),
        errorKeys: ["AHORRO_INVALIDO"]
      },
      {
        name: "validateDetailInput",
        parts: replacePart(
          VALID_GASTO_PARTS,
          6,
          "   "
        ),
        errorKeys: ["DETALLE_VACIO"]
      },
      {
        name: "validateTypeInput",
        parts: replacePart(
          VALID_GASTO_PARTS,
          7,
          "X"
        ),
        errorKeys: [
          "TIPO_INVALIDO",
          "VALOR_REINTEGRO_INVALIDO"
        ]
      },
      {
        name: "validateRefundInput",
        parts: [
          "GASTO",
          "10/06",
          "5000",
          "ARS",
          "Efectivo",
          "1000",
          "Entrada cine",
          "R",
          "-"
        ],
        errorKeys: ["REFUND_INPUT_INVALIDO_5"]
      }
    ];

    test.each(cases)(
      "usa $name",
      ({ parts, errorKeys }) => {
        const app = createGasTestRuntime();
        const MSG_ERRORS = testUtils.getGlobal(
          app,
          "MSG_ERRORS"
        );

        invokeCommand(
          app,
          "ExpenseCommand",
          "handle",
          getChatId(app),
          parts
        );

        expectMessageErrors(
          app,
          MSG_ERRORS,
          errorKeys
        );

        expectSheetsEmpty(app, [
          "SHEET_GASTOS",
          "SHEET_DEUDAS"
        ]);

        expectNoState(app);
      }
    );
  });

  describe("CreditCardExpenseValidator / TC", () => {
    const cases = [
      {
        name: "validateDateInput",
        parts: replacePart(
          VALID_TC_PARTS,
          1,
          "31/02"
        ),
        errorKeys: ["FECHA_INVALIDA"]
      },
      {
        name: "validateAmountInput",
        parts: replacePart(
          VALID_TC_PARTS,
          2,
          "abc"
        ),
        errorKeys: ["MONTO_INVALIDO"]
      },
      {
        name: "validateCoinInput",
        parts: replacePart(
          VALID_TC_PARTS,
          3,
          "EUR"
        ),
        errorKeys: ["MONEDA_INVALIDA"]
      },
      {
        name: "validateSavingInput",
        parts: replacePart(
          VALID_TC_PARTS,
          4,
          "abc"
        ),
        errorKeys: ["AHORRO_INVALIDO"]
      },
      {
        name: "validateQuotaInput",
        parts: replacePart(
          VALID_TC_PARTS,
          5,
          "1.5"
        ),
        errorKeys: ["CUOTAS_INVALIDO"]
      },
      {
        name: "validateDetailInput",
        parts: replacePart(
          VALID_TC_PARTS,
          6,
          "   "
        ),
        errorKeys: ["DETALLE_VACIO"]
      },
      {
        name: "validateTypeInput",
        parts: replacePart(
          VALID_TC_PARTS,
          7,
          "X"
        ),
        errorKeys: [
          "TIPO_INVALIDO",
          "VALOR_REINTEGRO_INVALIDO"
        ]
      },
      {
        name: "validateRefundInput",
        parts: [
          "TC",
          "10/06",
          "12000",
          "ARS",
          "2000",
          "3",
          "Compra con tarjeta",
          "R",
          "-"
        ],
        errorKeys: ["REFUND_INPUT_INVALIDO_5"]
      }
    ];

    test.each(cases)(
      "usa $name",
      ({ parts, errorKeys }) => {
        const app = createGasTestRuntime();
        const MSG_ERRORS = testUtils.getGlobal(
          app,
          "MSG_ERRORS"
        );

        invokeCommand(
          app,
          "CreditCardExpenseCommand",
          "handle",
          getChatId(app),
          parts
        );

        expectMessageErrors(
          app,
          MSG_ERRORS,
          errorKeys
        );

        expectSheetsEmpty(app, [
          "SHEET_GASTOS",
          "SHEET_CUOTAS",
          "SHEET_DEUDAS"
        ]);

        expectNoState(app);
      }
    );
  });

  describe("IncomeValidator / INGRESO", () => {
    const cases = [
      {
        name: "validateDateInput",
        parts: replacePart(
          VALID_INGRESO_PARTS,
          1,
          "31/02"
        ),
        errorKeys: ["FECHA_INVALIDA"]
      },
      {
        name: "validateAmountInput",
        parts: replacePart(
          VALID_INGRESO_PARTS,
          2,
          "abc"
        ),
        errorKeys: ["MONTO_INVALIDO"]
      },
      {
        name: "validateCoinInput",
        parts: replacePart(
          VALID_INGRESO_PARTS,
          3,
          "EUR"
        ),
        errorKeys: ["MONEDA_INVALIDA"]
      },
      {
        name: "validateDetailInput",
        parts: replacePart(
          VALID_INGRESO_PARTS,
          4,
          "   "
        ),
        errorKeys: ["DETALLE_VACIO"]
      }
    ];

    test.each(cases)(
      "usa $name",
      ({ parts, errorKeys }) => {
        const app = createGasTestRuntime();
        const MSG_ERRORS = testUtils.getGlobal(
          app,
          "MSG_ERRORS"
        );

        invokeCommand(
          app,
          "IncomeCommand",
          "handle",
          getChatId(app),
          parts
        );

        expectMessageErrors(
          app,
          MSG_ERRORS,
          errorKeys
        );

        expectSheetsEmpty(app, [
          "SHEET_INGRESOS"
        ]);

        expectNoState(app);
      }
    );
  });

  describe("DebtValidator / DEUDA", () => {
    const cases = [
      {
        name: "validateAmountInput",
        parts: replacePart(
          VALID_DEUDA_PARTS,
          1,
          "abc"
        ),
        errorKeys: ["MONTO_INVALIDO"]
      },
      {
        name: "validateCoinInput",
        parts: replacePart(
          VALID_DEUDA_PARTS,
          2,
          "EUR"
        ),
        errorKeys: ["MONEDA_INVALIDA"]
      },
      {
        name: "validateDetailInput",
        parts: replacePart(
          VALID_DEUDA_PARTS,
          3,
          "   "
        ),
        errorKeys: ["DETALLE_VACIO"]
      }
    ];

    test.each(cases)(
      "usa $name",
      ({ parts, errorKeys }) => {
        const app = createGasTestRuntime();
        const MSG_ERRORS = testUtils.getGlobal(
          app,
          "MSG_ERRORS"
        );

        invokeCommand(
          app,
          "DebtCommand",
          "handle",
          getChatId(app),
          parts
        );

        expectMessageErrors(
          app,
          MSG_ERRORS,
          errorKeys
        );

        expectSheetsEmpty(app, [
          "SHEET_DEUDAS"
        ]);

        expectNoState(app);
      }
    );
  });

  describe("DebtPaymentValidator / PAGO DEUDA", () => {
    test("usa validateAmountInput", () => {
      const app = createGasTestRuntime();
      const MSG_ERRORS = testUtils.getGlobal(
        app,
        "MSG_ERRORS"
      );

      const parts = replacePart(
        VALID_PAGO_DEUDA_PARTS,
        1,
        "abc"
      );

      invokeCommand(
        app,
        "DebtPaymentCommand",
        "handle",
        getChatId(app),
        parts
      );

      expectMessageErrors(
        app,
        MSG_ERRORS,
        ["MONTO_INVALIDO"]
      );

      expectSheetsEmpty(app, [
        "SHEET_PAGOS_DEUDAS",
        "SHEET_DEUDAS"
      ]);

      expectNoState(app);
    });
  });

  describe("CreditCardValidator / fechas de tarjeta", () => {
    test.each([
      "ULTIMO CIERRE",
      "ULTIMO VENCIMIENTO",
      "PROXIMO CIERRE",
      "PROXIMO VENCIMIENTO"
    ])(
      "%s usa la validación estricta de fecha",
      commandName => {
        const app = createGasTestRuntime();
        const MSG_ERRORS = testUtils.getGlobal(
          app,
          "MSG_ERRORS"
        );

        invokeCommand(
          app,
          "CreditCardCommand",
          "handleChangeDate",
          getChatId(app),
          [commandName, "31/02"],
          commandName
        );

        expectMessageErrors(
          app,
          MSG_ERRORS,
          ["FECHA_INVALIDA_STRICT"]
        );

        expectSheetsEmpty(app, [
          "SHEET_TARJETAS"
        ]);

        expectNoState(app);
      }
    );
  });

  describe("ReminderValidator / RECORDATORIO", () => {
    test("usa validateDetailInput para la descripción", () => {
      const app = createGasTestRuntime();
      const MSG_ERRORS = testUtils.getGlobal(
        app,
        "MSG_ERRORS"
      );

      invokeCommand(
        app,
        "ReminderCommand",
        "create",
        getChatId(app),
        ["RECORDATORIO", "   "]
      );

      expectMessageErrors(
        app,
        MSG_ERRORS,
        ["DETALLE_VACIO"]
      );

      expectSheetsEmpty(app, [
        "SHEET_RECORDATORIOS"
      ]);

      expectNoState(app);
    });

    test("usa validateType durante la selección del tipo", () => {
      const app = createGasTestRuntime();

      startReminder(app);
      app.sendMessage("99");

      expect(app.lastMessage()).toContain(
        "Número inválido"
      );

      expect(app.lastMessage()).toContain(
        "Elegí el TIPO"
      );

      expectSheetsEmpty(app, [
        "SHEET_RECORDATORIOS"
      ]);
    });

    test("usa validateWeekday en un recordatorio semanal", () => {
      const app = createGasTestRuntime();

      startReminder(app);
      app.sendMessage("2");
      app.sendMessage("Funday");

      expect(app.lastMessage()).toContain(
        "Día inválido"
      );

      expectSheetsEmpty(app, [
        "SHEET_RECORDATORIOS"
      ]);
    });

    test("usa validateEveryNDays en un recordatorio cada N días", () => {
      const app = createGasTestRuntime();

      startReminder(app);
      app.sendMessage("4");
      app.sendMessage("0");

      expect(app.lastMessage()).toContain(
        "Valor inválido. Escribí un número entero entre 1 y 365."
      );

      expectSheetsEmpty(app, [
        "SHEET_RECORDATORIOS"
      ]);
    });

    test("usa validateMonthDay en un recordatorio mensual", () => {
      const app = createGasTestRuntime();

      startReminder(app);
      app.sendMessage("5");
      app.sendMessage("32");

      expect(app.lastMessage()).toContain(
        "Día inválido. Escribí un número entero entre 1 y 31."
      );

      expectSheetsEmpty(app, [
        "SHEET_RECORDATORIOS"
      ]);
    });

    test("usa validateOnceDate en un recordatorio de fecha específica", () => {
      const app = createGasTestRuntime();

      startReminder(app);
      app.sendMessage("6");
      app.sendMessage("31/02");

      expect(app.lastMessage()).toContain(
        "Fecha inválida. Usá el formato dd/mm."
      );

      expectSheetsEmpty(app, [
        "SHEET_RECORDATORIOS"
      ]);
    });

    test.each([
      {
        name: "formato inválido",
        input: "abc",
        expectedMessage:
          "Hora inválida. Usá el formato HH:MM"
      },
      {
        name: "hora fuera de rango",
        input: "25:00",
        expectedMessage:
          "Hora fuera de rango"
      }
    ])(
      "usa validateTime ante $name",
      ({ input, expectedMessage }) => {
        const app = createGasTestRuntime();

        startReminder(app);
        app.sendMessage("1");
        app.sendMessage(input);

        expect(app.lastMessage()).toContain(
          expectedMessage
        );

        expectSheetsEmpty(app, [
          "SHEET_RECORDATORIOS"
        ]);
      }
    );
  });
});
