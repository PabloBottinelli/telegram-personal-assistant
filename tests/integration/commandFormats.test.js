import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createGasTestRuntime } from "../gasTestRuntime.js";
import * as testUtils from "../testUtils.js";

const formats = [
  {
    command: "GASTO", sheet: "SHEET_GASTOS", detailHeader: "Detalle",
    quickFields: ["GASTO", "100,50", "Efectivo", "pan, leche"],
    longFields: ["GASTO", "-", "100,50", "ARS", "Efectivo", "10,25", "pan, leche", "D", "-"],
    emptyFields: [[1, 2, "MONTO_INVALIDO"], [2, 4, "METODO_INVALIDO"], [3, 6, "DETALLE_VACIO"]]
  },
  {
    command: "INGRESO", sheet: "SHEET_INGRESOS", detailHeader: "Descripción",
    quickFields: ["INGRESO", "100,50", "pan, leche"],
    longFields: ["INGRESO", "-", "100,50", "ARS", "pan, leche"],
    emptyFields: [[1, 2, "MONTO_INVALIDO"], [2, 4, "DETALLE_VACIO"]]
  },
  {
    command: "TC", sheet: "SHEET_GASTOS", detailHeader: "Detalle",
    quickFields: ["TC", "100,50", "pan, leche"],
    longFields: ["TC", "-", "100,50", "ARS", "10,25", "2", "pan, leche", "D", "-"],
    emptyFields: [[1, 2, "MONTO_INVALIDO"], [2, 6, "DETALLE_VACIO"]]
  }
];

describe.each(formats)("Formatos de $command", format => {
  let app;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 10, 3, 12));
    app = createGasTestRuntime();
    testUtils.seedCategorias(app);
    if (format.command === "TC") testUtils.seedTarjetas(app);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function finishCreation(message, detail, longFormat = false) {
    app.sendMessage(message);
    expect(app.lastMessage()).toContain(testUtils.CATEGORIA_LISTA_HEADER);
    app.sendMessage(" 1 ");
    if (format.command === "TC") {
      expect(app.lastMessage()).toContain(testUtils.TARJETA_LISTA_HEADER);
      app.sendMessage(" 1 ");
    }

    const rows = testUtils.sheetObjects(app, format.sheet);
    expect(rows).toHaveLength(1);
    expect(rows[0]["Monto"]).toBe(100.5);
    expect(rows[0]["Moneda"]).toBe("ARS");
    expect(rows[0]["Categoría"]).toBe("Super");
    expect(rows[0][format.detailHeader]).toBe(detail);
    expect(rows[0]["Fecha"]).toEqual(new Date(2026, 10, 3, 12));
    if (format.command !== "INGRESO") {
      expect(rows[0]["Medio de pago"]).toBe(format.command === "TC" ? "BBVA Visa" : "Efectivo");
      expect(rows[0]["Ahorro"]).toBe(longFormat ? 10.25 : 0);
    }
    if (format.command === "TC") {
      const debts = testUtils.sheetObjects(app, "SHEET_CUOTAS");
      expect(debts).toHaveLength(1);
      expect(debts[0]["Monto"]).toBe(longFormat ? 90.25 : 100.5);
      expect(debts[0]["#Cuotas"]).toBe(longFormat ? 2 : 1);
      expect(debts[0]["Gasto ID"]).toBe(rows[0]["ID"]);
      expect(debts[0]["Detalle"]).toBe(detail);
    }
  }

  function expectRejected(message, errorKey) {
    app.sendMessage(message);
    expect(app.lastMessage()).toContain(testUtils.getGlobal(app, "MSG_ERRORS")[errorKey]);
    for (const sheet of ["SHEET_GASTOS", "SHEET_INGRESOS", "SHEET_CUOTAS"]) {
      expect(testUtils.sheetObjects(app, sheet)).toHaveLength(0);
    }
    const chatId = testUtils.getGlobal(app, "TELEGRAM_CHAT_ID");
    expect(testUtils.getGlobal(app, "loadState_")(chatId)).toBeNull();
  }

  test.each(["100,50", "100.50"])("rápido: guarda el decimal %s y el detalle completo", amount => {
    const detail = "pan,  leche,queso, frutas, yogur, avena, café, té";
    const fields = [...format.quickFields];
    fields[1] = amount;
    fields[fields.length - 1] = detail;
    finishCreation(fields.join(", "), detail);
  });

  test.each(["\n", "\r\n", "\r"])("largo: conserva valores y decimales con saltos %j", newline => {
    finishCreation(format.longFields.join(newline), "pan, leche", true);
  });

  test("conserva el formato corto por líneas", () => {
    finishCreation(format.quickFields.join("\n"), "pan, leche");
  });

  test.each(format.emptyFields)("un campo vacío (%s/%s) produce %s sin iniciar una operación", (quickIndex, longIndex, errorKey) => {
    for (const [source, index, separator] of [
      [format.quickFields, quickIndex, ", "], [format.longFields, longIndex, "\n"]
    ]) {
      const fields = [...source];
      fields[index] = "";
      expectRejected(fields.join(separator), errorKey);
    }
  });

  test("rechaza campos faltantes en el formato rápido", () => {
    expectRejected(format.quickFields.slice(0, -1).join(", "), "MSG_FORMAT_ERROR_BASE");
  });

  test("rechaza separadores de campos sin espacio", () => {
    expectRejected(format.quickFields.join(","), "INVALID_COMMAND");
  });

  test("la ayuda indica separadores y decimales permitidos", () => {
    app.sendMessage(format.command);
    expect(app.lastMessage()).toContain("Separá los campos con coma y espacio");
    expect(app.lastMessage()).toContain("100,50 o 100.50");
  });
});
