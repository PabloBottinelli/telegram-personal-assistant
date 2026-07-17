import { describe, expect, test } from "vitest";
import { createGasTestRuntime } from "../gasTestRuntime.js";
import * as testUtils from "../testUtils.js";

describe("INGRESO", () => {
  test("guarda un ingreso simple correctamente", () => {
    const app = createGasTestRuntime();

    testUtils.seedCategorias(app)

    app.sendMessage(testUtils.fullIngreso({
      fecha: "10/06",
      monto: "100000",
      moneda: "ARS",
      detalle: "Sueldo junio"
    }));

    const categoryMsg = app.lastMessage();

    expect(categoryMsg).toContain(testUtils.CATEGORIA_LISTA_HEADER);
    expect(categoryMsg).toContain(testUtils.CATEGORIA_LISTA_FOOTER);
    expect(categoryMsg).toContain("Super");
    expect(categoryMsg).toContain("Ajeno");
    expect(categoryMsg).toContain("Comida");

    app.sendMessage("1");

    expect(app.lastMessage()).toContain("Registro completado");

    const ingresos = testUtils.sheetObjects(app, "SHEET_INGRESOS");

    expect(ingresos).toHaveLength(1);

    const ingreso = ingresos[0]

    testUtils.checkHours(ingreso["Fecha"])
    expect(ingreso["Fecha"]).toBeInstanceOf(Date);
    expect(ingreso["Fecha"].getDate()).toBe(10);
    expect(ingreso["Fecha"].getMonth() + 1).toBe(6);
    expect(ingreso["Fecha"].getFullYear()).toBe(2026);
    expect(ingreso["Categoría"]).toBe("Super");
    expect(ingreso["Monto"]).toBe(100000);
    expect(ingreso["Moneda"]).toBe("ARS");
    expect(ingreso["Descripción"]).toBe("Sueldo junio");
    expect(ingreso["ID"]).toMatch(/^ING-/);
  });

  test("guarda un ingreso rápido correctamente", () => {
    const app = createGasTestRuntime();

    testUtils.seedCategorias(app)
    
    app.sendMessage([
      "INGRESO",
      "50000",
      "Venta"
    ].join("\n"));

    app.sendMessage("1");

    expect(app.lastMessage()).toContain("Registro completado");

    const ingresos = testUtils.sheetObjects(app, "SHEET_INGRESOS");

    expect(ingresos).toHaveLength(1);

    const ingreso = ingresos[0]

    expect(ingreso["Categoría"]).toBe("Super");
    expect(ingreso["Monto"]).toBe(50000);
    expect(ingreso["ID"]).toMatch(/^ING-/);
  });

  test("cancelar operacion", () => {
    const app = createGasTestRuntime();

    testUtils.seedCategorias(app)

    app.sendMessage(testUtils.fullIngreso());

    app.sendMessage("cancelar");

    expect(app.lastMessage()).toContain("Operación cancelada.");

    const ingresos = testUtils.sheetObjects(app, "SHEET_INGRESOS");

    expect(ingresos).toHaveLength(0);
  });

  test("faltan argumentos", () => {
    const app = createGasTestRuntime();

    app.sendMessage(testUtils.fullIngreso({
      detalle: ""
    }));

    expect(app.lastMessage()).toContain("El formato es incorrecto.");
  });
});