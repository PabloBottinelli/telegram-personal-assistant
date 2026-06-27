import { describe, expect, test } from "vitest";
import { createGasTestRuntime } from "../gasTestRuntime.js";
import { rowToObject, getGlobal, appendRowsByConfig, sheetRowsByConfig } from "../testUtils.js";

function fullDeuda({
  monto = "100000",
  moneda = "ARS",
  detalle = "Prestamo"
} = {}) {
  return ["DEUDA", monto, moneda, detalle].join("\n");
}

function pagoDeuda({
  monto = "40000"
} = {}) {
  return ["PAGO DEUDA", monto].join("\n");
}

function seedDeudores(app, rows = [["Galicia", "DEUDOR-1"], ["Juan", "DEUDOR-2"]]) {
  appendRowsByConfig(app, "SHEET_DEUDORES", rows);
}

function expectSameDay(actualDate, expectedDate = new Date()) {
  expect(actualDate).toBeInstanceOf(Date);
  expect(actualDate.getDate()).toBe(expectedDate.getDate());
  expect(actualDate.getMonth()).toBe(expectedDate.getMonth());
  expect(actualDate.getFullYear()).toBe(expectedDate.getFullYear());
}

function crearDeudaDesdeBot(app, {
  deudorIndex = "1",
  monto = "100000",
  moneda = "ARS",
  detalle = "Prestamo"
} = {}) {
  app.sendMessage(fullDeuda({ monto, moneda, detalle }));
  expect(app.lastMessage()).toContain("Elegí el deudor");

  app.sendMessage(deudorIndex);
  expect(app.lastMessage()).toContain("Deuda creada");
}

function getDetalleDeOpcion(msg, optionNumber) {
  const regex = new RegExp(
    `${optionNumber}\\.([\\s\\S]*?)(?=\\n\\d+\\.|O escribí CANCELAR|$)`
  );

  const match = msg.match(regex);

  if (!match) {
    throw new Error(`No encontré la opción ${optionNumber} en el mensaje:\n${msg}`);
  }

  const block = match[1];

  const detalleMatch = block.match(/Detalle:\s*(.+)/);

  if (!detalleMatch) {
    throw new Error(`No encontré detalle en la opción ${optionNumber}:\n${block}`);
  }

  return detalleMatch[1].trim();
}

