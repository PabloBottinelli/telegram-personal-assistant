import { describe, expect, test } from "vitest";
import { createGasTestRuntime } from "../gasTestRuntime.js";
import * as testUtils from "../testUtils.js";


describe("Expenses", () => {
  test.todo("Se puede eliminar un gasto")

  test.todo("Se puede editar un gasto")

  test.todo("Se pueden listar los gastos")

  test("Se puede crear un gasto simple correctamente", () => {
    const app = createGasTestRuntime();

    testUtils.seedCategorias(app)

    app.sendMessage(testUtils.fullGasto());

    expect(app.lastMessage()).toContain(testUtils.CATEGORIA_LISTA_HEADER);
    expect(app.lastMessage()).toContain(testUtils.CATEGORIA_LISTA_FOOTER);
    expect(app.lastMessage()).toContain("Comida");
    expect(app.lastMessage()).toContain("Super");
    expect(app.lastMessage()).toContain("Ajeno");

    app.sendMessage("1");

    expect(app.lastMessage()).toContain("Gasto registrado");

    const gastos = testUtils.sheetObjects(app, "SHEET_GASTOS")

    expect(gastos).toHaveLength(1);

    const gasto = gastos[0]

    expect(gasto["Fecha"]).toBeInstanceOf(Date);
    testUtils.checkHours(gasto["Fecha"])
    expect(gasto["Fecha"].getDate()).toBe(10);
    expect(gasto["Fecha"].getMonth()).toBe(5);
    expect(gasto["Fecha"].getFullYear()).toBe(2026);
    expect(gasto["Categoría"]).toBe("Super");
    expect(gasto["Medio de pago"]).toBe("Efectivo");
    expect(gasto["Monto"]).toBe(5000);
    expect(gasto["Moneda"]).toBe("ARS");
    expect(gasto["Ahorro"]).toBe(0);
    expect(gasto["Detalle"]).toBe("Entrada cine");
    expect(gasto["Tipo"]).toBe("-");
    expect(gasto["Reintegrado?"]).toBe(true);
    expect(gasto["ID"]).toMatch(/^GAS-/);
  });

  test("Si la categoría es AJENO, pide deudor y crea deuda vinculada", () => {
    const app = createGasTestRuntime();

    testUtils.seedCategorias(app)

    testUtils.seedDeudores(app)

    app.sendMessage(testUtils.fullGasto());

    app.sendMessage("2");

    expect(app.lastMessage()).toContain("Seleccioná un deudor");
    expect(app.lastMessage()).toContain("Juan");

    app.sendMessage("2");

    const gastos = testUtils.sheetObjects(app, "SHEET_GASTOS")
    const deudas = testUtils.sheetObjects(app, "SHEET_DEUDAS");

    expect(gastos).toHaveLength(1);
    expect(deudas).toHaveLength(1);

    const gasto = gastos[0]
    const deuda = deudas[0];

    expect(gasto["Categoría"]).toBe("Ajeno");

    expect(deuda["Deudor"]).toBe("Juan");
    expect(deuda["Monto"]).toBe(5000);
    expect(deuda["Monto Pendiente"]).toBe(5000);
    expect(deuda["Estado"]).toBe("Pendiente");
    expect(deuda["Gasto ID"]).toBe(gasto["ID"]);
  });

  test("Si elige una categoría inválida, no guarda y permite reintentar", () => {
    const app = createGasTestRuntime();

    testUtils.seedCategorias(app)

    app.sendMessage(testUtils.fullGasto());

    app.sendMessage("30");

    const [errorMsg, listMsg] = app.lastMessages(2);
    expect(errorMsg).toContain("Número inválido");
    expect(listMsg).toContain("Seleccioná una categoría");

    expect(testUtils.sheetRowsByConfig(app, "SHEET_GASTOS")).toHaveLength(0);
    expect(testUtils.sheetRowsByConfig(app, "SHEET_DEUDAS")).toHaveLength(0);

    app.sendMessage("1");

    expect(app.lastMessage()).toContain("Gasto registrado");

    const gastos = testUtils.sheetObjects(app, "SHEET_GASTOS");

    expect(gastos).toHaveLength(1);

    const gasto = gastos[0]

    expect(gasto["Categoría"]).toBe("Super");
    expect(gasto["Detalle"]).toBe("Entrada cine");
  });

  test("Si elige un deudor inválido, no guarda deuda y permite reintentar", () => {
    const app = createGasTestRuntime();

    testUtils.seedCategorias(app)
    testUtils.seedDeudores(app)

    app.sendMessage(testUtils.fullGasto());

    app.sendMessage("2");

    expect(app.lastMessage()).toContain("Juan");

    app.sendMessage("99");

    const [errorMsg, listMsg] = app.lastMessages(2);
    expect(errorMsg).toContain("Número inválido");
    expect(listMsg).toContain("Seleccioná un deudor");

    expect(testUtils.sheetRowsByConfig(app, "SHEET_GASTOS")).toHaveLength(0);
    expect(testUtils.sheetRowsByConfig(app, "SHEET_DEUDAS")).toHaveLength(0);

    app.sendMessage("2");

    const gastos = testUtils.sheetObjects(app, "SHEET_GASTOS");
    const deudas = testUtils.sheetObjects(app, "SHEET_DEUDAS");

    expect(gastos).toHaveLength(1);
    expect(deudas).toHaveLength(1);

    const gasto = gastos[0]
    const deuda = deudas[0]

    expect(gasto["Categoría"]).toBe("Ajeno");
    expect(deuda["Deudor"]).toBe("Juan");
    expect(deuda["Gasto ID"]).toBe(gasto["ID"]);
  });

  test("Se puede crear un gasto con reintegro pendiente", () => {
    const app = createGasTestRuntime();

    testUtils.seedCategorias(app)

    app.sendMessage(testUtils.fullGasto({
      medio: "galicia",
      monto: "10000",
      ahorro: "2000",
      detalle: "Compra con promo",
      tipo: "R",
      reintegrado: "No"
    }));

    app.sendMessage("1");

    expect(app.lastMessage()).toContain("Gasto registrado");

    const gastos = testUtils.sheetObjects(app, "SHEET_GASTOS");

    expect(gastos).toHaveLength(1);

    const gasto = gastos[0]

    expect(gasto["Categoría"]).toBe("Super");
    expect(gasto["Monto"]).toBe(10000);
    expect(gasto["Ahorro"]).toBe(2000);
    expect(gasto["Detalle"]).toBe("Compra con promo");
    expect(gasto["Tipo"]).toBe("R");
    expect(gasto["Reintegrado?"]).toBe(false);

    app.sendMessage("REINTEGROS");

    expect(app.lastMessage()).toContain("Compra con promo");
    expect(app.lastMessage()).toContain("galicia");
  });

  test("Se puede crear un gasto con descuento", () => {
    const app = createGasTestRuntime();

    testUtils.seedCategorias(app)

    app.sendMessage(testUtils.fullGasto({
      monto: "10000",
      ahorro: "1500",
      detalle: "Descuento supermercado",
      tipo: "D",
      reintegrado: "Sí"
    }));

    app.sendMessage("1");

    expect(app.lastMessage()).toContain("Gasto registrado");

    const gastos = testUtils.sheetObjects(app, "SHEET_GASTOS");

    expect(gastos).toHaveLength(1);

    const gasto = gastos[0]

    expect(gasto["Monto"]).toBe(10000);
    expect(gasto["Ahorro"]).toBe(1500);
    expect(gasto["Detalle"]).toBe("Descuento supermercado");
    expect(gasto["Tipo"]).toBe("D");
    expect(gasto["Reintegrado?"]).toBe(true);
  });

  test("Si el ahorro es 0, no aparece como reintegro pendiente", () => {
    const app = createGasTestRuntime();

    testUtils.seedCategorias(app)

    app.sendMessage(testUtils.fullGasto({
      monto: "10000",
      ahorro: "0",
      detalle: "Compra sin ahorro",
      tipo: "R",
      reintegrado: "No"
    }));

    expect(app.lastMessage()).toContain("el ahorro/reintegro debe ser mayor a 0");

    const gastos = testUtils.sheetObjects(app, "SHEET_GASTOS");

    expect(gastos).toHaveLength(0);

    app.sendMessage("REINTEGROS");

    expect(app.lastMessage()).not.toContain("Compra sin ahorro");
  });

  test("Formato rápido guarda correctamente un gasto", () => {
    const app = createGasTestRuntime();

    testUtils.seedCategorias(app)

    app.sendMessage([
      "GASTO",
      "1000",
      "Efectivo",
      "Panadería"
    ].join("\n"));

    app.sendMessage("1");

    expect(app.lastMessage()).toContain("Gasto registrado");

    const gastos = testUtils.sheetObjects(app, "SHEET_GASTOS");

    expect(gastos).toHaveLength(1);

    const gasto = gastos[0]

    expect(gasto["Categoría"]).toBe("Super");
    expect(gasto["Monto"]).toBe(1000);
    expect(gasto["Detalle"]).toBe("Panadería");
    expect(gasto["ID"]).toMatch(/^GAS-/);
  });

  test("Se puede crear una categoria durante la creacion de un gasto", () => {
    const app = createGasTestRuntime();

    app.sendMessage([
      "GASTO",
      "1000",
      "Efectivo",
      "Panadería"
    ].join("\n"));

    app.sendMessage("NUEVA Super");

    expect(app.lastMessage()).toContain("Gasto registrado");

    const gastos = testUtils.sheetObjects(app, "SHEET_GASTOS");

    expect(gastos).toHaveLength(1);

    const gasto = gastos[0]

    expect(gasto["Categoría"]).toBe("Super");
    expect(gasto["Monto"]).toBe(1000);
    expect(gasto["Detalle"]).toBe("Panadería");
    expect(gasto["ID"]).toMatch(/^GAS-/);
  })

  test("Se puede crear un deudor durante la creacion de un gasto", () => {
    const app = createGasTestRuntime();

    testUtils.seedCategorias(app)

    app.sendMessage([
      "GASTO",
      "1000",
      "Efectivo",
      "Panadería"
    ].join("\n"));

    app.sendMessage("2");

    app.sendMessage("NUEVO Juan")

    expect(app.lastMessage()).toContain("Gasto registrado");

    const gastos = testUtils.sheetObjects(app, "SHEET_GASTOS");
    const deudas = testUtils.sheetObjects(app, "SHEET_DEUDAS");

    expect(gastos).toHaveLength(1);

    const gasto = gastos[0]
    const deuda = deudas[0]

    expect(gasto["Categoría"]).toBe("Super");
    expect(gasto["Monto"]).toBe(1000);
    expect(gasto["Detalle"]).toBe("Panadería");
    expect(gasto["ID"]).toMatch(/^GAS-/);

    expect(deuda["Deudor"]).toBe("Juan")
  })
});