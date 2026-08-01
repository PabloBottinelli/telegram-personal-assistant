import { describe, expect, test } from "vitest";
import { createGasTestRuntime } from "../gasTestRuntime.js";
import * as testUtils from "../testUtils.js";

describe("Categories", () => {
    // Avisos y errores

    test("Si no hay categorias, muestra un mensaje de aviso", () => {
        expect(false).toBe(true)
    })

    test("Salta error si el formato del comando es incorrecto", () => {
        expect(false).toBe(true)
    })

    test("Salta error si no se respeta el formato al crear una categoria", () => {
        expect(false).toBe(true)
    })

    test("Si la categoria ya existe, no se vuelve a agregar, salta un aviso y la categoria permanece guardada", () => {
        expect(false).toBe(true)
    })

    // Funcionamiento

    test("El comando Categorias lista correctamente las categorias", () => {
        const app = createGasTestRuntime();

        testUtils.seedCategorias(app);

        app.sendMessage("Categorias")

        expect(app.lastMessage()).toContain("Super")
        expect(app.lastMessage()).toContain("Ajeno")
        expect(app.lastMessage()).toContain("Comida")
    })

    test("Se puede crear correctamente una categoria", () => {
        expect(false).toBe(true)
    })

    test("Se puede editar el nombre de una categoria y el cambio impacta correctamente en los registros donde se uso", () => {
        expect(false).toBe(true)
    })

    test("Se puede eliminar una categoria que no se uso", () => {
        expect(false).toBe(true)
    })

    test("Se puede eliminar una categoria que se uso y pregunta cual es la nueva categoria para los registros donde se uso la eliminada", () => {
        expect(false).toBe(true)
    })

    test("Solo se puede eliminar o editar una categoria valida", () => {
        expect(false).toBe(true)
    })
});