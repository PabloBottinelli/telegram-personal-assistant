import { describe, expect, test } from "vitest";
import { createGasTestRuntime } from "../gasTestRuntime.js";
import * as testUtils from "../testUtils.js";

describe("Categories", () => {
    // Avisos y errores
    test("Al listar categorias, si no hay, muestra un mensaje de aviso", () => {
        const app = createGasTestRuntime();

        app.sendMessage("Categorias")

        expect(app.lastMessage()).toContain("No hay categorías guardadas")
    })

    test("Si la categoria ya existe, no se vuelve a agregar, salta un aviso y la categoria permanece guardada", () => {
        const app = createGasTestRuntime();

        testUtils.seedCategorias(app);

        app.sendMessage("NUEVA CATEGORIA \n Super")

        expect(app.lastMessage()).toContain("Ese item ya existe")
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
        const app = createGasTestRuntime();

        app.sendMessage("NUEVA CATEGORIA \n Super")

        expect(app.lastMessage()).toContain('Categoría agregada: "Super"');

        const categorias = testUtils.sheetObjects(app, "SHEET_CATEGORIAS");
        expect(categorias[0]["Categoría"]).toBe("Super");
    })

    test("Se puede editar el nombre de una categoria y el cambio impacta correctamente en los registros donde se uso", () => {
        const app = createGasTestRuntime();

        testUtils.seedCategorias(app);

        testUtils.appendRowsByConfig(app, "SHEET_GASTOS", [
            [new Date(2026, 5, 10, 12, 0, 0), "Super", "Efectivo", 5000, "ARS", 0, "Compra", "-", true, "GAS-1"]
        ]);

        app.sendMessage("EDITAR CATEGORIA");
        app.sendMessage("1");
        app.sendMessage("Supermercado");

        expect(app.lastMessage()).toContain('Categoría "Super" renombrada como "Supermercado"');

        const categorias = testUtils.sheetObjects(app, "SHEET_CATEGORIAS");
        const gastos = testUtils.sheetObjects(app, "SHEET_GASTOS");

        expect(categorias.some(x => x["Categoría"] === "Supermercado")).toBe(true);
        expect(categorias.some(x => x["Categoría"] === "Super")).toBe(false);
        expect(gastos[0]["Categoría"]).toBe("Supermercado");
    });

    test("No se puede cambiar el nombre de una categoria por un nombre existente", () => {
        const app = createGasTestRuntime();
        let MSG_ERRORS = testUtils.getGlobal(app, "MSG_ERRORS");

        testUtils.seedCategorias(app);

        app.sendMessage("EDITAR CATEGORIA");
        app.sendMessage("1"); // Super
        app.sendMessage("Comida"); // Ya existe

        expect(app.lastMessage()).toContain(MSG_ERRORS.ITEM_EXISTENTE);

        const categorias = testUtils.sheetObjects(app, "SHEET_CATEGORIAS");

        expect(categorias.some(c => c["Categoría"] === "Super")).toBe(true);
        expect(categorias.some(c => c["Categoría"] === "Comida")).toBe(true);
        expect(categorias).toHaveLength(3);

        // El flujo sigue esperando un nombre nuevo válido
        app.sendMessage("Supermercado");

        expect(app.lastMessage()).toContain('Categoría "Super" renombrada como "Supermercado"');

        const categoriasActualizadas = testUtils.sheetObjects(app, "SHEET_CATEGORIAS");

        expect(categoriasActualizadas.some(c => c["Categoría"] === "Super")).toBe(false);
        expect(categoriasActualizadas.some(c => c["Categoría"] === "Supermercado")).toBe(true);
        expect(categoriasActualizadas.some(c => c["Categoría"] === "Comida")).toBe(true);
    });

    test("Se puede eliminar una categoría reemplazándola por otra", () => {
        const app = createGasTestRuntime();

        testUtils.seedCategorias(app);

        testUtils.appendRowsByConfig(app, "SHEET_GASTOS", [
            [new Date(2026, 5, 10, 12, 0, 0), "Super", "Efectivo", 5000, "ARS", 0, "Compra supermercado", "-", true, "GAS-1"]
        ]);

        app.sendMessage("ELIMINAR CATEGORIA");
        app.sendMessage("1"); // Super

        expect(app.lastMessage()).toContain('Seleccioná');

        app.sendMessage("3"); // Comida

        expect(app.lastMessage()).toContain('Categoría "Super" eliminada');
        expect(app.lastMessage()).toContain('"Comida"');

        const categorias = testUtils.sheetObjects(app, "SHEET_CATEGORIAS");

        expect(categorias.some(c => c["Categoría"] === "Super")).toBe(false);
        expect(categorias.some(c => c["Categoría"] === "Comida")).toBe(true);
        expect(categorias).toHaveLength(2);
    });

    test("Al eliminar una categoría se actualizan los gastos que la usaban", () => {
        const app = createGasTestRuntime();

        testUtils.seedCategorias(app);

        testUtils.appendRowsByConfig(app, "SHEET_GASTOS", [
            [new Date(2026, 5, 10, 12, 0, 0), "Super", "Efectivo", 5000, "ARS", 0, "Compra 1", "-", true, "GAS-1"],
            [new Date(2026, 5, 11, 12, 0, 0), "Super", "Efectivo", 3000, "ARS", 0, "Compra 2", "-", true, "GAS-2"],
            [new Date(2026, 5, 12, 12, 0, 0), "Comida", "Efectivo", 2000, "ARS", 0, "Compra comida", "-", true, "GAS-3"]
        ]);

        app.sendMessage("ELIMINAR CATEGORIA");
        app.sendMessage("1"); // Super
        app.sendMessage("3"); // Comida

        const gastos = testUtils.sheetObjects(app, "SHEET_GASTOS");

        expect(gastos[0]["Categoría"]).toBe("Comida");
        expect(gastos[1]["Categoría"]).toBe("Comida");
        expect(gastos[2]["Categoría"]).toBe("Comida");
        expect(gastos.some(g => g["Categoría"] === "Super")).toBe(false);
    });

    test("Al eliminar una categoría se actualizan los ingresos que la usaban", () => {
        const app = createGasTestRuntime();

        testUtils.seedCategorias(app);

        app.sendMessage([
            "INGRESO",
            "10/06",
            "10000",
            "ARS",
            "Ingreso de prueba"
        ].join("\n"));

        app.sendMessage("1"); // Super

        expect(testUtils.sheetObjects(app, "SHEET_INGRESOS")).toHaveLength(1);
        expect(testUtils.sheetObjects(app, "SHEET_INGRESOS")[0]["Categoría"]).toBe("Super");

        app.sendMessage("ELIMINAR CATEGORIA");
        app.sendMessage("1"); // Super
        app.sendMessage("3"); // Comida

        const ingresos = testUtils.sheetObjects(app, "SHEET_INGRESOS");

        expect(ingresos).toHaveLength(1);
        expect(ingresos[0]["Categoría"]).toBe("Comida");
    });

    test("No se puede usar como reemplazo la misma categoría que se elimina", () => {
        const app = createGasTestRuntime();

        testUtils.seedCategorias(app);

        testUtils.appendRowsByConfig(app, "SHEET_GASTOS", [
            [new Date(2026, 5, 10, 12, 0, 0), "Super", "Efectivo", 5000, "ARS", 0, "Compra supermercado", "-", true, "GAS-1"]
        ]);

        app.sendMessage("ELIMINAR CATEGORIA");
        app.sendMessage("1"); // Super
        app.sendMessage("1"); // Super nuevamente

        expect(app.lastMessages(2)[0]).toContain("La categoría de reemplazo debe ser distinta");

        const categorias = testUtils.sheetObjects(app, "SHEET_CATEGORIAS");

        expect(categorias.some(c => c["Categoría"] === "Super")).toBe(true);
        expect(categorias).toHaveLength(3);

        app.sendMessage("3"); // Comida

        expect(app.lastMessage()).toContain('Categoría "Super" eliminada');

        const categoriasActualizadas = testUtils.sheetObjects(app, "SHEET_CATEGORIAS");

        expect(categoriasActualizadas.some(c => c["Categoría"] === "Super")).toBe(false);
    });

    test("Una selección de reemplazo inválida permite reintentar", () => {
        const app = createGasTestRuntime();

        testUtils.seedCategorias(app);

        testUtils.appendRowsByConfig(app, "SHEET_GASTOS", [
            [new Date(2026, 5, 10, 12, 0, 0), "Super", "Efectivo", 5000, "ARS", 0, "Compra supermercado", "-", true, "GAS-1"]
        ]);

        app.sendMessage("ELIMINAR CATEGORIA");
        app.sendMessage("1"); // Super
        app.sendMessage("99");

        const [errorMsg, listMsg] = app.lastMessages(2);

        expect(errorMsg).toContain("Número inválido");
        expect(listMsg).toContain('Seleccioná');

        expect(testUtils.sheetObjects(app, "SHEET_CATEGORIAS")).toHaveLength(3);

        app.sendMessage("3"); // Comida

        expect(app.lastMessage()).toContain('Categoría "Super" eliminada');

        const categorias = testUtils.sheetObjects(app, "SHEET_CATEGORIAS");

        expect(categorias.some(c => c["Categoría"] === "Super")).toBe(false);
        expect(categorias.some(c => c["Categoría"] === "Comida")).toBe(true);
    });

    test("No se puede eliminar la categoría Ajeno", () => {
        const app = createGasTestRuntime();

        testUtils.seedCategorias(app);

        app.sendMessage("ELIMINAR CATEGORIA");
        app.sendMessage("2"); // Ajeno

        expect(app.lastMessage()).toContain('La categoría "Ajeno" no se puede eliminar');

        const categorias = testUtils.sheetObjects(app, "SHEET_CATEGORIAS");

        expect(categorias.some(c => c["Categoría"] === "Ajeno")).toBe(true);
        expect(categorias).toHaveLength(3);
    });

    test("Si una categoría nunca fue usada se elimina sin pedir reemplazo", () => {
        const app = createGasTestRuntime();

        testUtils.seedCategorias(app);

        app.sendMessage("ELIMINAR CATEGORIA");
        app.sendMessage("1"); // Super, sin gastos ni ingresos

        expect(app.lastMessage()).toContain('Categoría "Super" eliminada');
        expect(app.lastMessage()).not.toContain("reemplazará");

        const categorias = testUtils.sheetObjects(app, "SHEET_CATEGORIAS");

        expect(categorias.some(c => c["Categoría"] === "Super")).toBe(false);
        expect(categorias).toHaveLength(2);
    });
});