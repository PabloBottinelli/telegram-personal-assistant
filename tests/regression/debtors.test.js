import { describe, expect, should, test } from "vitest";
import { createGasTestRuntime } from "../gasTestRuntime.js";
import * as testUtils from "../testUtils.js";

describe("Debtors", () => {
    // Avisos y errores
    test("Si no hay deudores, muestra un mensaje de aviso", () => {
        expect(false).toBe(true)
    })

    test("Si el deudor ya existe, no se vuelve a agregar, salta un aviso y el deudor permanece guardada", () => {
        expect(false).toBe(true)
    })

    // Funcionamiento
    test("El comando deudores lista correctamente los deudores", () => {
        const app = createGasTestRuntime()

        testUtils.seedDeudores(app)

        app.sendMessage("DEUDORES")

        expect(app.lastMessage()).toContain("Juan")
        expect(app.lastMessage()).toContain("Galicia")
    })

    test("Se puede crear correctamente un deudor", () => {
        expect(false).toBe(true)
    })

    test("Se puede editar el nombre de un deudor y el cambio impacta correctamente en los registros donde se uso", () => {
        expect(false).toBe(true)
    })

    test("Se puede eliminar un deudor y eso elimina todas sus deudas", () => {
        expect(false).toBe(true)
    })

    test("Solo se puede eliminar o editar un deudor valido", () => {
        expect(false).toBe(true)
    })
});