import { describe, expect, test } from "vitest";
import { createGasTestRuntime } from "../gasTestRuntime.js";
import * as testUtils from "../testUtils.js";

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
