import { describe, expect, test } from "vitest";
import vm from "node:vm";
import { createGasTestRuntime } from "../gasTestRuntime.js";
import { rowToObject, getGlobal, appendRowsByConfig, sheetRowsByConfig } from "../testUtils.js";


function fullDeuda({
  monto = "100000",
  moneda = "ARS",
  detalle = "Prestamo"
} = {}) {
  return ["DEUDA", monto, moneda, detalle].join("\n");
}

describe("INGRESO", () => {
    test("guarda una deuda simple sin gasto asociado correctamente", () => {
        const app = createGasTestRuntime();

        appendRowsByConfig(app, "SHEET_DEUDORES", [
        ["Galicia", "DEUDOR-1"],
        ]);
        
        app.sendMessage(fullDeuda());

        expect(app.lastMessage()).toContain("Elegí el deudor");

        app.sendMessage("1")

        expect(app.lastMessage()).toContain("Deuda creada");

        const deudas = sheetRowsByConfig(app, "SHEET_DEUDAS");

        expect(deudas).toHaveLength(1);

        const SHEET_DEUDAS = getGlobal(app, "SHEET_DEUDAS");
        const deuda = rowToObject(SHEET_DEUDAS.headers, deudas[0]);

        const hoy = new Date();

        expect(deuda["Fecha"]).toBeInstanceOf(Date);
        expect(deuda["Fecha"].getDate()).toBe(hoy.getDate());
        expect(deuda["Fecha"].getMonth()).toBe(hoy.getMonth());
        expect(deuda["Fecha"].getFullYear()).toBe(hoy.getFullYear());
        expect(deuda["Persona/Entidad"]).toBe("Galicia");
        expect(deuda["Monto"]).toBe(100000);
        expect(deuda["Moneda"]).toBe("ARS");
        expect(deuda["Monto Pendiente"]).toBe(100000);
        expect(deuda["Detalle"]).toBe("Prestamo");
        expect(deuda["Estado"]).toBe("Pendiente");
        expect(deuda["Deuda ID"]).toMatch(/^DEU-/);
        expect(deuda["Gasto ID"]).toMatch("");
    });

    test("no se guarda con input invalido", () => {
        const app = createGasTestRuntime();

        appendRowsByConfig(app, "SHEET_DEUDORES", [
        ["Galicia", "DEUDOR-1"],
        ]);
        
        app.sendMessage(fullDeuda({monto: "-2", moneda: "arsf"}));

        expect(app.lastMessage()).toContain("Monto inválido.");
        expect(app.lastMessage()).toContain("Moneda inválida.");

        const deudas = sheetRowsByConfig(app, "SHEET_DEUDAS");

        expect(deudas).toHaveLength(0);
    });
});