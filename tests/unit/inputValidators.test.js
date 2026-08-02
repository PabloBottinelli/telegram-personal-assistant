import { beforeEach, describe, expect, test } from "vitest";
import { createGasTestRuntime } from "../gasTestRuntime.js";
import * as testUtils from "../testUtils.js";

describe("Input Validators", () => {
  let app;
  let MSG_ERRORS;

  beforeEach(() => {
    app = createGasTestRuntime();
    MSG_ERRORS = testUtils.getGlobal(app, "MSG_ERRORS");
  });

  /**
   * Ejecuta un validator agregando automáticamente
   * el array de errores como último argumento.
   */
  function callValidator(name, ...args) {
    const validator = testUtils.getGlobal(app, name);
    const errores = [];

    const result = validator(...args, errores);

    return {
      result,
      errores
    };
  }

  /**
   * Comprueba que una entrada sea válida y devuelve
   * el resultado normalizado por el validator.
   */
  function expectValid(name, args, expectedResult) {
    const { result, errores } = callValidator(name, ...args);

    expect(errores).toEqual([]);
    expect(result).toEqual(expectedResult);

    return result;
  }

  /**
   * Comprueba que una entrada sea rechazada y que
   * agregue exactamente el error esperado.
   */
  function expectInvalid(name, args, expectedError) {
    const { result, errores } = callValidator(name, ...args);

    expect(result).toBeNull();
    expect(errores).toEqual([expectedError]);
  }

  describe("validateDateInput", () => {
    test("interpreta - como la fecha actual al mediodía", () => {
      const now = new Date();

      const { result, errores } = callValidator(
        "validateDateInput",
        "-"
      );

      expect(errores).toEqual([]);
      expect(result).toBeInstanceOf(Date);

      expect(result.getFullYear()).toBe(now.getFullYear());
      expect(result.getMonth()).toBe(now.getMonth());
      expect(result.getDate()).toBe(now.getDate());

      testUtils.checkHours(result);
    });

    test("tolera espacios alrededor de -", () => {
      const now = new Date();

      const { result, errores } = callValidator(
        "validateDateInput",
        "  -  "
      );

      expect(errores).toEqual([]);
      expect(result).toBeInstanceOf(Date);

      expect(result.getFullYear()).toBe(now.getFullYear());
      expect(result.getMonth()).toBe(now.getMonth());
      expect(result.getDate()).toBe(now.getDate());

      testUtils.checkHours(result);
    });

    test("valida correctamente una fecha existente", () => {
      const { result, errores } = callValidator(
        "validateDateInput",
        "10/06"
      );

      expect(errores).toEqual([]);
      expect(result).toBeInstanceOf(Date);

      expect(result.getDate()).toBe(10);
      expect(result.getMonth()).toBe(5);

      testUtils.checkHours(result);
    });

    test.each([
      "31/02",
      "00/06",
      "10/13",
      "32/01",
      "abc",
      "",
      "   ",
      null,
      undefined
    ])("rechaza la fecha inválida %j", input => {
      expectInvalid(
        "validateDateInput",
        [input],
        MSG_ERRORS.FECHA_INVALIDA
      );
    });
  });

  describe("validateAmountInput", () => {
    test.each([
      ["1000", 1000],
      ["1000.50", 1000.5],
      ["1000,50", 1000.5],
      ["0.01", 0.01],
      ["0,01", 0.01],
      [" 1000 ", 1000]
    ])("valida y normaliza %j como %s", (input, expected) => {
      expectValid(
        "validateAmountInput",
        [input],
        expected
      );
    });

    test.each([
      "",
      "   ",
      "0",
      "0.0",
      "0,00",
      "-1",
      "-1000",
      "abc",
      "10a",
      "1.2.3",
      "1,2,3",
      "$1000",
      null,
      undefined
    ])("rechaza el monto inválido %j", input => {
      expectInvalid(
        "validateAmountInput",
        [input],
        MSG_ERRORS.MONTO_INVALIDO
      );
    });
  });

  describe("validateCoinInput", () => {
    test.each([
      ["ARS", "ARS"],
      ["ars", "ARS"],
      ["Ars", "ARS"],
      ["USD", "USD"],
      ["usd", "USD"],
      ["Usd", "USD"],
      ["USDT", "USDT"],
      ["usdt", "USDT"]
    ])("valida y normaliza %j como %s", (input, expected) => {
      expectValid(
        "validateCoinInput",
        [input],
        expected
      );
    });

    test.each([
      "",
      "   ",
      "EUR",
      "PESO",
      "ARSs",
      "DOLAR",
      "$",
      null,
      undefined
    ])("rechaza la moneda inválida %j", input => {
      expectInvalid(
        "validateCoinInput",
        [input],
        MSG_ERRORS.MONEDA_INVALIDA
      );
    });
  });

  describe("validateMethodInput", () => {
    test.each([
      "Efectivo",
      "Transferencia",
      "BBVA Visa",
      "Mercado Pago"
    ])("acepta el método no vacío %j", input => {
      expectValid(
        "validateMethodInput",
        [input],
        input
      );
    });

    test.each([
      "",
      "   ",
      null,
      undefined
    ])("rechaza el método vacío %j", input => {
      expectInvalid(
        "validateMethodInput",
        [input],
        MSG_ERRORS.METODO_INVALIDO
      );
    });
  });

  describe("validateSavingInput", () => {
    describe("ahorro expresado como monto", () => {
      test.each([
        [12000, "0", 0],
        [12000, "1500", 1500],
        [12000, "1500.50", 1500.5],
        [12000, "1500,50", 1500.5],
        [12000, " 1500 ", 1500]
      ])(
        "valida %j sobre un monto base de %s",
        (montoBase, ahorro, expected) => {
          expectValid(
            "validateSavingInput",
            [montoBase, ahorro],
            expected
          );
        }
      );

      test("redondea un monto a dos decimales", () => {
        expectValid(
          "validateSavingInput",
          [12000, "1500.555"],
          1500.56
        );
      });
    });

    describe("ahorro expresado como porcentaje", () => {
      test.each([
        [12000, "10%", 1200],
        [12000, "12,5%", 1500],
        [12000, "12.5%", 1500],
        [1000, "33,333%", 333.33],
        [1000, " 10% ", 100]
      ])(
        "calcula %j sobre %s como %s",
        (montoBase, porcentaje, expected) => {
          expectValid(
            "validateSavingInput",
            [montoBase, porcentaje],
            expected
          );
        }
      );

      test("rechaza un porcentaje igual a cero", () => {
        expectInvalid(
          "validateSavingInput",
          [12000, "0%"],
          MSG_ERRORS.PORCENTAJE_INVALIDO
        );
      });

      test.each([
        NaN,
        Infinity,
        -Infinity
      ])(
        "rechaza un monto base inválido: %s",
        montoBase => {
          expectInvalid(
            "validateSavingInput",
            [montoBase, "10%"],
            MSG_ERRORS.MONTO_BASE_INVALIDO
          );
        }
      );
    });

    test.each([
      "",
      "   ",
      "abc",
      "-100",
      "-10%",
      "$100",
      "10%%",
      "%",
      "1.2.3",
      "1,2,3",
      null,
      undefined
    ])("rechaza el ahorro inválido %j", input => {
      expectInvalid(
        "validateSavingInput",
        [12000, input],
        MSG_ERRORS.AHORRO_INVALIDO
      );
    });
  });

  describe("validateRefundInput", () => {
    describe("tipo sin descuento ni reintegro", () => {
      test("acepta tipo - con ahorro 0 y reintegrado -", () => {
        expectValid(
          "validateRefundInput",
          ["-", "-", 0],
          true
        );
      });

      test("rechaza tipo - cuando existe ahorro", () => {
        expectInvalid(
          "validateRefundInput",
          ["-", "-", 100],
          MSG_ERRORS.REFUND_INPUT_INVALIDO_1
        );
      });

      test.each([
        "Sí",
        "Si",
        "No",
        "",
        null
      ])(
        "rechaza tipo - con reintegrado %j",
        reintegrado => {
          expectInvalid(
            "validateRefundInput",
            [reintegrado, "-", 0],
            MSG_ERRORS.REFUND_INPUT_INVALIDO_2
          );
        }
      );
    });

    describe("descuento", () => {
      test.each([
        ["-", true],
        ["Sí", true],
        ["Si", true],
        ["sí", true],
        ["si", true]
      ])(
        "acepta descuento con reintegrado %j",
        (reintegrado, expected) => {
          expectValid(
            "validateRefundInput",
            [reintegrado, "D", 100],
            expected
          );
        }
      );

      test("normaliza el tipo descuento escrito en minúscula", () => {
        expectValid(
          "validateRefundInput",
          ["Sí", "d", 100],
          true
        );
      });

      test.each([
        "No",
        "no",
        "Pendiente",
        "",
        null
      ])(
        "rechaza descuento con reintegrado %j",
        reintegrado => {
          expectInvalid(
            "validateRefundInput",
            [reintegrado, "D", 100],
            MSG_ERRORS.REFUND_INPUT_INVALIDO_3
          );
        }
      );
    });

    describe("reintegro", () => {
      test.each([
        ["Sí", true],
        ["Si", true],
        ["sí", true],
        ["si", true],
        ["No", false],
        ["no", false]
      ])(
        "valida reintegro con respuesta %j como %s",
        (reintegrado, expected) => {
          expectValid(
            "validateRefundInput",
            [reintegrado, "R", 100],
            expected
          );
        }
      );

      test("normaliza el tipo reintegro escrito en minúscula", () => {
        expectValid(
          "validateRefundInput",
          ["No", "r", 100],
          false
        );
      });

      test.each([
        0,
        -1,
        null,
        undefined
      ])(
        "rechaza un reintegro con ahorro inválido %j",
        ahorro => {
          expectInvalid(
            "validateRefundInput",
            ["No", "R", ahorro],
            MSG_ERRORS.REFUND_INPUT_INVALIDO_4
          );
        }
      );

      test.each([
        "-",
        "",
        "Pendiente",
        "Tal vez",
        null,
        undefined
      ])(
        "rechaza un reintegro con respuesta inválida %j",
        reintegrado => {
          expectInvalid(
            "validateRefundInput",
            [reintegrado, "R", 100],
            MSG_ERRORS.REFUND_INPUT_INVALIDO_5
          );
        }
      );
    });

    test.each([
      "X",
      "DESCUENTO",
      "REINTEGRO",
      "",
      null,
      undefined
    ])("rechaza el tipo desconocido %j", tipo => {
      expectInvalid(
        "validateRefundInput",
        ["-", tipo, 0],
        MSG_ERRORS.VALOR_REINTEGRO_INVALIDO
      );
    });
  });

  describe("validateQuotaInput", () => {
    test.each([
      ["1", 1],
      ["3", 3],
      ["12", 12],
      [1, 1],
      [3, 3],
      [" 3 ", 3]
    ])("valida %j como %s cuotas", (input, expected) => {
      expectValid(
        "validateQuotaInput",
        [input],
        expected
      );
    });

    test.each([
      "0",
      0,
      "-1",
      -1,
      "1.5",
      1.5,
      "abc",
      "",
      "   ",
      null,
      undefined
    ])("rechaza la cantidad de cuotas inválida %j", input => {
      expectInvalid(
        "validateQuotaInput",
        [input],
        MSG_ERRORS.CUOTAS_INVALIDO
      );
    });
  });

  describe("validateTypeInput", () => {
    test.each([
      ["D", "D"],
      ["d", "D"],
      ["R", "R"],
      ["r", "R"],
      ["-", "-"]
    ])("valida y normaliza %j como %s", (input, expected) => {
      expectValid(
        "validateTypeInput",
        [input],
        expected
      );
    });

    test.each([
      "",
      "   ",
      "X",
      "DESCUENTO",
      "REINTEGRO",
      "DR",
      null,
      undefined
    ])("rechaza el tipo inválido %j", input => {
      expectInvalid(
        "validateTypeInput",
        [input],
        MSG_ERRORS.TIPO_INVALIDO
      );
    });
  });

  describe("validateDetailInput", () => {
    test.each([
      ["Compra supermercado", "Compra supermercado"],
      ["  Compra supermercado  ", "Compra supermercado"],
      ["Cena", "Cena"],
      ["Detalle con números 123", "Detalle con números 123"]
    ])("valida y normaliza %j", (input, expected) => {
      expectValid(
        "validateDetailInput",
        [input],
        expected
      );
    });

    test.each([
      "",
      "   ",
      null,
      undefined
    ])("rechaza el detalle vacío %j", input => {
      expectInvalid(
        "validateDetailInput",
        [input],
        MSG_ERRORS.DETALLE_VACIO
      );
    });
  });
});