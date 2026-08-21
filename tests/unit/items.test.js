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
});
