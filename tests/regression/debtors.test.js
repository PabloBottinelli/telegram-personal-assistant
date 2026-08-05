import { describe, expect, should, test } from "vitest";
import { createGasTestRuntime } from "../gasTestRuntime.js";
import * as testUtils from "../testUtils.js";

describe("Debtors", () => {
    // Avisos y errores
    test.todo("Si no hay deudores, muestra un mensaje de aviso")

    test.todo("Si el deudor ya existe, no se vuelve a agregar, salta un aviso y el deudor permanece guardada")

    // Funcionamiento
    test("El comando deudores lista correctamente los deudores", () => {
        const app = createGasTestRuntime()

        testUtils.seedDeudores(app)

        app.sendMessage("DEUDORES")

        expect(app.lastMessage()).toContain("Juan")
        expect(app.lastMessage()).toContain("Galicia")
    })

    test.todo("Se puede crear correctamente un deudor")

    test.todo("Se puede editar el nombre de un deudor y el cambio impacta correctamente en los registros donde se uso")

    test.todo("Se puede eliminar un deudor y eso elimina todas sus deudas")

    test.todo("Solo se puede eliminar o editar un deudor valido")

    test.todo("Se pueden listar los deudores")
});