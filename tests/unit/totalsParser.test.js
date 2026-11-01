import fs from "node:fs";
import vm from "node:vm";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

describe("Año y período de totales", () => {
  let context;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 23, 12));
    context = vm.createContext({ Date });
    for (const file of ["shared/dates.js", "domain/totals/totalsParser.js"]) {
      const source = fs.readFileSync(new URL(`../../${file}`, import.meta.url), "utf8");
      vm.runInContext(source, context, { filename: file });
    }
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test.each([
    ["2025", 2025], [" 2026 ", 2026], [2025, 2025],
    ["0001", 1], ["9999", 9999], ["-", 2026], [" - ", 2026]
  ])("parseYear_(%j) devuelve %s", (input, expected) => {
    expect(context.parseYear_(input)).toBe(expected);
  });

  test.each([
    undefined, null, "", "   ", 0, "0000", "25", "10000",
    "2025abc", "2025.5", "2025,5", "2e03", "0x7E9", "-2025", "+2025"
  ])("parseYear_ rechaza %j", input => {
    expect(context.parseYear_(input)).toBeNull();
  });

  test.each([
    ["Junio", "2025", 2025, 5, "Junio"],
    ["6", "2025", 2025, 5, "Junio"],
    ["Junio", undefined, 2026, 5, "Junio"],
    ["Junio", null, 2026, 5, "Junio"],
    ["Junio", "-", 2026, 5, "Junio"],
    ["-", "2025", 2025, 9, "Octubre"]
  ])("parseDate(%j, %j) resuelve el período", (month, year, expectedYear, monthNumber, monthText) => {
    expect(context.TotalsParser.parseDate(month, year)).toEqual({
      ok: true,
      value: { year: expectedYear, monthNumber, monthText }
    });
  });

  test.each([0, false, "", "   ", "0000", "2025abc", "2025.5"])(
    "un año inválido explícito %j no se reemplaza por el actual", year => {
      expect(context.TotalsParser.parseDate("Junio", year)).toEqual({
        ok: false, error: "INVALID_YEAR"
      });
    }
  );

  test.each(["mes-inexistente", "13", "6.5"])(
    "un mes inválido %j conserva su error aunque haya año", month => {
      expect(context.TotalsParser.parseDate(month, "2025")).toEqual({
        ok: false, error: "INVALID_MONTH"
      });
    }
  );

  test("el año predeterminado cambia al cruzar de diciembre a enero", () => {
    vi.setSystemTime(new Date(2026, 11, 31, 23, 59));
    expect(context.TotalsParser.parseDate("Junio").value.year).toBe(2026);
    vi.setSystemTime(new Date(2027, 0, 1, 0, 1));
    expect(context.TotalsParser.parseDate("Junio").value.year).toBe(2027);
    expect(context.parseYear_("-")).toBe(2027);
    expect(context.TotalsParser.parseDate("Junio", "2025").value.year).toBe(2025);
  });
});
