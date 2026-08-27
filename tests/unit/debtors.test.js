import { describe, expect, should, test } from "vitest";
import { createGasTestRuntime } from "../gasTestRuntime.js";
import * as testUtils from "../testUtils.js";

describe("Debtors", () => {
    // Avisos y errores
    test("Si no hay deudores, muestra un mensaje de aviso", () => {
        const app = createGasTestRuntime();

        app.sendMessage("DEUDORES");

        expect(app.lastMessage()).toContain("No hay deudores cargados.");
    })

    test("Si el deudor ya existe, no se vuelve a agregar, salta un aviso y el deudor permanece guardada", () => {
        const app = createGasTestRuntime();

        testUtils.seedDeudores(app);

        app.sendMessage("NUEVO DEUDOR Juan");

        expect(app.lastMessage()).toContain("Ya existe ese deudor.");

        app.sendMessage("DEUDORES")

        expect((app.lastMessage().match(/Juan/g) || []).length).toBe(1)
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
        const app = createGasTestRuntime();

        app.sendMessage("NUEVO DEUDOR Juan");

        expect(app.lastMessage()).toContain("Deudor agregado")

        const deudores = testUtils.sheetObjects(app, "SHEET_DEUDORES")

        expect(deudores).toHaveLength(1);

        const deudor = deudores[0]

        expect(deudor["Nombre"]).toBe("Juan")
    })

    test.todo("Se puede editar el nombre de un deudor y el cambio impacta correctamente en los registros donde se uso")

    test.todo("Se puede eliminar un deudor y eso elimina todas sus deudas")

    test.todo("Solo se puede eliminar o editar un deudor valido")
});