import { describe, expect, test } from "vitest";
import { createGasTestRuntime } from "../gasTestRuntime.js";
import * as testUtils from "../testUtils.js";

describe("DEUDAS", () => {
  test("deuda tira error si la cantidad de lineas es erronea", () => {
    const app = createGasTestRuntime()
    const COMMANDS = testUtils.getGlobal(app, "COMMANDS");

    app.sendMessage("Deuda \n a")

    expect(app.lastMessage()).toContain(COMMANDS["DEUDA"].format_indication)
  })  

  test("deudas tira error si la cantidad de lineas es erronea", () => {
    const app = createGasTestRuntime()
    const COMMANDS = testUtils.getGlobal(app, "COMMANDS");

    app.sendMessage("Deudas \n a")

    expect(app.lastMessage()).toContain(COMMANDS["DEUDAS"].format_indication)
  })  

  test("deudores tira error si la cantidad de lineas es erronea", () => {
    const app = createGasTestRuntime()
    const COMMANDS = testUtils.getGlobal(app, "COMMANDS");

    app.sendMessage("DEUDORES \n a")

    expect(app.lastMessage()).toContain(COMMANDS["DEUDORES"].format_indication)
  })  

  test("deudores lista correctamente los deudores", () => {
    const app = createGasTestRuntime()

    testUtils.seedDeudores(app)

    app.sendMessage("DEUDORES")

    expect(app.lastMessage()).toContain("Juan")
    expect(app.lastMessage()).toContain("Galicia")
  })  

  test("pago deuda tira error si la cantidad de lineas es erronea", () => {
    const app = createGasTestRuntime()
    const COMMANDS = testUtils.getGlobal(app, "COMMANDS");

    app.sendMessage("pago deuda")

    expect(app.lastMessage()).toContain(COMMANDS["PAGO DEUDA"].format_indication)
  })  


  test("guarda una deuda simple sin gasto asociado correctamente", () => {
    const app = createGasTestRuntime();

    testUtils.seedDeudores(app);

    app.sendMessage(testUtils.fullDeuda());

    expect(app.lastMessage()).toContain("Seleccioná un deudor");
    expect(app.lastMessage()).toContain("Galicia");

    app.sendMessage("1");

    expect(app.lastMessage()).toContain("Deuda creada");

    const deudas = testUtils.sheetRowsByConfig(app, "SHEET_DEUDAS");

    expect(deudas).toHaveLength(1);

    const deuda = testUtils.sheetObjects(app, "SHEET_DEUDAS")[0]

    testUtils.expectSameDay(deuda["Fecha"]);
    testUtils.checkHours(deuda["Fecha"])
    expect(deuda["Persona/Entidad"]).toBe("Galicia");
    expect(deuda["Monto"]).toBe(100000);
    expect(deuda["Moneda"]).toBe("ARS");
    expect(deuda["Monto Pendiente"]).toBe(100000);
    expect(deuda["Detalle"]).toBe("Prestamo");
    expect(deuda["Estado"]).toBe("Pendiente");
    expect(deuda["ID"]).toContain("DEU");
    expect(deuda["Gasto ID"]).toBe("");
  });

  test("no se guarda con input inválido", () => {
    const app = createGasTestRuntime();

    testUtils.seedDeudores(app);

    app.sendMessage(testUtils.fullDeuda({
      monto: "-2",
      moneda: "arsf"
    }));

    expect(app.lastMessage()).toContain("Monto inválido");
    expect(app.lastMessage()).toContain("Moneda inválida");

    expect(testUtils.sheetRowsByConfig(app, "SHEET_DEUDAS")).toHaveLength(0);
  });

  test("si elige un deudor inválido, no guarda y permite reintentar", () => {
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

    expect(app.lastMessage()).toContain("Deuda creada");

    const deudas = testUtils.sheetRowsByConfig(app, "SHEET_DEUDAS");
    expect(deudas).toHaveLength(1);

    const deuda = testUtils.sheetObjects(app, "SHEET_DEUDAS")[0];

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
    expect(pago["Persona/Entidad"]).toBe("Galicia");
    expect(pago["Monto"]).toBe(40000);
    expect(pago["Moneda"]).toBe("ARS");
    expect(pago["Deuda ID"]).toBe(deuda["ID"]);
  });

  test("PAGO DEUDA total crea pago y salda la deuda", () => {
    const app = createGasTestRuntime();

    testUtils.seedDeudores(app);

    testUtils.crearDeudaDesdeBot(app, {
      monto: "100000",
      detalle: "Prestamo total"
    });

    app.sendMessage(testUtils.pagoDeuda({
      monto: "100000"
    }));

    app.sendMessage("1");

    expect(app.lastMessage()).toContain("Pago registrado");

    const deudas = testUtils.sheetRowsByConfig(app, "SHEET_DEUDAS");
    const pagos = testUtils.sheetRowsByConfig(app, "SHEET_PAGOS_DEUDAS");

    expect(deudas).toHaveLength(1);
    expect(pagos).toHaveLength(1);

    const deuda = testUtils.sheetObjects(app, "SHEET_DEUDAS")[0]

    expect(deuda["Monto Pendiente"]).toBe(0);
    expect(deuda["Estado"]).toContain("Saldada");
  });

  test("PAGO DEUDA mayor al monto pendiente no crea pago ni modifica deuda", () => {
    const app = createGasTestRuntime();

    testUtils.seedDeudores(app);

    testUtils.crearDeudaDesdeBot(app, {
      monto: "100000",
      detalle: "Prestamo mayor"
    });

    app.sendMessage(testUtils.pagoDeuda({
      monto: "150000"
    }));

    app.sendMessage("1");

    expect(app.lastMessage()).toContain("No pude registrar el pago");
    expect(app.lastMessage()).toContain("supera el monto pendiente");

    const pagos = testUtils.sheetRowsByConfig(app, "SHEET_PAGOS_DEUDAS");

    expect(pagos).toHaveLength(0);

    const deuda = testUtils.sheetObjects(app, "SHEET_DEUDAS")[0]

    expect(deuda["Monto Pendiente"]).toBe(100000);
    expect(deuda["Estado"]).toBe("Pendiente");
  });

  test("PAGO DEUDA con monto inválido no guarda pago", () => {
    const app = createGasTestRuntime();

    testUtils.seedDeudores(app);

    testUtils.crearDeudaDesdeBot(app, {
      monto: "100000",
      detalle: "Prestamo"
    });

    app.sendMessage(testUtils.pagoDeuda({
      monto: "-1"
    }));

    expect(app.lastMessage()).toContain("Monto inválido");
    expect(testUtils.sheetRowsByConfig(app, "SHEET_PAGOS_DEUDAS")).toHaveLength(0);
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

  test("PAGO DEUDA con varias deudas permite elegir cuál pagar", () => {
    const app = createGasTestRuntime();

    testUtils.seedDeudores(app);

    testUtils.crearDeudaDesdeBot(app, {
      monto: "100000",
      detalle: "Deuda uno"
    });

    testUtils.crearDeudaDesdeBot(app, {
      monto: "50000",
      detalle: "Deuda dos"
    });

    app.sendMessage(testUtils.pagoDeuda({
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
    expect(testUtils.sheetObjects(app, "SHEET_PAGOS_DEUDAS")).toHaveLength(0);

    const detalleOpcion2 = testUtils.getDetalleDeOpcion(app.lastMessage(), 2);
    app.sendMessage("2");

    expect(app.lastMessage()).toContain("Pago registrado");

    const pagos = testUtils.sheetObjects(app, "SHEET_PAGOS_DEUDAS");

    expect(pagos).toHaveLength(1);

    const deudasObj = testUtils.sheetObjects(app, "SHEET_DEUDAS")
    const deudaPagada = deudasObj.find(d => d["Detalle"] === detalleOpcion2);
    expect(deudaPagada["Monto Pendiente"]).toBe(
      deudaPagada["Monto"] - 20000
    );
  });
});