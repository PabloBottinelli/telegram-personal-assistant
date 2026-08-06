import { describe, expect, should, test } from "vitest";
import { createGasTestRuntime } from "../gasTestRuntime.js";
import * as testUtils from "../testUtils.js";

describe("Debts", () => {
  test("DEUDAS lista deudas pendientes agrupadas por deudor", () => {
    const app = createGasTestRuntime();

    testUtils.seedDeudores(app);

    testUtils.crearDeudaDesdeBot(app, {
      deudorIndex: "1",
      monto: "100000",
      detalle: "Prestamo Galicia 1"
    });

    testUtils.crearDeudaDesdeBot(app, {
      deudorIndex: "1",
      monto: "50000",
      detalle: "Prestamo Galicia 2"
    });

    testUtils.crearDeudaDesdeBot(app, {
      deudorIndex: "2",
      monto: "30000",
      detalle: "Prestamo Juan"
    });

    app.sendMessage("DEUDAS");

    const msg = app.lastMessage();

    expect(msg).toContain("Galicia");
    expect(msg).toContain("Juan");
    expect(msg).toContain("Prestamo Galicia 1");
    expect(msg).toContain("Prestamo Galicia 2");
    expect(msg).toContain("Prestamo Juan");
    expect(msg).toContain("150.000");
    expect(msg).toContain("30.000");
  });

  test("DEUDAS sin deudas pendientes devuelve mensaje de aviso", () => {
    const app = createGasTestRuntime();

    app.sendMessage("DEUDAS");

    expect(app.lastMessage()).toContain("No hay deudas pendientes");
  });

  test.todo("Se puede eliminar una deuda")

  test.todo("Se puede editar una deuda")

  test("Se puede crear una deuda", () => {
    const app = createGasTestRuntime();

    testUtils.seedDeudores(app);

    app.sendMessage(testUtils.fullDeuda());

    expect(app.lastMessage()).toContain("Seleccioná un deudor");
    expect(app.lastMessage()).toContain("Galicia");

    app.sendMessage("1");

    expect(app.lastMessage()).toContain("Deuda registrada");

    const deudas = testUtils.sheetRowsByConfig(app, "SHEET_DEUDAS");

    expect(deudas).toHaveLength(1);

    const deuda = testUtils.sheetObjects(app, "SHEET_DEUDAS")[0]

    testUtils.expectSameDay(deuda["Fecha"]);
    testUtils.checkHours(deuda["Fecha"])
    expect(deuda["Deudor"]).toBe("Galicia");
    expect(deuda["Monto"]).toBe(100000);
    expect(deuda["Moneda"]).toBe("ARS");
    expect(deuda["Monto Pendiente"]).toBe(100000);
    expect(deuda["Detalle"]).toBe("Prestamo");
    expect(deuda["Estado"]).toBe("Pendiente");
    expect(deuda["ID"]).toContain("DEU");
    expect(deuda["Gasto ID"]).toBe("");
  });

  test.todo("Se puede crear una deuda en cuotas")

  test("Si elige un deudor inválido, no guarda y permite reintentar", () => {
    const app = createGasTestRuntime();

    testUtils.seedDeudores(app);

    app.sendMessage(testUtils.fullDeuda());

    expect(app.lastMessage()).toContain("Seleccioná un deudor");

    app.sendMessage("99");

    const [errorMsg, listMsg] = app.lastMessages(2);
    expect(errorMsg).toContain("Número inválido");
    expect(listMsg).toContain("Seleccioná un deudor");
    expect(testUtils.sheetRowsByConfig(app, "SHEET_DEUDAS")).toHaveLength(0);

    app.sendMessage("1");

    expect(app.lastMessage()).toContain("Deuda registrada");

    const deudas = testUtils.sheetRowsByConfig(app, "SHEET_DEUDAS");
    expect(deudas).toHaveLength(1);

    const deuda = testUtils.sheetObjects(app, "SHEET_DEUDAS")[0];

    expect(deuda["Deudor"]).toBe("Galicia");
    expect(deuda["Monto"]).toBe(100000);
  });

  test.todo("Se puede crear un nuevo deudor al crear una deuda")
});