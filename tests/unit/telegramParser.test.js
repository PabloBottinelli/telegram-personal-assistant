import fs from "node:fs";
import vm from "node:vm";
import { beforeEach, describe, expect, test } from "vitest";

describe("Parser de mensajes Telegram", () => {
  let parse;

  beforeEach(() => {
    const context = vm.createContext({});
    for (const file of ["config/commands.js", "shared/parsers.js"]) {
      const source = fs.readFileSync(new URL(`../../${file}`, import.meta.url), "utf8");
      vm.runInContext(source, context, { filename: file });
    }
    parse = context.parseTelegramMessage_;
  });

  test.each([
    ["GASTO, 100,50, Efectivo, pan, leche", ["GASTO", "100,50", "Efectivo", "pan, leche"]],
    ["INGRESO, 100.50, venta, devolución", ["INGRESO", "100.50", "venta, devolución"]],
    ["TC, 100,50, pan,  leche,queso, frutas", ["TC", "100,50", "pan,  leche,queso, frutas"]],
    ["  gasto,  100,50,  Efectivo,  pan, leche  ", ["gasto", "100,50", "Efectivo", "pan, leche"]],
    ["GASTO, 100, , pan", ["GASTO", "100", "", "pan"]],
    ["INGRESO, , Venta", ["INGRESO", "", "Venta"]],
    ["TC, 100, ", ["TC", "100", ""]],
    ["GASTO, 100, Efectivo", ["GASTO", "100", "Efectivo"]],
    ["TOTALES, 6, 2025", ["TOTALES", "6", "2025"]],
    ["TOTALES, , 2025", ["TOTALES", "", "2025"]],
    ["COMANDOS", ["COMANDOS"]],
    ["INGRESO,100,Venta", ["INGRESO,100,Venta"]]
  ])("interpreta %j sin desplazar campos ni alterar el detalle", (message, expected) => {
    expect(parse(message)).toEqual(expected);
  });

  test.each(["\n", "\r\n", "\r"])("admite saltos de línea %j y conserva campos vacíos", newline => {
    const fields = ["INGRESO", "-", "", "ARS", "Venta, devolución"];
    expect(parse(fields.join(newline))).toEqual(fields);
  });

  test("el formato largo conserva decimales y comas dentro de cada línea", () => {
    const fields = ["GASTO", "-", "100,50", "ARS", "Efectivo", "10,25", "pan, leche", "D", "-"];
    expect(parse(fields.join("\n"))).toEqual(fields);
  });

  test("no elimina una línea vacía al principio ni al final", () => {
    expect(parse("\nINGRESO\n100\nVenta\n")).toEqual(["", "INGRESO", "100", "Venta", ""]);
  });

  test.each([undefined, null, "", "   ", "\r\n"])("la entrada vacía %j devuelve una lista vacía", input => {
    expect(parse(input)).toEqual([]);
  });
});
