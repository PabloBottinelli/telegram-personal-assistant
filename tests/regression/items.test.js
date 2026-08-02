import { describe, expect, test } from "vitest";
import { createGasTestRuntime } from "../gasTestRuntime.js";
import * as testUtils from "../testUtils.js";

describe("DEUDAS", () => {
    test("se puede crear un nuevo deudor al guardar una deuda", () => {
        const app = createGasTestRuntime();
    
        app.sendMessage(testUtils.fullDeuda());
    
        app.sendMessage("NUEVO Galicia");
    
        expect(app.lastMessage()).toContain("Deuda registrada.");
    
        const deudas = testUtils.sheetObjects(app, "SHEET_DEUDAS");
    
        expect(deudas).toHaveLength(1);
    
        const deuda = deudas[0]
    
        expect(deuda["Deudor"]).toBe("Galicia");
    });

    test("tira error al crear un deudor invalido al guardar una deuda", () => {
        const app = createGasTestRuntime();

        app.sendMessage(testUtils.fullDeuda());

        app.sendMessage("NUEVO ");

        expect(app.lastMessages(2)[0]).toContain("Tenés que poner un nombre después");
        expect(app.lastMessage()).toContain("Seleccioná un deudor");
    });

    test("no se pueden guardar dos items con igual nombre", () => {
        const app = createGasTestRuntime();

        app.sendMessage("NUEVA TARJETA \n BBVA Visa")

        expect(app.lastMessage()).toContain("Tarjeta agregada")

        app.sendMessage("NUEVA TARJETA \n BBVA Visa")

        expect(app.lastMessage()).toContain("Ese item ya existe")

        const tarjetas = testUtils.sheetObjects(app, "SHEET_TARJETAS")

        expect(tarjetas).toHaveLength(1);

        const tarjeta = tarjetas[0]
        
        expect(tarjeta["Tarjeta de crédito"]).toBe("BBVA Visa")
    })
})