import { describe, expect, test } from "vitest";
import vm from "node:vm";
import { createGasTestRuntime } from "../gasTestRuntime.js";
import { rowToObject, getGlobal, appendRowsByConfig, sheetRowsByConfig } from "../testUtils.js";


function fullIngreso({
  fecha = "10/06",
  monto = "100000",
  moneda = "ARS",
  detalle = "Sueldo"
} = {}) {
  return ["INGRESO", fecha, monto, moneda, detalle].join("\n");
}

describe("INGRESO", () => {
  test("guarda un ingreso simple correctamente", () => {
    const app = createGasTestRuntime();

    const CATEGORIA_LISTA_HEADER = getGlobal(app, "CATEGORIA_LISTA_HEADER");
    const CATEGORIA_LISTA_FOOTER = getGlobal(app, "CATEGORIA_LISTA_FOOTER");

    appendRowsByConfig(app, "SHEET_CATEGORIAS", [
      ["Sueldo", "CAT-1"],
      ["Venta", "CAT-2"],
      ["Regalo", "CAT-3"]
    ]);

    app.sendMessage(fullIngreso({
      fecha: "10/06",
      monto: "100000",
      moneda: "ARS",
      detalle: "Sueldo junio"
    }));

    const categoryMsg = app.lastMessage();

    expect(categoryMsg).toContain(CATEGORIA_LISTA_HEADER);
    expect(categoryMsg).toContain(CATEGORIA_LISTA_FOOTER);
    expect(categoryMsg).toContain("Sueldo");
    expect(categoryMsg).toContain("Venta");
    expect(categoryMsg).toContain("Regalo");

    app.sendMessage("1");

    expect(app.lastMessage()).toContain("Registro completado");

    const ingresos = sheetRowsByConfig(app, "SHEET_INGRESOS");

    expect(ingresos).toHaveLength(1);

    const SHEET_INGRESOS = getGlobal(app, "SHEET_INGRESOS");
    const ingreso = rowToObject(SHEET_INGRESOS.headers, ingresos[0]);

    expect(ingreso["Fecha"]).toBeInstanceOf(Date);
    expect(ingreso["Fecha"].getDate()).toBe(10);
    expect(ingreso["Fecha"].getMonth() + 1).toBe(6);
    expect(ingreso["Fecha"].getFullYear()).toBe(2026);
    expect(ingreso["Categoría"]).toBe("Sueldo");
    expect(ingreso["Monto"]).toBe(100000);
    expect(ingreso["Moneda"]).toBe("ARS");
    expect(ingreso["Descripción"]).toBe("Sueldo junio");
    expect(ingreso["ID"]).toMatch(/^ING-/);
  });

  test("guarda un ingreso rápido correctamente", () => {
    const app = createGasTestRuntime();

    appendRowsByConfig(app, "SHEET_CATEGORIAS", [
      ["Sueldo", "CAT-1"],
      ["Venta", "CAT-2"]
    ]);

    app.sendMessage([
      "INGRESO",
      "50000",
      "Venta"
    ].join("\n"));

    app.sendMessage("2");

    expect(app.lastMessage()).toContain("Registro completado");

    const ingresos = sheetRowsByConfig(app, "SHEET_INGRESOS");

    expect(ingresos).toHaveLength(1);

    const SHEET_INGRESOS = getGlobal(app, "SHEET_INGRESOS");
    const ingreso = rowToObject(SHEET_INGRESOS.headers, ingresos[0]);

    expect(ingreso["Categoría"]).toBe("Venta");
    expect(ingreso["Monto"]).toBe(50000);
    expect(ingreso["ID"]).toMatch(/^ING-/);
  });
});