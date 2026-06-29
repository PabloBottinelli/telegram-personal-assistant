import { describe, expect, test } from "vitest";
import { createGasTestRuntime } from "../gasTestRuntime.js";
import { rowToObject, getGlobal, appendRowsByConfig, sheetRowsByConfig } from "../testUtils.js";

function gastoRow({
  fecha = new Date(2026, 5, 10, 12, 0, 0),
  categoria = "Comida",
  medio = "Efectivo",
  monto = 10000,
  moneda = "ARS",
  ahorro = 0,
  detalle = "Gasto test",
  tipo = "-",
  reintegrado = true,
  id = "GAS-TEST-1"
} = {}) {
  return [fecha, categoria, medio, monto, moneda, ahorro, detalle, tipo, reintegrado, id];
}

function seedGastos(app, rows) {
  appendRowsByConfig(app, "SHEET_GASTOS", rows);
}

function gastosObjects(app) {
  const SHEET_GASTOS = getGlobal(app, "SHEET_GASTOS");
  return sheetRowsByConfig(app, "SHEET_GASTOS").map(row =>
    rowToObject(SHEET_GASTOS.headers, row)
  );
}

describe("REINTEGROS / MARCAR REINTEGRADO", () => {
  test("REINTEGROS sin gastos devuelve mensaje esperado", () => {
    const app = createGasTestRuntime();

    app.sendMessage("REINTEGROS");

    expect(app.lastMessage()).toContain("No hay reintegros pendientes");
  });

  test("REINTEGROS sin pendientes devuelve mensaje esperado", () => {
    const app = createGasTestRuntime();

    seedGastos(app, [
      gastoRow({
        categoria: "Comida",
        medio: "Galicia",
        monto: 10000,
        ahorro: 2000,
        detalle: "Promo ya reintegrada",
        tipo: "R",
        reintegrado: true,
        id: "GAS-1"
      }),
      gastoRow({
        categoria: "Ajeno",
        medio: "Efectivo",
        monto: 5000,
        ahorro: 0,
        detalle: "Ajeno ya devuelto",
        tipo: "-",
        reintegrado: true,
        id: "GAS-2"
      }),
      gastoRow({
        categoria: "Comida",
        medio: "Efectivo",
        monto: 8000,
        ahorro: 1500,
        detalle: "Descuento aplicado",
        tipo: "D",
        reintegrado: true,
        id: "GAS-3"
      })
    ]);

    app.sendMessage("REINTEGROS");

    expect(app.lastMessage()).toContain("No hay reintegros pendientes");
  });

  test("MARCAR REINTEGRADO sin pendientes devuelve mensaje esperado", () => {
    const app = createGasTestRuntime();

    seedGastos(app, [
      gastoRow({
        categoria: "Comida",
        medio: "Galicia",
        monto: 10000,
        ahorro: 2000,
        detalle: "Promo ya reintegrada",
        tipo: "R",
        reintegrado: true,
        id: "GAS-1"
      })
    ]);

    app.sendMessage("MARCAR REINTEGRADO");

    expect(app.lastMessage()).toContain("No hay reintegros pendientes");
  });

  test("MARCAR REINTEGRADO lista pendientes numerados", () => {
    const app = createGasTestRuntime();

    seedGastos(app, [
      gastoRow({
        categoria: "Comida",
        medio: "Galicia",
        monto: 10000,
        ahorro: 2000,
        detalle: "Compra con promo",
        tipo: "R",
        reintegrado: false,
        id: "GAS-1"
      }),
      gastoRow({
        categoria: "Ajeno",
        medio: "Efectivo",
        monto: 5000,
        ahorro: 0,
        detalle: "Entrada cine ajena",
        tipo: "-",
        reintegrado: true,
        id: "GAS-2"
      })
    ]);

    app.sendMessage("MARCAR REINTEGRADO");

    const msg = app.lastMessage();

    expect(msg).toContain("1. Galicia te debe");
    expect(msg).toContain("Compra con promo");

    expect(msg).toContain("Respondé el NÚMERO");
    expect(msg).toContain("CANCELAR");
  });

  test("MARCAR REINTEGRADO con número inválido no modifica nada y permite reintentar", () => {
    const app = createGasTestRuntime();

    seedGastos(app, [
      gastoRow({
        categoria: "Comida",
        medio: "Galicia",
        monto: 10000,
        ahorro: 2000,
        detalle: "Compra con promo",
        tipo: "R",
        reintegrado: false,
        id: "GAS-1"
      })
    ]);

    app.sendMessage("MARCAR REINTEGRADO");

    expect(app.lastMessage()).toContain("Compra con promo");

    app.sendMessage("99");

    expect(app.lastMessage()).toContain("Número inválido");

    let [gasto] = gastosObjects(app);

    expect(gasto["Reintegrado?"]).toBe(false);

    app.sendMessage("1");

    expect(app.lastMessage()).toContain("Marcado como reintegrado");

    [gasto] = gastosObjects(app);

    expect(gasto["Reintegrado?"]).toBe(true);
  });

  test("MARCAR REINTEGRADO marca como reintegrado la fila correcta", () => {
    const app = createGasTestRuntime();

    seedGastos(app, [
      gastoRow({
        categoria: "Comida",
        medio: "Galicia",
        monto: 10000,
        ahorro: 2000,
        detalle: "Compra con promo",
        tipo: "R",
        reintegrado: false,
        id: "GAS-1"
      }),
      gastoRow({
        categoria: "Comida",
        medio: "MP",
        monto: 15000,
        ahorro: 3000,
        detalle: "Compra con promo MP",
        tipo: "R",
        reintegrado: false,
        id: "GAS-2"
      })
    ]);

    app.sendMessage("MARCAR REINTEGRADO");

    expect(app.lastMessage()).toContain("1. Galicia te debe");
    expect(app.lastMessage()).toContain("2. MP te debe");

    app.sendMessage("2");

    expect(app.lastMessage()).toContain("Marcado como reintegrado");
    expect(app.lastMessage()).toContain("Compra con promo MP");

    const gastos = gastosObjects(app);

    const gastoGalicia = gastos.find(g => g["ID"] === "GAS-1");
    const gastoMP = gastos.find(g => g["ID"] === "GAS-2");

    expect(gastoGalicia["Reintegrado?"]).toBe(false);
    expect(gastoMP["Reintegrado?"]).toBe(true);
  });

  test("MARCAR REINTEGRADO no modifica otra fila parecida", () => {
    const app = createGasTestRuntime();

    seedGastos(app, [
      gastoRow({
        categoria: "Comida",
        medio: "Galicia",
        monto: 10000,
        ahorro: 2000,
        detalle: "Promo supermercado",
        tipo: "R",
        reintegrado: false,
        id: "GAS-1"
      }),
      gastoRow({
        categoria: "Comida",
        medio: "Galicia",
        monto: 10000,
        ahorro: 2000,
        detalle: "Promo supermercado",
        tipo: "R",
        reintegrado: false,
        id: "GAS-2"
      })
    ]);

    app.sendMessage("MARCAR REINTEGRADO");

    app.sendMessage("1");

    expect(app.lastMessage()).toContain("Marcado como reintegrado");

    const gastos = gastosObjects(app);

    const primero = gastos.find(g => g["ID"] === "GAS-1");
    const segundo = gastos.find(g => g["ID"] === "GAS-2");

    expect(primero["Reintegrado?"]).toBe(true);
    expect(segundo["Reintegrado?"]).toBe(false);
  });

  test("luego de marcar un reintegro, deja de aparecer en REINTEGROS", () => {
    const app = createGasTestRuntime();

    seedGastos(app, [
      gastoRow({
        categoria: "Comida",
        medio: "Galicia",
        monto: 10000,
        ahorro: 2000,
        detalle: "Compra con promo",
        tipo: "R",
        reintegrado: false,
        id: "GAS-1"
      })
    ]);

    app.sendMessage("REINTEGROS");

    expect(app.lastMessage()).toContain("Compra con promo");

    app.sendMessage("MARCAR REINTEGRADO");
    app.sendMessage("1");

    expect(app.lastMessage()).toContain("Marcado como reintegrado");

    app.sendMessage("REINTEGROS");

    expect(app.lastMessage()).toContain("No hay reintegros pendientes");
    expect(app.lastMessage()).not.toContain("Compra con promo");
  });

  test("CANCELAR durante MARCAR REINTEGRADO resetea estado y no modifica gastos", () => {
    const app = createGasTestRuntime();

    seedGastos(app, [
      gastoRow({
        categoria: "Comida",
        medio: "Galicia",
        monto: 10000,
        ahorro: 2000,
        detalle: "Compra con promo",
        tipo: "R",
        reintegrado: false,
        id: "GAS-1"
      })
    ]);

    app.sendMessage("MARCAR REINTEGRADO");

    expect(app.lastMessage()).toContain("Compra con promo");

    app.sendMessage("CANCELAR");

    expect(app.lastMessage()).toContain("Operación cancelada");

    let [gasto] = gastosObjects(app);

    expect(gasto["Reintegrado?"]).toBe(false);

    app.sendMessage("1");

    expect(app.lastMessage()).not.toContain("Marcado como reintegrado");

    [gasto] = gastosObjects(app);

    expect(gasto["Reintegrado?"]).toBe(false);
  });
});