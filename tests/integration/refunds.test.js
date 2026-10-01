import { describe, expect, test } from "vitest";
import { createGasTestRuntime } from "../gasTestRuntime.js";
import * as testUtils from "../testUtils.js";

describe("Refunds", () => {
  test("Si no hay reintegros, avisa con un mensaje", () => {
    const app = createGasTestRuntime();

    app.sendMessage("REINTEGROS");

    expect(app.lastMessage()).toContain("No hay reintegros pendientes");
  });

  test("Si al crear gastos se pone reintegrado: si, REINTEGROS no los lista", () => {
    const app = createGasTestRuntime();

    testUtils.seedCategorias(app)

    testUtils.crearGastoDesdeBot(app, {
      monto: "10000",
      medio: "Galicia",
      ahorro: "2000",
      detalle: "Promo ya reintegrada",
      tipo: "R",
      reintegrado: "si",
    })

    testUtils.crearGastoDesdeBot(app, {
      medio: "Efectivo",
      monto: "5000",
      ahorro: "1000",
      detalle: "Ajeno ya devuelto",
      tipo: "R",
      reintegrado: "si",
    })

    testUtils.crearGastoDesdeBot(app, {
      medio: "Efectivo",
      monto: "8000",
      ahorro: "1500",
      detalle: "Descuento aplicado",
      tipo: "D",
      reintegrado: "si",
    })

    app.sendMessage("REINTEGROS");

    expect(app.lastMessage()).toContain("No hay reintegros pendientes");
  });

  test("MARCAR REINTEGRADO sin pendientes devuelve mensaje esperado", () => {
    const app = createGasTestRuntime();

    testUtils.seedCategorias(app)

    testUtils.crearGastoDesdeBot(app, {
      monto: "10000",
      medio: "Galicia",
      ahorro: "2000",
      detalle: "Promo ya reintegrada",
      tipo: "R",
      reintegrado: "si",
    })

    app.sendMessage("MARCAR REINTEGRADO");

    expect(app.lastMessage()).toContain("No hay reintegros pendientes");
  });

  test("MARCAR REINTEGRADO lista pendientes numerados", () => {
    const app = createGasTestRuntime();

    testUtils.seedCategorias(app)

    testUtils.crearGastoDesdeBot(app, {
      monto: "10000",
      medio: "Galicia",
      ahorro: "2000",
      detalle: "Promo ya reintegrada",
      tipo: "R",
      reintegrado: "no",
    })

    app.sendMessage("MARCAR REINTEGRADO");

    const msg = app.lastMessage();

    expect(msg).toContain("1. Galicia te debe");
    expect(msg).toContain("Promo ya reintegrada");

    expect(msg).toContain("Respondé el NÚMERO");
    expect(msg).toContain("CANCELAR");
  });

  test("MARCAR REINTEGRADO con número inválido no modifica nada y permite reintentar", () => {
    const app = createGasTestRuntime();

    testUtils.seedCategorias(app)

    testUtils.crearGastoDesdeBot(app, {
      monto: "10000",
      medio: "Galicia",
      ahorro: "2000",
      detalle: "Promo ya reintegrada",
      tipo: "R",
      reintegrado: "no",
    })

    app.sendMessage("MARCAR REINTEGRADO");

    expect(app.lastMessage()).toContain("Promo ya reintegrada");

    app.sendMessage("99");

    expect(app.lastMessage()).toContain("Número inválido");

    let gastos = testUtils.sheetObjects(app, "SHEET_GASTOS")
    let gasto = gastos[0]

    expect(gasto["Reintegrado?"]).toBe(false);

    app.sendMessage("1");

    expect(app.lastMessage()).toContain("Marcado como reintegrado");

    gastos = testUtils.sheetObjects(app, "SHEET_GASTOS")
    gasto = gastos[0]

    expect(gasto["Reintegrado?"]).toBe(true);
  });

  test("MARCAR REINTEGRADO marca como reintegrado la fila correcta", () => {
    const app = createGasTestRuntime();

    testUtils.seedCategorias(app)

    testUtils.crearGastoDesdeBot(app, {
      monto: "10000",
      medio: "Galicia",
      ahorro: "2000",
      detalle: "Promo ya reintegrada",
      tipo: "R",
      reintegrado: "no",
    })

    testUtils.crearGastoDesdeBot(app, {
      catIndex: "3",
      monto: "15000",
      medio: "MP",
      ahorro: "3000",
      detalle: "Compra con promo MP",
      tipo: "R",
      reintegrado: "no",
    })

    app.sendMessage("MARCAR REINTEGRADO");

    expect(app.lastMessage()).toContain("1. Galicia te debe");
    expect(app.lastMessage()).toContain("2. MP te debe");

    app.sendMessage("2");

    expect(app.lastMessage()).toContain("Marcado como reintegrado");
    expect(app.lastMessage()).toContain("Compra con promo MP");

    const gastos = testUtils.sheetObjects(app, "SHEET_GASTOS");

    const gastoGalicia = gastos.find(g => g["Medio de pago"] === "Galicia");
    const gastoMP = gastos.find(g => g["Medio de pago"] === "MP");

    expect(gastoGalicia["Reintegrado?"]).toBe(false);
    expect(gastoMP["Reintegrado?"]).toBe(true);
  });

  test("Luego de marcar un reintegro, deja de aparecer en REINTEGROS", () => {
    const app = createGasTestRuntime();

    testUtils.seedCategorias(app)

    testUtils.crearGastoDesdeBot(app, {
      monto: "10000",
      medio: "Galicia",
      ahorro: "2000",
      detalle: "Promo ya reintegrada",
      tipo: "R",
      reintegrado: "no",
    })

    app.sendMessage("REINTEGROS");

    expect(app.lastMessage()).toContain("Promo ya reintegrada");

    app.sendMessage("MARCAR REINTEGRADO");
    app.sendMessage("1");

    expect(app.lastMessage()).toContain("Marcado como reintegrado");

    app.sendMessage("REINTEGROS");

    expect(app.lastMessage()).toContain("No hay reintegros pendientes");
    expect(app.lastMessage()).not.toContain("Promo ya reintegrada");
  });
});