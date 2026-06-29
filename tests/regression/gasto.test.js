import { describe, expect, test } from "vitest";
import vm from "node:vm";
import { createGasTestRuntime } from "../gasTestRuntime.js";
import { rowToObject, getGlobal, appendRowsByConfig, sheetRowsByConfig } from "../testUtils.js";

function fullGasto({
  fecha = "10/06",
  monto = "5000",
  moneda = "ARS",
  medio = "Efectivo",
  ahorro = "0",
  detalle = "Entrada cine",
  tipo = "-",
  reintegrado = "-"
} = {}) {
  return ["GASTO", fecha, monto, moneda, medio, ahorro, detalle, tipo, reintegrado].join("\n");
}

describe("GASTO", () => {
  test("guarda un gasto simple correctamente", () => {
    const app = createGasTestRuntime();

    const CATEGORIA_LISTA_HEADER = getGlobal(app, "CATEGORIA_LISTA_HEADER");
    const CATEGORIA_LISTA_FOOTER = getGlobal(app, "CATEGORIA_LISTA_FOOTER");
    const SHEET_GASTOS = getGlobal(app, "SHEET_GASTOS");

    appendRowsByConfig(app, "SHEET_CATEGORIAS", [
      ["Comida", "CAT-1"],
      ["Transporte", "CAT-2"],
      ["Ajeno", "CAT-3"]
    ]);

    app.sendMessage(fullGasto());

    expect(app.lastMessage()).toContain(CATEGORIA_LISTA_HEADER);
    expect(app.lastMessage()).toContain(CATEGORIA_LISTA_FOOTER);
    expect(app.lastMessage()).toContain("Comida");
    expect(app.lastMessage()).toContain("Transporte");
    expect(app.lastMessage()).toContain("Ajeno");

    app.sendMessage("1");

    expect(app.lastMessage()).toContain("Registro completado");

    const gastos = sheetRowsByConfig(app, "SHEET_GASTOS");

    expect(gastos).toHaveLength(1);

    const gasto = rowToObject(SHEET_GASTOS.headers, gastos[0]);

    expect(gasto["Fecha"]).toBeInstanceOf(Date);
    expect(gasto["Fecha"].getDate()).toBe(10);
    expect(gasto["Fecha"].getMonth()).toBe(5);
    expect(gasto["Fecha"].getFullYear()).toBe(2026);
    expect(gasto["Categoría"]).toBe("Comida");
    expect(gasto["Medio de pago"]).toBe("Efectivo");
    expect(gasto["Monto"]).toBe(5000);
    expect(gasto["Moneda"]).toBe("ARS");
    expect(gasto["Ahorro"]).toBe(0);
    expect(gasto["Detalle"]).toBe("Entrada cine");
    expect(gasto["Tipo"]).toBe("-");
    expect(gasto["Reintegrado?"]).toBe(true);
    expect(gasto["ID"]).toMatch(/^GAS-/);
  });

  test("si la categoría es AJENO, pide deudor y crea deuda vinculada", () => {
    const app = createGasTestRuntime();

    const SHEET_GASTOS = getGlobal(app, "SHEET_GASTOS");
    const SHEET_DEUDAS = getGlobal(app, "SHEET_DEUDAS");

    appendRowsByConfig(app, "SHEET_CATEGORIAS", [
      ["Comida", "CAT-1"],
      ["Ajeno", "CAT-2"]
    ]);

    appendRowsByConfig(app, "SHEET_DEUDORES", [
      ["Juan", "DEUDOR-1"]
    ]);

    app.sendMessage(fullGasto());

    app.sendMessage("2");

    expect(app.lastMessage()).toContain("Elegí el deudor");
    expect(app.lastMessage()).toContain("Juan");

    app.sendMessage("1");

    const gastos = sheetRowsByConfig(app, "SHEET_GASTOS");
    const deudas = sheetRowsByConfig(app, "SHEET_DEUDAS");

    expect(gastos).toHaveLength(1);
    expect(deudas).toHaveLength(1);

    const gastoId = gastos[0][9];

    const gasto = rowToObject(SHEET_GASTOS.headers, gastos[0]);
    const deuda = rowToObject(SHEET_DEUDAS.headers, deudas[0]);

    expect(gasto["Categoría"]).toBe("Ajeno");

    expect(deuda["Persona/Entidad"]).toBe("Juan");
    expect(deuda["Monto"]).toBe(5000);
    expect(deuda["Monto Pendiente"]).toBe(5000);
    expect(deuda["Estado"]).toBe("Pendiente");
    expect(deuda["Gasto ID"]).toBe(gastoId);
  });

  test("cantidad de lineas menor a la esperada", () => {
    const app = createGasTestRuntime();

    const FORMATS = getGlobal(app, "FORMATS");

    app.sendMessage([
      "GASTO",
      "10/06",
    ].join("\n"));

    expect(app.lastMessage()).toContain("Usá el formato correcto");
    expect(app.lastMessage()).toContain(FORMATS["GASTO"]);
    expect(app.sheetRows("Gastos")).toHaveLength(0);
  });

  test("inputs inválidos", () => {
    const app = createGasTestRuntime();

    app.sendMessage(fullGasto({fecha: "10/23"}));

    expect(app.lastMessage()).toContain("Fecha inválida");
    expect(app.sheetRows("Gastos")).toHaveLength(0);

    app.sendMessage([
      "GASTO",
      "a",
      "50s00",
      "ARSs",
      "Efectivo",
      "-1",
      "Entradas de cine",
      "m",
      "n"
    ].join("\n"));

    app.sendMessage(fullGasto({fecha: "a", monto: "50s00", moneda: "ARSs", medio: "Efectivo", ahorro: "-1", tipo: "m", reintegrado: "n"}));

    expect(app.lastMessage()).toContain("Fecha inválida");
    expect(app.lastMessage()).toContain("Monto inválido");
    expect(app.lastMessage()).toContain("Moneda inválida");
    expect(app.lastMessage()).toContain("Ahorro inválido");
    expect(app.lastMessage()).toContain("Valor inválido en reintegrado");
    expect(app.lastMessage()).toContain("Tipo inválido");
    expect(app.sheetRows("Gastos")).toHaveLength(0);
  });

  test("rechaza gasto con medio de pago vacío", () => {
    const app = createGasTestRuntime();

    app.sendMessage(fullGasto({medio: ""}));

    expect(app.lastMessage()).toContain("Usá el formato correcto");
    expect(app.sheetRows("Gastos")).toHaveLength(0);
  });

  test("rechaza gasto con descripción vacía", () => {
    const app = createGasTestRuntime();

    app.sendMessage(fullGasto({detalle: ""}));

    expect(app.lastMessage()).toContain("Usá el formato correcto");
    expect(app.sheetRows("Gastos")).toHaveLength(0);
  });

  test("si elige una categoría inválida, no guarda y permite reintentar", () => {
    const app = createGasTestRuntime();

    appendRowsByConfig(app, "SHEET_CATEGORIAS", [
      ["Comida", "CAT-1"],
      ["Ajeno", "CAT-2"]
    ]);

    app.sendMessage(fullGasto());

    app.sendMessage("30");

    const [errorMsg, listMsg] = app.lastMessages(2);
    expect(errorMsg).toContain("Número inválido");
    expect(listMsg).toContain("Seleccioná una categoría");

    expect(sheetRowsByConfig(app, "SHEET_GASTOS")).toHaveLength(0);
    expect(sheetRowsByConfig(app, "SHEET_DEUDAS")).toHaveLength(0);

    app.sendMessage("1");

    expect(app.lastMessage()).toContain("Registro completado");

    const gastos = sheetRowsByConfig(app, "SHEET_GASTOS");

    expect(gastos).toHaveLength(1);

    const SHEET_GASTOS = getGlobal(app, "SHEET_GASTOS");
    const gasto = rowToObject(SHEET_GASTOS.headers, gastos[0]);

    expect(gasto["Categoría"]).toBe("Comida");
    expect(gasto["Detalle"]).toBe("Entrada cine");
  });

  test("si elige un deudor inválido, no guarda deuda y permite reintentar", () => {
    const app = createGasTestRuntime();

    appendRowsByConfig(app, "SHEET_CATEGORIAS", [
      ["Comida", "CAT-1"],
      ["Ajeno", "CAT-2"]
    ]);

    appendRowsByConfig(app, "SHEET_DEUDORES", [
      ["Juan", "DEUDOR-1"]
    ]);

    app.sendMessage(fullGasto());

    app.sendMessage("2"); 

    expect(app.lastMessage()).toContain("Juan");

    app.sendMessage("99");

    const [errorMsg, listMsg] = app.lastMessages(2);
    expect(errorMsg).toContain("Número inválido");
    expect(listMsg).toContain("Elegí el deudor");

    expect(sheetRowsByConfig(app, "SHEET_GASTOS")).toHaveLength(0);
    expect(sheetRowsByConfig(app, "SHEET_DEUDAS")).toHaveLength(0);

    app.sendMessage("1");

    const gastos = sheetRowsByConfig(app, "SHEET_GASTOS");
    const deudas = sheetRowsByConfig(app, "SHEET_DEUDAS");

    expect(gastos).toHaveLength(1);
    expect(deudas).toHaveLength(1);

    const SHEET_GASTOS = getGlobal(app, "SHEET_GASTOS");
    const SHEET_DEUDAS = getGlobal(app, "SHEET_DEUDAS");

    const gasto = rowToObject(SHEET_GASTOS.headers, gastos[0]);
    const deuda = rowToObject(SHEET_DEUDAS.headers, deudas[0]);

    expect(gasto["Categoría"]).toBe("Ajeno");
    expect(deuda["Persona/Entidad"]).toBe("Juan");
    expect(deuda["Gasto ID"]).toBe(gasto["ID"]);
  });

  test("guarda correctamente un gasto con reintegro pendiente", () => {
    const app = createGasTestRuntime();

    appendRowsByConfig(app, "SHEET_CATEGORIAS", [
      ["Comida", "CAT-1"]
    ]);

    app.sendMessage(fullGasto({
      medio: "galicia",
      monto: "10000",
      ahorro: "2000",
      detalle: "Compra con promo",
      tipo: "R",
      reintegrado: "No"
    }));

    app.sendMessage("1");

    expect(app.lastMessage()).toContain("Registro completado");

    const gastos = sheetRowsByConfig(app, "SHEET_GASTOS");

    expect(gastos).toHaveLength(1);

    const SHEET_GASTOS = getGlobal(app, "SHEET_GASTOS");
    const gasto = rowToObject(SHEET_GASTOS.headers, gastos[0]);

    expect(gasto["Categoría"]).toBe("Comida");
    expect(gasto["Monto"]).toBe(10000);
    expect(gasto["Ahorro"]).toBe(2000);
    expect(gasto["Detalle"]).toBe("Compra con promo");
    expect(gasto["Tipo"]).toBe("R");
    expect(gasto["Reintegrado?"]).toBe(false);

    app.sendMessage("REINTEGROS");

    expect(app.lastMessage()).toContain("Compra con promo");
    expect(app.lastMessage()).toContain("galicia");
  });

  test("guarda correctamente un gasto con descuento", () => {
    const app = createGasTestRuntime();

    appendRowsByConfig(app, "SHEET_CATEGORIAS", [
      ["Comida", "CAT-1"]
    ]);

    app.sendMessage(fullGasto({
      monto: "10000",
      ahorro: "1500",
      detalle: "Descuento supermercado",
      tipo: "D",
      reintegrado: "Sí"
    }));

    app.sendMessage("1");

    expect(app.lastMessage()).toContain("Registro completado");

    const gastos = sheetRowsByConfig(app, "SHEET_GASTOS");

    expect(gastos).toHaveLength(1);

    const SHEET_GASTOS = getGlobal(app, "SHEET_GASTOS");
    const gasto = rowToObject(SHEET_GASTOS.headers, gastos[0]);

    expect(gasto["Monto"]).toBe(10000);
    expect(gasto["Ahorro"]).toBe(1500);
    expect(gasto["Detalle"]).toBe("Descuento supermercado");
    expect(gasto["Tipo"]).toBe("D");
    expect(gasto["Reintegrado?"]).toBe(true);
  });

  test("si el ahorro es 0, no aparece como reintegro pendiente", () => {
    const app = createGasTestRuntime();

    appendRowsByConfig(app, "SHEET_CATEGORIAS", [
      ["Comida", "CAT-1"]
    ]);

    app.sendMessage(fullGasto({
      monto: "10000",
      ahorro: "0",
      detalle: "Compra sin ahorro",
      tipo: "R",
      reintegrado: "No"
    }));

    expect(app.lastMessage()).toContain("el ahorro/reintegro debe ser mayor a 0");

    const gastos = sheetRowsByConfig(app, "SHEET_GASTOS");

    expect(gastos).toHaveLength(0);

    app.sendMessage("REINTEGROS");

    expect(app.lastMessage()).not.toContain("Compra sin ahorro");
  });

  test("formato rápido guarda correctamente un gasto", () => {
    const app = createGasTestRuntime();

    appendRowsByConfig(app, "SHEET_CATEGORIAS", [
      ["Comida", "CAT-1"]
    ]);

    app.sendMessage([
      "GASTO",
      "1000",
      "Efectivo",
      "Panadería"
    ].join("\n"));

    app.sendMessage("1");

    expect(app.lastMessage()).toContain("Registro completado");

    const gastos = sheetRowsByConfig(app, "SHEET_GASTOS");

    expect(gastos).toHaveLength(1);

    const SHEET_GASTOS = getGlobal(app, "SHEET_GASTOS");
    const gasto = rowToObject(SHEET_GASTOS.headers, gastos[0]);

    expect(gasto["Categoría"]).toBe("Comida");
    expect(gasto["Monto"]).toBe(1000);
    expect(gasto["Detalle"]).toBe("Panadería");
    expect(gasto["ID"]).toMatch(/^GAS-/);
  });

  test("rechaza gasto con monto negativo", () => {
    const app = createGasTestRuntime();

    appendRowsByConfig(app, "SHEET_CATEGORIAS", [
      ["Comida", "CAT-1"]
    ]);

    app.sendMessage(fullGasto({
      monto: "-1000",
      detalle: "Monto negativo"
    }));

    expect(app.lastMessage()).toContain("Monto inválido");
    expect(sheetRowsByConfig(app, "SHEET_GASTOS")).toHaveLength(0);
  });

  test("rechaza gasto con monto cero", () => {
    const app = createGasTestRuntime();

    appendRowsByConfig(app, "SHEET_CATEGORIAS", [
      ["Comida", "CAT-1"]
    ]);

    app.sendMessage(fullGasto({
      monto: "0",
      detalle: "Monto cero"
    }));

    expect(app.lastMessage()).toContain("Monto inválido");
    expect(sheetRowsByConfig(app, "SHEET_GASTOS")).toHaveLength(0);
  });

  test("rechaza gasto con ahorro pero sin tipo", () => {
    const app = createGasTestRuntime();

    appendRowsByConfig(app, "SHEET_CATEGORIAS", [
      ["Comida", "CAT-1"]
    ]);

    app.sendMessage(fullGasto({
      monto: "1000",
      ahorro: "1500",
      detalle: "Ahorro mayor al monto"
    }));

    expect(app.lastMessage()).toContain("el ahorro debería ser 0");
    expect(sheetRowsByConfig(app, "SHEET_GASTOS")).toHaveLength(0);
  });

  test("rechaza gasto con tipo pero sin especificacion de si fue reintegrado", () => {
    const app = createGasTestRuntime();

    appendRowsByConfig(app, "SHEET_CATEGORIAS", [
      ["Comida", "CAT-1"]
    ]);

    app.sendMessage(fullGasto({
      monto: "1000",
      ahorro: "1500",
      tipo: "R",
      detalle: "Ahorro mayor al monto"
    }));

    expect(app.lastMessage()).toContain("Reintegrado debe ser 'Sí' o 'No'");
    expect(sheetRowsByConfig(app, "SHEET_GASTOS")).toHaveLength(0);
  });
});