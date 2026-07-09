import { describe, expect, test } from "vitest";
import { createGasTestRuntime } from "../gasTestRuntime.js";
import * as testUtils from "../testUtils.js";

describe("DEUDAS", () => {
    test("se puede crear un nuevo deudor al guardar una deuda", () => {
        const app = createGasTestRuntime();
    
        app.sendMessage(testUtils.fullDeuda());
    
        app.sendMessage("NUEVO Galicia");
    
        expect(app.lastMessage()).toContain("Deuda creada");
    
        const deudas = testUtils.sheetRowsByConfig(app, "SHEET_DEUDAS");
    
        expect(deudas).toHaveLength(1);
    
        const deuda = testUtils.sheetObjects(app, "SHEET_DEUDAS")[0]
    
        expect(deuda["Persona/Entidad"]).toBe("Galicia");
    });

    test("tira error al crear un deudor invalido al guardar una deuda", () => {
        const app = createGasTestRuntime();

        app.sendMessage(testUtils.fullDeuda());

        app.sendMessage("NUEVO ");

        expect(app.lastMessages(2)[0]).toContain("Formato incorrecto");
        expect(app.lastMessage()).toContain("Elegí el deudor");
    });
    
    test("permite crear una categoria", () => {
        const app = createGasTestRuntime();

        app.sendMessage(testUtils.fullGasto());

        app.sendMessage("NUEVA Comida");

        expect(app.lastMessage()).toContain("Registro completado");

        const gastos = testUtils.sheetObjects(app, "SHEET_GASTOS");

        expect(gastos).toHaveLength(1);

        const gasto = gastos[0]

        expect(gasto["Categoría"]).toBe("Comida");
        expect(gasto["Detalle"]).toBe("Entrada cine");
    });
})