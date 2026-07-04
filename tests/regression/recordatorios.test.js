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
        const app = createGasTestRuntime()

        app.sendMessage("Recordatorio \n Diario")
        app.sendMessage("1")
        app.sendMessage("08:00")
        expect(app.lastMessage()).toContain("Recordatorio creado.")

        app.sendMessage("Recordatorio \n Cada n dias")
        app.sendMessage("4")
        app.sendMessage("2")
        app.sendMessage("-")
        expect(app.lastMessage()).toContain("Recordatorio creado.")

        app.sendMessage("Recordatorio \n Mensual")
        app.sendMessage("5")
        app.sendMessage("5")
        app.sendMessage("-")
        expect(app.lastMessage()).toContain("Recordatorio creado.")

        app.sendMessage("Recordatorio \n Multiple Semanal")
        app.sendMessage("3")
        app.sendMessage("Lunes, viernes, martes")
        app.sendMessage("-")
        expect(app.lastMessage()).toContain("Recordatorio creado.")

        app.sendMessage("Recordatorio \n Una vez")
        app.sendMessage("6")
        app.sendMessage("06/07")
        app.sendMessage("-")
        expect(app.lastMessage()).toContain("Recordatorio creado.")

        app.sendMessage("Recordatorio \n Semanal")
        app.sendMessage("2")
        app.sendMessage("Lunes")
        expect(app.lastMessage()).toContain("recordatorio semanal")

        const recordatorios = testUtils.sheetObjects(app, "SHEET_RECORDATORIOS")
        expect(recordatorios).toHaveLength(6)
        console.log(recordatorios)
    })
})