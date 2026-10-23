import { describe, expect, test } from "vitest";
import { FakeSheet } from "../fakeSheets.js";

describe("FakeRange.sort", () => {
  test("ordena solo las filas y columnas del rango con una columna absoluta", () => {
    const sheet = new FakeSheet("Tabla", ["Auxiliar", "ID", "Fecha"]);
    const older = new Date(2026, 9, 10, 12);
    const newer = new Date(2026, 9, 30, 12);
    sheet.values.push(
      ["Fijo 1", "Z", older],
      ["Fijo 2", "A", newer],
      ["Fuera del rango", "M", new Date(2026, 10, 1, 12)]
    );

    sheet.getRange(2, 2, 2, 2).sort({ column: 3, ascending: false });

    expect(sheet.values).toEqual([
      ["Auxiliar", "ID", "Fecha"],
      ["Fijo 1", "A", newer],
      ["Fijo 2", "Z", older],
      ["Fuera del rango", "M", new Date(2026, 10, 1, 12)]
    ]);
  });

  test.each([true, false])("deja los huecos al final con ascending=%s", ascending => {
    const sheet = new FakeSheet("Tabla", ["Fecha"]);
    const older = new Date(2026, 9, 10, 12);
    const newer = new Date(2026, 9, 30, 12);
    sheet.values.push([older], [], [newer]);

    sheet.getRange(2, 1, 3, 1).sort({ column: 1, ascending });

    expect(sheet.values).toEqual([
      ["Fecha"],
      ...((ascending ? [older, newer] : [newer, older]).map(date => [date])),
      [""]
    ]);
  });
});
