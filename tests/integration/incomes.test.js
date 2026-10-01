import { describe, expect, test } from "vitest";
import { createGasTestRuntime } from "../gasTestRuntime.js";
import * as testUtils from "../testUtils.js";

describe("Incomes", () => {
  test("Se puede crear un ingreso", () => {
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

  test("Se puede crear un ingreso en formato rápido", () => {
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

  test.todo("Se pueden listar ingresos")
  test.todo("Se puede eliminar un ingreso")
  test.todo("Se puede editar un ingreso")

  test("Se puede crear una categoria al crear un ingreso", () => {
    const app = createGasTestRuntime();

    app.sendMessage([
      "INGRESO",
      "50000",
      "Venta"
    ].join("\n"));

    app.sendMessage("NUEVA Super");

    expect(app.lastMessage()).toContain("Registro completado");

    const ingresos = testUtils.sheetObjects(app, "SHEET_INGRESOS");

    expect(ingresos).toHaveLength(1);

    const ingreso = ingresos[0]

    expect(ingreso["Categoría"]).toBe("Super");
    expect(ingreso["Monto"]).toBe(50000);
    expect(ingreso["ID"]).toMatch(/^ING-/);
  })
});