describe("DEUDAS", () => {
  test("guarda una deuda simple sin gasto asociado correctamente", () => {
    const app = createGasTestRuntime();

    seedDeudores(app);

    app.sendMessage(fullDeuda());

    expect(app.lastMessage()).toContain("Elegí el deudor");
    expect(app.lastMessage()).toContain("Galicia");

    app.sendMessage("1");

    expect(app.lastMessage()).toContain("Deuda creada");

    const deudas = sheetRowsByConfig(app, "SHEET_DEUDAS");

    expect(deudas).toHaveLength(1);

    const SHEET_DEUDAS = getGlobal(app, "SHEET_DEUDAS");
    const deuda = rowToObject(SHEET_DEUDAS.headers, deudas[0]);

    expectSameDay(deuda["Fecha"]);
    expect(deuda["Persona/Entidad"]).toBe("Galicia");
    expect(deuda["Monto"]).toBe(100000);
    expect(deuda["Moneda"]).toBe("ARS");
    expect(deuda["Monto Pendiente"]).toBe(100000);
    expect(deuda["Detalle"]).toBe("Prestamo");
    expect(deuda["Estado"]).toBe("Pendiente");
    expect(deuda["Deuda ID"]).toContain("DEU");
    expect(deuda["Gasto ID"]).toBe("");
  });

  test("no se guarda con input inválido", () => {
    const app = createGasTestRuntime();

    seedDeudores(app);

    app.sendMessage(fullDeuda({
      monto: "-2",
      moneda: "arsf"
    }));

    expect(app.lastMessage()).toContain("Monto inválido");
    expect(app.lastMessage()).toContain("Moneda inválida");

    expect(sheetRowsByConfig(app, "SHEET_DEUDAS")).toHaveLength(0);
  });

  test("si elige un deudor inválido, no guarda y permite reintentar", () => {
    const app = createGasTestRuntime();

    seedDeudores(app);

    app.sendMessage(fullDeuda());

    expect(app.lastMessage()).toContain("Elegí el deudor");

    app.sendMessage("99");

    const [errorMsg, listMsg] = app.lastMessages(2);
    expect(errorMsg).toContain("Número inválido");
    expect(listMsg).toContain("Elegí el deudor");
    expect(sheetRowsByConfig(app, "SHEET_DEUDAS")).toHaveLength(0);

    app.sendMessage("1");

    expect(app.lastMessage()).toContain("Deuda creada");

    const deudas = sheetRowsByConfig(app, "SHEET_DEUDAS");
    expect(deudas).toHaveLength(1);

    const SHEET_DEUDAS = getGlobal(app, "SHEET_DEUDAS");
    const deuda = rowToObject(SHEET_DEUDAS.headers, deudas[0]);

    expect(deuda["Persona/Entidad"]).toBe("Galicia");
    expect(deuda["Monto"]).toBe(100000);
  });

  test("DEUDAS sin deudas pendientes devuelve mensaje esperado", () => {
    const app = createGasTestRuntime();

    app.sendMessage("DEUDAS");

    expect(app.lastMessage()).toContain("No hay deudas pendientes");
  });

  test("DEUDAS lista deudas pendientes agrupadas por persona", () => {
    const app = createGasTestRuntime();

    seedDeudores(app);

    crearDeudaDesdeBot(app, {
      deudorIndex: "1",
      monto: "100000",
      detalle: "Prestamo Galicia 1"
    });

    crearDeudaDesdeBot(app, {
      deudorIndex: "1",
      monto: "50000",
      detalle: "Prestamo Galicia 2"
    });

    crearDeudaDesdeBot(app, {
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

  test("PAGO DEUDA parcial crea pago y actualiza monto pendiente", () => {
    const app = createGasTestRuntime();

    seedDeudores(app);

    crearDeudaDesdeBot(app, {
      monto: "100000",
      detalle: "Prestamo parcial"
    });

    app.sendMessage(pagoDeuda());

    expect(app.lastMessage()).toContain("Elegí el deudor");
    expect(app.lastMessage()).toContain("Galicia");

    app.sendMessage("1");

    expect(app.lastMessage()).toContain("Pago registrado");
    expect(app.lastMessage()).toContain("Pendiente nuevo");

    const deudas = sheetRowsByConfig(app, "SHEET_DEUDAS");
    const pagos = sheetRowsByConfig(app, "SHEET_PAGOS_DEUDAS");

    expect(deudas).toHaveLength(1);
    expect(pagos).toHaveLength(1);

    const SHEET_DEUDAS = getGlobal(app, "SHEET_DEUDAS");
    const SHEET_PAGOS_DEUDAS = getGlobal(app, "SHEET_PAGOS_DEUDAS");

    const deuda = rowToObject(SHEET_DEUDAS.headers, deudas[0]);
    const pago = rowToObject(SHEET_PAGOS_DEUDAS.headers, pagos[0]);

    expect(deuda["Monto Pendiente"]).toBe(60000);
    expect(deuda["Estado"]).toBe("Pendiente");

    expectSameDay(pago["Fecha"]);
    expect(pago["Persona/Entidad"]).toBe("Galicia");
    expect(pago["Monto"]).toBe(40000);
    expect(pago["Moneda"]).toBe("ARS");
    expect(pago["Deuda ID"]).toBe(deuda["Deuda ID"]);
  });

  test("PAGO DEUDA total crea pago y salda la deuda", () => {
    const app = createGasTestRuntime();

    seedDeudores(app);

    crearDeudaDesdeBot(app, {
      monto: "100000",
      detalle: "Prestamo total"
    });

    app.sendMessage(pagoDeuda({
      monto: "100000"
    }));

    app.sendMessage("1");

    expect(app.lastMessage()).toContain("Pago registrado");

    const deudas = sheetRowsByConfig(app, "SHEET_DEUDAS");
    const pagos = sheetRowsByConfig(app, "SHEET_PAGOS_DEUDAS");

    expect(deudas).toHaveLength(1);
    expect(pagos).toHaveLength(1);

    const SHEET_DEUDAS = getGlobal(app, "SHEET_DEUDAS");
    const deuda = rowToObject(SHEET_DEUDAS.headers, deudas[0]);

    expect(deuda["Monto Pendiente"]).toBe(0);
    expect(deuda["Estado"]).toContain("Saldada");
  });

  test("PAGO DEUDA mayor al monto pendiente no crea pago ni modifica deuda", () => {
    const app = createGasTestRuntime();

    seedDeudores(app);

    crearDeudaDesdeBot(app, {
      monto: "100000",
      detalle: "Prestamo mayor"
    });

    app.sendMessage(pagoDeuda({
      monto: "150000"
    }));

    app.sendMessage("1");

    expect(app.lastMessage()).toContain("No pude registrar el pago");
    expect(app.lastMessage()).toContain("supera el monto pendiente");

    const deudas = sheetRowsByConfig(app, "SHEET_DEUDAS");
    const pagos = sheetRowsByConfig(app, "SHEET_PAGOS_DEUDAS");

    expect(pagos).toHaveLength(0);

    const SHEET_DEUDAS = getGlobal(app, "SHEET_DEUDAS");
    const deuda = rowToObject(SHEET_DEUDAS.headers, deudas[0]);

    expect(deuda["Monto Pendiente"]).toBe(100000);
    expect(deuda["Estado"]).toBe("Pendiente");
  });

  test("PAGO DEUDA con monto inválido no guarda pago", () => {
    const app = createGasTestRuntime();

    seedDeudores(app);

    crearDeudaDesdeBot(app, {
      monto: "100000",
      detalle: "Prestamo"
    });

    app.sendMessage(pagoDeuda({
      monto: "-1"
    }));

    expect(app.lastMessage()).toContain("Monto inválido");
    expect(sheetRowsByConfig(app, "SHEET_PAGOS_DEUDAS")).toHaveLength(0);
  });

  test("PAGO DEUDA con deudor sin deudas activas responde mensaje y no crea pago", () => {
    const app = createGasTestRuntime();

    seedDeudores(app);

    app.sendMessage(pagoDeuda({
      monto: "10000"
    }));

    expect(app.lastMessage()).toContain("Elegí el deudor escribiendo");

    app.sendMessage("1");

    expect(app.lastMessage()).toContain("No hay deudas pendientes para Galicia");
    expect(sheetRowsByConfig(app, "SHEET_PAGOS_DEUDAS")).toHaveLength(0);
  });

  test("PAGO DEUDA con varias deudas permite elegir cuál pagar", () => {
    const app = createGasTestRuntime();

    seedDeudores(app);

    crearDeudaDesdeBot(app, {
      monto: "100000",
      detalle: "Deuda uno"
    });

    crearDeudaDesdeBot(app, {
      monto: "50000",
      detalle: "Deuda dos"
    });

    app.sendMessage(pagoDeuda({
      monto: "20000"
    }));

    app.sendMessage("1"); // Galicia

    expect(app.lastMessage()).toContain("Galicia tiene varias deudas pendientes");
    expect(app.lastMessage()).toContain("Elegí cuál querés pagar");
    expect(app.lastMessage()).toContain("Deuda uno");
    expect(app.lastMessage()).toContain("Deuda dos");

    app.sendMessage("99");

    const [errorMsg, listMsg] = app.lastMessages(2);
    expect(errorMsg).toContain("Número inválido");
    expect(listMsg).toContain("Galicia tiene varias deudas pendientes");
    expect(sheetRowsByConfig(app, "SHEET_PAGOS_DEUDAS")).toHaveLength(0);

    const detalleOpcion2 = getDetalleDeOpcion(app.lastMessage(), 2);
    app.sendMessage("2");

    expect(app.lastMessage()).toContain("Pago registrado");

    const deudas = sheetRowsByConfig(app, "SHEET_DEUDAS");
    const pagos = sheetRowsByConfig(app, "SHEET_PAGOS_DEUDAS");

    expect(pagos).toHaveLength(1);
    const SHEET_DEUDAS = getGlobal(app, "SHEET_DEUDAS");

    const deudasObj = deudas.map(row => rowToObject(SHEET_DEUDAS.headers, row));
    const deudaPagada = deudasObj.find(d => d["Detalle"] === detalleOpcion2);
    expect(deudaPagada["Monto Pendiente"]).toBe(
      deudaPagada["Monto"] - 20000
    );
  });
});