import { describe, expect, test } from "vitest";
import { createGasTestRuntime } from "../gasTestRuntime.js";
import * as testUtils from "../testUtils.js";

describe("Recordatorios", () => {
    test("salta error si la cantidad de lineas es erronea", () => {
        const app = createGasTestRuntime()
        const FORMATS = testUtils.getGlobal(app, "FORMATS");

        app.sendMessage("Recordatorio")

        expect(app.lastMessage()).toContain(FORMATS["RECORDATORIO"])
    })

    test("guarda un recordatorio de cada tipo correctamente", () => {
        
    })
})