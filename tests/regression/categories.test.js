import { describe, expect, test } from "vitest";
import { createGasTestRuntime } from "../gasTestRuntime.js";
import * as testUtils from "../testUtils.js";

describe("Categories", () => {
    // Avisos y errores
    test.todo("Al listar categorias, si no hay, muestra un mensaje de aviso")

    test.todo("Si la categoria ya existe, no se vuelve a agregar, salta un aviso y la categoria permanece guardada")

    // Funcionamiento

    test("El comando Categorias lista correctamente las categorias", () => {
        const app = createGasTestRuntime();

        testUtils.seedCategorias(app);

        app.sendMessage("Categorias")

        expect(app.lastMessage()).toContain("Super")
        expect(app.lastMessage()).toContain("Ajeno")
        expect(app.lastMessage()).toContain("Comida")
    })

    test.todo("Se puede crear correctamente una categoria")

    test.todo("Se puede editar el nombre de una categoria y el cambio impacta correctamente en los registros donde se uso")

    test.todo("Se puede eliminar una categoria que no se uso")

    test.todo("Se puede eliminar una categoria que se uso y pregunta cual es la nueva categoria para los registros donde se uso la eliminada")

    test.todo("Solo se puede eliminar o editar una categoria valida")
});