import { describe, expect, test } from "vitest";
import { createGasTestRuntime } from "../gasTestRuntime.js";
import * as testUtils from "../testUtils.js";

describe("Credit Card Expenses", () => {
  // Avisos y errores
  test("Si elige una categoría inválida, no guarda y permite reintentar", () => {
    const app = createGasTestRuntime();

    testUtils.seedCategorias(app);
    testUtils.seedTarjetas(app);

    app.sendMessage(testUtils.fullTC());

    app.sendMessage("30");

    const [errorMsg, listMsg] = app.lastMessages(2);
    expect(errorMsg).toContain("Número inválido");
    expect(listMsg).toContain("Seleccioná una categoría");

    expect(testUtils.sheetObjects(app, "SHEET_GASTOS")).toHaveLength(0);
    expect(testUtils.sheetObjects(app, "SHEET_CUOTAS")).toHaveLength(0);
    expect(testUtils.sheetObjects(app, "SHEET_DEUDAS")).toHaveLength(0);

    app.sendMessage("1");
    app.sendMessage("1");

    expect(app.lastMessage()).toContain("Gasto con tarjeta de crédito registrado");
    expect(testUtils.sheetObjects(app, "SHEET_GASTOS")).toHaveLength(1);
    expect(testUtils.sheetObjects(app, "SHEET_CUOTAS")).toHaveLength(1);
  });

  test("Si elige una tarjeta inválida, no guarda y permite reintentar", () => {
    const app = createGasTestRuntime();

    testUtils.seedCategorias(app);
    testUtils.seedTarjetas(app);

    app.sendMessage(testUtils.fullTC());

    app.sendMessage("1");

    expect(app.lastMessage()).toContain("BBVA Visa");

    app.sendMessage("99");

    const [errorMsg, listMsg] = app.lastMessages(2);
    expect(errorMsg).toContain("Número inválido");
    expect(listMsg).toContain("Seleccioná una tarjeta");

    expect(testUtils.sheetObjects(app, "SHEET_GASTOS")).toHaveLength(0);
    expect(testUtils.sheetObjects(app, "SHEET_CUOTAS")).toHaveLength(0);

    app.sendMessage("1");

    expect(app.lastMessage()).toContain("Gasto con tarjeta de crédito registrado");
    expect(testUtils.sheetObjects(app, "SHEET_GASTOS")).toHaveLength(1);
    expect(testUtils.sheetObjects(app, "SHEET_CUOTAS")).toHaveLength(1);
  });

  test("Si elige un deudor inválido, no guarda y permite reintentar", () => {
    const app = createGasTestRuntime();

    testUtils.seedCategorias(app);
    testUtils.seedTarjetas(app);
    testUtils.seedDeudores(app);

    app.sendMessage(testUtils.fullTC());

    app.sendMessage("2"); // Ajeno
    app.sendMessage("1"); // BBVA Visa

    expect(app.lastMessage()).toContain("Juan");

    app.sendMessage("99");

    const [errorMsg, listMsg] = app.lastMessages(2);
    expect(errorMsg).toContain("Número inválido");
    expect(listMsg).toContain("Seleccioná un deudor");

    expect(testUtils.sheetObjects(app, "SHEET_GASTOS")).toHaveLength(0);
    expect(testUtils.sheetObjects(app, "SHEET_CUOTAS")).toHaveLength(0);
    expect(testUtils.sheetObjects(app, "SHEET_DEUDAS")).toHaveLength(0);

    app.sendMessage("1");

    expect(app.lastMessage()).toContain("Gasto ajeno con tarjeta de crédito registrado");
    expect(app.lastMessage()).toContain("Deudor");
    expect(testUtils.sheetObjects(app, "SHEET_GASTOS")).toHaveLength(1);
    expect(testUtils.sheetObjects(app, "SHEET_CUOTAS")).toHaveLength(1);
    expect(testUtils.sheetObjects(app, "SHEET_DEUDAS")).toHaveLength(1);
  });

  // Gastos con tarjeta normales

  test("Una compra con tarjeta impacta correctamente en gastos de tarjeta y gastos", () => {
    const app = createGasTestRuntime();

    testUtils.seedCategorias(app);
    testUtils.seedTarjetas(app);

    app.sendMessage(testUtils.fullTC());

    const categoryMsg = app.lastMessage();

    expect(categoryMsg).toContain(testUtils.CATEGORIA_LISTA_HEADER);
    expect(categoryMsg).toContain(testUtils.CATEGORIA_LISTA_FOOTER);
    expect(categoryMsg).toContain("Super");
    expect(categoryMsg).toContain("Ajeno");
    expect(categoryMsg).toContain("Comida");

    app.sendMessage("1");

    const cardMsg = app.lastMessage();

    expect(cardMsg).toContain(testUtils.TARJETA_LISTA_HEADER);
    expect(cardMsg).toContain(testUtils.TARJETA_LISTA_FOOTER);
    expect(cardMsg).toContain("BBVA Visa");
    expect(cardMsg).toContain("Galicia Mastercard");

    app.sendMessage("1");

    expect(app.lastMessage()).toContain("Gasto con tarjeta de crédito registrado");

    const gastos = testUtils.sheetObjects(app, "SHEET_GASTOS");
    const deudasTarjeta = testUtils.sheetObjects(app, "SHEET_CUOTAS");

    expect(gastos).toHaveLength(1);
    expect(deudasTarjeta).toHaveLength(1);

    const gasto = gastos[0]
    const deudaTarjeta = deudasTarjeta[0]

    testUtils.checkHours(gasto["Fecha"])
    expect(gasto["Fecha"]).toBeInstanceOf(Date);
    expect(gasto["Fecha"].getDate()).toBe(10);
    expect(gasto["Fecha"].getMonth()).toBe(5);
    expect(gasto["Fecha"].getFullYear()).toBe(2026);
    expect(gasto["Categoría"]).toBe("Super");
    expect(gasto["Medio de pago"]).toBe("BBVA Visa");
    expect(gasto["Monto"]).toBe(12000);
    expect(gasto["Moneda"]).toBe("ARS");
    expect(gasto["Ahorro"]).toBe(0);
    expect(gasto["Detalle"]).toBe("Compra con tarjeta");
    expect(gasto["Tipo"]).toBe("-");
    expect(gasto["Reintegrado?"]).toBe(true);
    expect(gasto["ID"]).toMatch(/^GAS-/);

    testUtils.checkHours(deudaTarjeta["Fecha"])
    expect(deudaTarjeta["Medio de pago"]).toBe("BBVA Visa");
    expect(deudaTarjeta["Monto"]).toBe(12000);
    expect(deudaTarjeta["#Cuotas"]).toBe(3);
    expect(deudaTarjeta["#CuotasRestantes"]).toBe(3);
    expect(deudaTarjeta["Gasto ID"]).toBe(gasto["ID"]);
  });

  test("Formato rápido guarda correctamente una compra con TC con los valores predeterminados", () => {
    const app = createGasTestRuntime();

    testUtils.seedCategorias(app);
    testUtils.seedTarjetas(app);

    app.sendMessage([
      "TC",
      "12000",
      "Compra rápida TC"
    ].join("\n"));

    app.sendMessage("1"); // Super
    app.sendMessage("1"); // BBVA Visa

    expect(app.lastMessage()).toContain("Gasto con tarjeta de crédito registrado");

    const gastos = testUtils.sheetObjects(app, "SHEET_GASTOS");
    const deudasTarjeta = testUtils.sheetObjects(app, "SHEET_CUOTAS");

    expect(gastos).toHaveLength(1);
    expect(deudasTarjeta).toHaveLength(1);

    const gasto = gastos[0]
    const deudaTarjeta = deudasTarjeta[0]

    expect(gasto["Categoría"]).toBe("Super");
    expect(gasto["Medio de pago"]).toBe("BBVA Visa");
    expect(gasto["Monto"]).toBe(12000);
    expect(gasto["Detalle"]).toBe("Compra rápida TC");
    expect(gasto["ID"]).toMatch(/^GAS-/);

    expect(deudaTarjeta["Medio de pago"]).toBe("BBVA Visa");
    expect(deudaTarjeta["Monto"]).toBe(12000);
    expect(deudaTarjeta["Gasto ID"]).toBe(gasto["ID"]);
  });

  test("Permite crear una categoría nueva durante el flujo y la selecciona", () => {
    const app = createGasTestRuntime();

    testUtils.seedTarjetas(app);

    app.sendMessage(testUtils.fullTC());

    const categoryMsg = app.lastMessage();

    expect(categoryMsg).toContain(testUtils.CATEGORIA_LISTA_HEADER);
    expect(categoryMsg).toContain(testUtils.CATEGORIA_LISTA_FOOTER);

    app.sendMessage("NUEVA Super");

    expect(app.lastMessage()).toContain(testUtils.TARJETA_LISTA_HEADER);

    app.sendMessage("1");

    expect(app.lastMessage()).toContain("Gasto con tarjeta de crédito registrado");

    const gastos = testUtils.sheetObjects(app, "SHEET_GASTOS");
    const deudasTarjeta = testUtils.sheetObjects(app, "SHEET_CUOTAS");

    expect(gastos).toHaveLength(1);
    expect(deudasTarjeta).toHaveLength(1);

    const gasto = gastos[0]

    expect(gasto["Categoría"]).toBe("Super");
  });
  test.todo("Permite crear una tarjeta nueva durante el flujo y la selecciona");
  test.todo("Permite crear un deudor nuevo durante un gasto ajeno y lo selecciona");

  // Gastos especiales

  test("Si la categoría es AJENO, pide deudor y crea deuda vinculada por el total", () => {
    const app = createGasTestRuntime();

    testUtils.seedCategorias(app);
    testUtils.seedTarjetas(app);
    testUtils.seedDeudores(app);

    app.sendMessage(testUtils.fullTC());

    app.sendMessage("2"); // Ajeno
    app.sendMessage("1"); // BBVA Visa

    expect(app.lastMessage()).toContain("Seleccioná un deudor");
    expect(app.lastMessage()).toContain("Juan");

    app.sendMessage("2"); // Juan

    const gastos = testUtils.sheetObjects(app, "SHEET_GASTOS");
    const deudasTarjeta = testUtils.sheetObjects(app, "SHEET_CUOTAS");
    const deudas = testUtils.sheetObjects(app, "SHEET_DEUDAS");

    expect(gastos).toHaveLength(1);
    expect(deudasTarjeta).toHaveLength(1);
    expect(deudas).toHaveLength(1);

    const gasto = gastos[0]
    const deudaTarjeta = deudasTarjeta[0]
    const deuda = deudas[0]

    expect(gasto["Categoría"]).toBe("Ajeno");
    expect(gasto["Medio de pago"]).toBe("BBVA Visa");
    expect(gasto["Monto"]).toBe(12000);

    expect(deudaTarjeta["Gasto ID"]).toBe(gasto["ID"]);

    expect(deuda["Deudor"]).toBe("Juan");
    expect(deuda["Monto"]).toBe(12000);
    expect(deuda["Monto Pendiente"]).toBe(12000);
    expect(deuda["Estado"]).toBe("Pendiente");
    expect(deuda["Gasto ID"]).toBe(gasto["ID"]);
  });

  test.todo("Si la categoria es ajeno y tiene descuento, guarda la deuda con el descuento aplicado")

  test.todo("Si la categoria es ajeno y tiene reintegro, guarda la deuda con el reintegro aplicado")

  test("Si es compra con reintegro, guarda el total sin el reintegro", () => {
    const app = createGasTestRuntime();

    testUtils.seedCategorias(app);
    testUtils.seedTarjetas(app);

    app.sendMessage(testUtils.fullTC({
      ahorro: "2000",
      tipo: "R",
      reintegrado: "No"
    }));

    app.sendMessage("1");
    app.sendMessage("1");

    expect(app.lastMessage()).toContain("Gasto con tarjeta de crédito registrado");

    const gastos = testUtils.sheetObjects(app, "SHEET_GASTOS");
    expect(gastos).toHaveLength(1);

    const gasto = gastos[0]

    expect(gasto["Categoría"]).toBe("Super");
    expect(gasto["Medio de pago"]).toBe("BBVA Visa");
    expect(gasto["Monto"]).toBe(12000);
    expect(gasto["Ahorro"]).toBe(2000);
    expect(gasto["Detalle"]).toBe("Compra con tarjeta");
    expect(gasto["Tipo"]).toBe("R");
    expect(gasto["Reintegrado?"]).toBe(false);

    app.sendMessage("REINTEGROS");

    expect(app.lastMessage()).toContain("Compra con tarjeta");
    expect(app.lastMessage()).toContain("BBVA Visa");
  });

  test("Si es compra con descuento, guarda el total con el descuento", () => {
    const app = createGasTestRuntime();

    testUtils.seedCategorias(app);
    testUtils.seedTarjetas(app);

    app.sendMessage(testUtils.fullTC({
      ahorro: "1500",
      tipo: "D",
      reintegrado: "Sí"
    }));

    app.sendMessage("1");
    app.sendMessage("1");

    expect(app.lastMessage()).toContain("Gasto con tarjeta de crédito registrado");

    const gastos = testUtils.sheetObjects(app, "SHEET_GASTOS");
    expect(gastos).toHaveLength(1);

    const gasto = gastos[0]
    const gastoTc = testUtils.sheetObjects(app, "SHEET_CUOTAS")[0];

    expect(gasto["Monto"]).toBe(12000);
    expect(gastoTc["Monto"]).toBe(10500);
    expect(gasto["Ahorro"]).toBe(1500);
    expect(gasto["Detalle"]).toBe("Compra con tarjeta");
    expect(gasto["Tipo"]).toBe("D");
    expect(gasto["Reintegrado?"]).toBe(true);
  });

  test.todo("Se puede eliminar un gasto de tarjeta")
  test.todo("Se puede editar un gasto de tarjeta")
  test.todo("Se pueden listar los gastos con tarjeta")
  test.todo("Si la categoria es ajeno y hay mas de 1 cuota, se crea deuda en cuotas")
});