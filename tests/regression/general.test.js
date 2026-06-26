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

describe("GENERAL", () => {
  test("comando invalido", () => {
    const app = createGasTestRuntime();

    app.sendMessage("Cualquier cosa");

    expect(app.lastMessage()).toContain("Elegí un comando válido.");
  });

  test("cancelar operacion", () => {
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

    app.sendMessage("cancelar");

    expect(app.lastMessage()).toContain("Operación cancelada.");

    const ingresos = sheetRowsByConfig(app, "SHEET_INGRESOS");

    expect(ingresos).toHaveLength(0);
  });
});