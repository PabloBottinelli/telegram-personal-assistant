import { describe, expect, test } from "vitest";
import { createGasTestRuntime } from "../gasTestRuntime.js";
import * as testUtils from "../testUtils.js";

describe("ItemService", () => {
  describe.each(["parseSelection", "parseExistingSelection"])("%s", method => {
    test.each(["1abc", "1.5", "1e0", "1 2", "+1", "-1", "0", "4", "", "   "])(
      "rechaza la opción inválida %j sin modificar items",
      message => {
        const app = createGasTestRuntime();
        testUtils.seedCategorias(app);
        const service = testUtils.getGlobal(app, "ItemService");
        const sheet = testUtils.getGlobal(app, "SHEET_CATEGORIAS");
        const errors = testUtils.getGlobal(app, "MSG_ERRORS");
        const before = testUtils.sheetObjects(app, "SHEET_CATEGORIAS");

        expect(service[method](message, sheet.name)).toEqual({
          ok: false,
          error: errors.NUMERO_INVALIDO
        });
        expect(testUtils.sheetObjects(app, "SHEET_CATEGORIAS")).toEqual(before);
      }
    );

    test.each([["1", "Super"], [" 3 ", "Comida"]])(
      "acepta la opción %j y selecciona %s sin modificar items",
      (message, category) => {
        const app = createGasTestRuntime();
        testUtils.seedCategorias(app);
        const service = testUtils.getGlobal(app, "ItemService");
        const sheet = testUtils.getGlobal(app, "SHEET_CATEGORIAS");
        const before = testUtils.sheetObjects(app, "SHEET_CATEGORIAS");

        expect(service[method](message, sheet.name)).toEqual({ ok: true, value: category });
        expect(testUtils.sheetObjects(app, "SHEET_CATEGORIAS")).toEqual(before);
      }
    );
  });

  test.each(["NUEVAx Viajes", "NUEVOJuan", "NUEVAMENTE Viajes", "NUEVA", "NUEVO   "])(
    "parseSelection rechaza el comando incompleto %j sin crear items",
    message => {
      const app = createGasTestRuntime();
      const service = testUtils.getGlobal(app, "ItemService");
      const sheet = testUtils.getGlobal(app, "SHEET_CATEGORIAS");

      expect(service.parseSelection(message, sheet.name).ok).toBe(false);
      expect(testUtils.sheetObjects(app, "SHEET_CATEGORIAS")).toHaveLength(0);
    }
  );

  test.each(["NUEVA Viajes", "nuevo Viajes", "  NuEvA   Viajes  "])(
    "parseSelection permite el alta explícita con %j",
    message => {
      const app = createGasTestRuntime();
      const service = testUtils.getGlobal(app, "ItemService");
      const sheet = testUtils.getGlobal(app, "SHEET_CATEGORIAS");

      expect(service.parseSelection(message, sheet.name)).toEqual({
        ok: true,
        exist: false,
        value: "Viajes"
      });
      expect(testUtils.sheetObjects(app, "SHEET_CATEGORIAS")).toEqual([
        expect.objectContaining({ "Categoría": "Viajes" })
      ]);
    }
  );

  test.each(["NUEVO Ana", "nuevo Ana", "NUEVA Ana", "nueva Ana"])(
    "parseExistingSelection rechaza %j sin crear items",
    message => {
      const app = createGasTestRuntime();
      const service = testUtils.getGlobal(app, "ItemService");
      const sheet = testUtils.getGlobal(app, "SHEET_DEUDORES");
      const errors = testUtils.getGlobal(app, "MSG_ERRORS");

      expect(service.parseExistingSelection(message, sheet.name)).toEqual({
        ok: false,
        error: errors.NUMERO_INVALIDO
      });
      expect(testUtils.sheetObjects(app, "SHEET_DEUDORES")).toHaveLength(0);
    }
  );
});

describe("ItemRepository", () => {
  test("lista y encuentra items por header aunque la columna de nombre no sea la primera", () => {
    const app = createGasTestRuntime();
    const sheetConfig = testUtils.getGlobal(app, "SHEET_CATEGORIAS");
    const repository = testUtils.getGlobal(app, "ItemRepository");
    const sheet = app.spreadsheet.getSheetByName(sheetConfig.name);

    sheet.values = [
      ["ID", sheetConfig.headers[0]],
      ["CAT-1", "Super"],
      ["CAT-2", "Comida"]
    ];

    expect(repository.list(sheetConfig.name)).toEqual(["Super", "Comida"]);
    expect(repository.findRowByName("comida", sheetConfig.name, sheet.getLastColumn())).toBe(3);
    expect(repository.findRowByName("Inexistente", sheetConfig.name, sheet.getLastColumn())).toBeNull();
  });

  test("Si creas un item nuevo durante un flujo, avisa y no la vuelve a guardar.", () => {
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
