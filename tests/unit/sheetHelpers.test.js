import { beforeAll, describe, expect, test } from "vitest";
import { createGasTestRuntime } from "../gasTestRuntime.js";
import { FakeSheet } from "../fakeSheets.js";
import { getGlobal } from "../testUtils.js";

describe("Sheet helpers", () => {
  let findNextRow;
  let sortByDate;

  beforeAll(() => {
    const app = createGasTestRuntime();
    findNextRow = getGlobal(app, "findNextRowInTable_");
    sortByDate = getGlobal(app, "sortTableByDate_");
  });

  describe("findNextRowInTable_", () => {
    test.each([
      {
        caso: "solo encabezados",
        values: [["ID", "Detalle"]],
        expected: 2
      },
      {
        caso: "un hueco entre registros",
        values: [["ID", "Detalle"], ["A", "Primero"], [], ["B", "Segundo"]],
        expected: 5
      },
      {
        caso: "la columna A vacía y datos en otras columnas",
        values: [["Notas", "ID"], ["", "A"], [], ["", "B"]],
        expected: 5
      },
      {
        caso: "filas vacías después del último registro",
        values: [["ID", "Detalle"], ["A", "Primero"], [], ["", ""]],
        expected: 3
      }
    ])("inserta después de la última fila con datos: $caso", ({ values, expected }) => {
      const sheet = new FakeSheet("Tabla");
      sheet.values = values;

      expect(findNextRow(sheet)).toBe(expected);
    });
  });

  describe("sortTableByDate_", () => {
    test("ordena por Fecha reubicada y conserva encabezados y columnas adicionales", () => {
      const headers = ["ID", "Fecha", "Detalle", "Notas"];
      const older = ["Z", new Date(2026, 9, 10, 12), "Viejo", "Nota Z"];
      const newer = ["A", new Date(2026, 9, 30, 12), "Nuevo", "Nota A"];
      const middle = ["M", new Date(2026, 9, 20, 12), "Intermedio", "Nota M"];
      const sheet = new FakeSheet("Tabla", headers);
      sheet.values.push(...[older, [], newer, middle].map(row => [...row]));

      // Incluye también las columnas que exceden el ancho informado.
      sortByDate(sheet, 2);

      expect(sheet.getRange(1, 1, 5, 4).getValues()).toEqual([
        headers, newer, middle, older, ["", "", "", ""]
      ]);
    });

    test("no modifica una hoja que solo tiene encabezados", () => {
      const sheet = new FakeSheet("Tabla", ["Fecha", "ID"]);

      sortByDate(sheet, sheet.getLastColumn());

      expect(sheet.values).toEqual([["Fecha", "ID"]]);
    });

    test("informa la columna faltante sin modificar los registros", () => {
      const sheet = new FakeSheet("Sin fecha", ["ID", "Detalle"]);
      sheet.values.push(["A", "Primero"]);

      expect(() => sortByDate(sheet, sheet.getLastColumn()))
        .toThrow('Falta la columna "Fecha" en "Sin fecha".');
      expect(sheet.values).toEqual([["ID", "Detalle"], ["A", "Primero"]]);
    });
  });
});
