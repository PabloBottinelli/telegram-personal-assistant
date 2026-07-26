import { describe, expect, test } from "vitest";
import { createGasTestRuntime } from "../gasTestRuntime.js";
import * as testUtils from "../testUtils.js";

describe("CATEGORÍAS", () => {
    test("El comando Categorias lista correctamente las categorias", () => {
        const app = createGasTestRuntime();

        testUtils.seedCategorias(app);

        app.sendMessage("Categorias")

        expect(app.lastMessage()).toContain("Super")
        expect(app.lastMessage()).toContain("Ajeno")
        expect(app.lastMessage()).toContain("Comida")
    })

    test("Si no hay categorias, muestra un mensaje de aviso", () => {
        expect(false).toBe(true)
    })
});