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

  test("Se pueden listar ingresos", () => {
    const app = createGasTestRuntime();

    testUtils.seedCategorias(app);

    testUtils.crearIngresoDesdeBot(app, {
      monto: "100000",
      detalle: "Sueldo junio"
    });

    testUtils.crearIngresoDesdeBot(app, {
      monto: "50000",
      detalle: "Venta de muebles",
      catIndex: "3"
    });
    
    app.sendMessage("INGRESOS");

    const msg = app.lastMessage()

    expect(msg).toContain("Sueldo junio");
    expect(msg).toContain("Super");
    expect(msg).toContain("$100.000,00");
    expect(msg).toContain("Venta de muebles");
    expect(msg).toContain("Comida");
    expect(msg).toContain("$50.000,00");
  });

  test("Si no hay ingresos, al querer listarlos se notifica", () => {
    const app = createGasTestRuntime();

    app.sendMessage("INGRESOS");

    expect(app.lastMessage()).toContain("No hay ingresos guardados");
  });

  test("INGRESOS 2 lista solo los 10 ingresos de la segunda página", () => {
    const app = createGasTestRuntime();

    testUtils.seedCategorias(app);

    const detalles = Array.from({ length: 21 }, (_, index) =>
      `Ingreso paginado ${String(index + 1).padStart(2, "0")}`
    );

    for (const [index, detalle] of detalles.entries()) {
      testUtils.crearIngresoDesdeBot(app, {
        fecha: `${21 - index}/06`,
        detalle
      });
    }

    app.sendMessage("INGRESOS\n 2");

    const msg = app.lastMessage();
    const ingresosListados = msg.match(/Ingreso paginado \d{2}/g);

    expect(ingresosListados).toEqual(detalles.slice(10, 20));
  });

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

  test("Si creas una categoría nueva durante un flujo, avisa y no la vuelve a guardar.", () => {
    const app = createGasTestRuntime();

    testUtils.seedCategorias(app)

    app.sendMessage([
      "INGRESO",
      "50000",
      "Venta"
    ].join("\n"));

    app.sendMessage("NUEVA Super");

    expect(app.lastMessage()).toContain("Super ya existe, no se guardará nuevamente.");
    expect(app.lastMessage()).toContain('Registro completado con categoría "Super".');

    const ingresos = testUtils.sheetObjects(app, "SHEET_INGRESOS");
    const categories = testUtils.sheetObjects(app, "SHEET_CATEGORIAS")

    expect(categories.filter(category => category["Categoría"] === "Super")).toHaveLength(1);

    expect(ingresos).toHaveLength(1);

    const ingreso = ingresos[0]

    expect(ingreso["Categoría"]).toBe("Super");
    expect(ingreso["Monto"]).toBe(50000);
    expect(ingreso["ID"]).toMatch(/^ING-/);
  })
});
