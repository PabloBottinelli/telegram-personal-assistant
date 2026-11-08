import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createGasTestRuntime } from "../gasTestRuntime.js";
import * as testUtils from "../testUtils.js";

describe("Totals", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 23, 12));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  test("Mes inválido devuelve mensaje de error y no calcula totales", () => {
    const app = createGasTestRuntime();

    const MSG_ERRORS = testUtils.getGlobal(app, "MSG_ERRORS");

    app.sendMessage([
      "TOTALES",
      "mes-inexistente"
    ].join("\n"));

    expect(app.lastMessage()).toContain(MSG_ERRORS.INVALID_MONTH);
  });

  test("TOTALES rechaza un mes con coma decimal", () => {
    const app = createGasTestRuntime();
    const MSG_ERRORS = testUtils.getGlobal(app, "MSG_ERRORS");

    app.sendMessage([
      "TOTALES",
      "6,5"
    ].join("\n"));

    expect(app.lastMessage()).toContain(MSG_ERRORS.INVALID_MONTH);
  });

  test("TOTALES rechaza un float como mes", () => {
    const app = createGasTestRuntime();
    const MSG_ERRORS = testUtils.getGlobal(app, "MSG_ERRORS");

    app.sendMessage([
      "TOTALES",
      "6.5"
    ].join("\n"));

    expect(app.lastMessage()).toContain(MSG_ERRORS.INVALID_MONTH);
  });

  test.todo("Mes futuro tira error", () => {
    const app = createGasTestRuntime();

    app.sendMessage([
      "TOTALES",
      "Diciembre"
    ].join("\n"));

    expect(app.lastMessage()).toContain("No se pueden calcular los totales de un mes futuro.");
  })

  test("Mes sin gastos ni ingresos devuelve todos los totales en cero", () => {
    const app = createGasTestRuntime();

    app.sendMessage([
      "TOTALES",
      "Junio"
    ].join("\n"));

    const msg = app.lastMessage();

    expect(msg).toContain("Totales de Junio de 2026:");
    expect(msg).toContain("Gastos del mes en pesos: $0,00");
    expect(msg).toContain("Gastos del mes en USD: 0,00 USD");
    expect(msg).toContain("Ingresos del mes en pesos: $0,00");
    expect(msg).toContain("Ingresos del mes en USD: 0,00 USD");
  });

  test("TOTALES acepta mes por número", () => {
    const app = createGasTestRuntime();

    testUtils.seedCategorias(app);

    testUtils.crearGastoDesdeBot(app, {
      catIndex: "1",
      fecha: "10/06",
      monto: "10000",
      moneda: "ARS",
      detalle: "Gasto junio"
    });

    app.sendMessage([
      "TOTALES",
      "6"
    ].join("\n"));

    const msg = app.lastMessage();

    expect(msg).toContain("Totales de Junio de 2026:");
    expect(msg).toContain("Gastos del mes en pesos: $10.000,00");
  });

  test("TOTALES acepta '-' como mes actual", () => {
    const app = createGasTestRuntime();

    testUtils.seedCategorias(app);

    const now = new Date();
    const dia = String(now.getDate()).padStart(2, "0");
    const mes = String(now.getMonth() + 1).padStart(2, "0");

    testUtils.crearGastoDesdeBot(app, {
      catIndex: "1",
      fecha: `${dia}/${mes}`,
      monto: "12345",
      moneda: "ARS",
      detalle: "Gasto mes actual"
    });

    app.sendMessage([
      "TOTALES",
      "-"
    ].join("\n"));

    const msg = app.lastMessage();

    expect(msg).toContain("Gastos del mes en pesos: $12.345,00");
  });
});
