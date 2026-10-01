import { describe, expect, should, test } from "vitest";
import { createGasTestRuntime } from "../gasTestRuntime.js";
import * as testUtils from "../testUtils.js";

describe("Debt Payments", () => {
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

  test("PAGO DEUDA con deudor sin deudas activas responde mensaje y no crea pago", () => {
    const app = createGasTestRuntime();

    testUtils.seedDeudores(app);

    app.sendMessage(testUtils.pagoDeuda({
      monto: "10000"
    }));

    expect(app.lastMessage()).toContain("Seleccioná un deudor escribiendo");

    app.sendMessage("1");

    expect(app.lastMessage()).toContain("No hay deudas pendientes para Galicia");
    expect(testUtils.sheetRowsByConfig(app, "SHEET_PAGOS_DEUDAS")).toHaveLength(0);
  });

  test("No permite crear un nuevo deudor", () => {
    const app = createGasTestRuntime();

    app.sendMessage(testUtils.pagoDeuda({
      monto: "10000"
    }));

    expect(app.lastMessage()).toContain("Seleccioná un deudor escribiendo");
    expect(app.lastMessage()).not.toContain("NUEVO");

    app.sendMessage("NUEVO Galicia");

    expect(app.lastMessages()[1]).toContain("No podes registrar una deuda sobre un deudor nuevo.");
    expect(app.lastMessage()).toContain("Seleccioná un deudor escribiendo");
    expect(testUtils.sheetRowsByConfig(app, "SHEET_PAGOS_DEUDAS")).toHaveLength(0);
    expect(testUtils.sheetRowsByConfig(app, "SHEET_DEUDORES")).toHaveLength(0);
  })

  test("PAGO DEUDA parcial crea pago y actualiza monto pendiente", () => {
    const app = createGasTestRuntime();

    testUtils.seedDeudores(app);

    testUtils.crearDeudaDesdeBot(app, {
      monto: "100000",
      detalle: "Prestamo parcial"
    });

    app.sendMessage(testUtils.pagoDeuda());

    expect(app.lastMessage()).toContain("Seleccioná un deudor");
    expect(app.lastMessage()).toContain("Galicia");

    app.sendMessage("1");

    expect(app.lastMessage()).toContain("Pago registrado");
    expect(app.lastMessage()).toContain("Pendiente nuevo");

    const deudas = testUtils.sheetRowsByConfig(app, "SHEET_DEUDAS");
    const pagos = testUtils.sheetRowsByConfig(app, "SHEET_PAGOS_DEUDAS");

    expect(deudas).toHaveLength(1);
    expect(pagos).toHaveLength(1);

    const deuda = testUtils.sheetObjects(app, "SHEET_DEUDAS")[0];
    const pago = testUtils.sheetObjects(app, "SHEET_PAGOS_DEUDAS")[0];

    expect(deuda["Monto Pendiente"]).toBe(60000);
    expect(deuda["Estado"]).toBe("Pendiente");

    testUtils.expectSameDay(pago["Fecha"]);
    expect(pago["Deudor"]).toBe("Galicia");
    expect(pago["Monto"]).toBe(40000);
    expect(pago["Moneda"]).toBe("ARS");
    expect(pago["Deuda ID"]).toBe(deuda["ID"]);
  });

  test("Si se paga el total de una deuda el monto pendiente queda en 0 y el estado pasa a saldada", () => {
    const app = createGasTestRuntime();

    testUtils.seedDeudores(app);

    testUtils.crearDeudaDesdeBot(app);

    app.sendMessage(testUtils.pagoDeuda({ monto: "100000" }));

    expect(app.lastMessage()).toContain("Seleccioná un deudor");
    expect(app.lastMessage()).toContain("Galicia");

    app.sendMessage("1");

    expect(app.lastMessage()).toContain("Pago registrado");
    expect(app.lastMessage()).toContain("Pendiente nuevo: $0,00");

    const deudas = testUtils.sheetRowsByConfig(app, "SHEET_DEUDAS");
    const pagos = testUtils.sheetRowsByConfig(app, "SHEET_PAGOS_DEUDAS");

    expect(deudas).toHaveLength(1);
    expect(pagos).toHaveLength(1);

    const deuda = testUtils.sheetObjects(app, "SHEET_DEUDAS")[0];
    const pago = testUtils.sheetObjects(app, "SHEET_PAGOS_DEUDAS")[0];

    expect(deuda["Monto Pendiente"]).toBe(0);
    expect(deuda["Estado"]).toBe("Saldada");

    testUtils.expectSameDay(pago["Fecha"]);
    expect(pago["Deudor"]).toBe("Galicia");
    expect(pago["Monto"]).toBe(100000);
    expect(pago["Moneda"]).toBe("ARS");
    expect(pago["Deuda ID"]).toBe(deuda["ID"]);
  })

  test("PAGO DEUDA mayor a la deuda pendiente no permite crear pago", () => {
    const app = createGasTestRuntime();

    testUtils.seedDeudores(app);

    testUtils.crearDeudaDesdeBot(app);

    app.sendMessage(testUtils.pagoDeuda({ monto: "110000" }));

    expect(app.lastMessage()).toContain("Seleccioná un deudor");
    expect(app.lastMessage()).toContain("Galicia");

    app.sendMessage("1");

    expect(app.lastMessage()).toContain("El pago supera el monto pendiente");

    const deudas = testUtils.sheetRowsByConfig(app, "SHEET_DEUDAS");
    const pagos = testUtils.sheetRowsByConfig(app, "SHEET_PAGOS_DEUDAS");

    expect(deudas).toHaveLength(1);
    expect(pagos).toHaveLength(0);
  });

  test.todo("PAGO DEUDA menor a la deuda total con varias deudas permite elegir deudas a pagar hasta llegar al monto ingresado");

  test.todo("Se permite pagar el valor de una cuota");

  test.todo("Deudas propias")

  test.todo("Se puede eliminar un pago de deuda")

  test.todo("Se puede editar un pago de deuda")

  test.todo("Se pueden listar los pagos de deuda")

  test.todo("Se puede pagar el total pendiente de una deuda sin ingresar el monto")

  test.todo("Pago deuda múltiple")
});