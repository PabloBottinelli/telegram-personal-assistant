import { describe, expect, test } from "vitest";
import vm from "node:vm";
import { createGasTestRuntime } from "../gasTestRuntime.js";
import { rowToObject, getGlobal, appendRowsByConfig, sheetRowsByConfig } from "../testUtils.js";

function seedCategorias(app, rows = [
  ["Super", "CAT-1"],
  ["Ajeno", "CAT-2"],
  ["Comida", "CAT-3"]
]) {
  appendRowsByConfig(app, "SHEET_CATEGORIAS", rows);
}

function seedTarjetas(app, rows = [
  ["BBVA Visa", "", "", "", "", "TAR-1"],
  ["Galicia Mastercard", "", "", "", "", "TAR-2"]
]) {
  appendRowsByConfig(app, "SHEET_TARJETAS", rows);
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

  test("listar categorias lista correctamente", () => {
    const app = createGasTestRuntime();

    seedCategorias(app);

    app.sendMessage("Categorias")

    expect(app.lastMessage()).toContain("Super")
    expect(app.lastMessage()).toContain("Ajeno")
    expect(app.lastMessage()).toContain("Comida")
  })

  test("listar tarjetas lista correctamente", () => {
    const app = createGasTestRuntime();

    seedTarjetas(app);

    app.sendMessage("Tarjetas")

    expect(app.lastMessage()).toContain("BBVA")
    expect(app.lastMessage()).toContain("Galicia")
  })
});