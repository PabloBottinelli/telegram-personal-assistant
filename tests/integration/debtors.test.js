import { describe, expect, should, test } from "vitest";
import { createGasTestRuntime } from "../gasTestRuntime.js";
import * as testUtils from "../testUtils.js";

describe("Debtors", () => {
    // Avisos y errores
    test("Si no hay deudores, muestra un mensaje de aviso", () => {
        const app = createGasTestRuntime();

        app.sendMessage("DEUDORES");

        expect(app.lastMessage()).toContain("No hay deudores guardados");
    })

    test("Si el deudor ya existe, no se vuelve a agregar, salta un aviso y el deudor permanece guardada", () => {
        const app = createGasTestRuntime();

        testUtils.seedDeudores(app);

        app.sendMessage("NUEVO DEUDOR \n Juan");

        expect(app.lastMessage()).toContain("Ese item ya existe");

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

        app.sendMessage("NUEVO DEUDOR \n Juan");

        expect(app.lastMessage()).toContain("Deudor agregado")

        const deudores = testUtils.sheetObjects(app, "SHEET_DEUDORES")

        expect(deudores).toHaveLength(1);

        const deudor = deudores[0]

        expect(deudor["Nombre"]).toBe("Juan")
    })

    test("Si no hay un deudor al intentar eliminar se notifica", () => {
        const app = createGasTestRuntime();
        app.sendMessage("ELIMINAR DEUDOR");

        expect(app.lastMessage()).toContain("No hay deudores guardados");
    });

    test("Si se intenta eliminar un deudor inválido, se notifica y se permite elegir otro", () => {
        const app = createGasTestRuntime();

        testUtils.seedDeudores(app);

        app.sendMessage("ELIMINAR DEUDOR");
        app.sendMessage("3");

        const [warningMsg, listMsg] = app.lastMessages(2);
        expect(warningMsg).toBe(testUtils.getGlobal(app, "MSG_ERRORS").NUMERO_INVALIDO);
        expect(listMsg).toContain("2. Juan");

        app.sendMessage("1"); // Galicia

        expect(app.lastMessage()).toContain('Deudor "Galicia" eliminado.');

        const deudores = testUtils.sheetObjects(app, "SHEET_DEUDORES");
        expect(deudores.map(g => g["Nombre"])).toEqual(["Juan"]);
    });

    test("Se puede eliminar un deudor solo sus deudas quedan saldadas", () => {
        const app = createGasTestRuntime();

        testUtils.seedDeudores(app);

        testUtils.crearDeudaDesdeBot(app, {
            deudorIndex: "1",
            monto: "100000",
            detalle: "Prestamo Galicia 1"
        });

        testUtils.crearDeudaDesdeBot(app, {
            deudorIndex: "1",
            monto: "50000",
            detalle: "Prestamo Galicia 2"
        });

        testUtils.crearDeudaDesdeBot(app, {
            deudorIndex: "2",
            monto: "50000",
            detalle: "Prestamo Juan"
        });

        app.sendMessage("ELIMINAR DEUDOR");
        app.sendMessage("1"); // Galicia

        expect(app.lastMessage()).toContain('Deudor "Galicia" eliminado.');

        const deudores = testUtils.sheetObjects(app, "SHEET_DEUDORES");
        expect(deudores.map(g => g["Nombre"])).toEqual(["Juan"]);

        const deudas = testUtils.sheetObjects(app, "SHEET_DEUDAS");
        expect(deudas[0]["Estado"]).toBe("Saldada")
        expect(deudas[1]["Estado"]).toBe("Saldada")
        expect(deudas[2]["Estado"]).toBe("Pendiente")
        expect(deudas[0]["Monto Pendiente"]).toBe(0);
        expect(deudas[1]["Monto Pendiente"]).toBe(0);
        expect(deudas[2]["Monto Pendiente"]).toBe(50000);
    });

    test.todo("Se puede editar el nombre de un deudor y el cambio impacta correctamente en los registros donde se uso")

    test.todo("Solo se puede eliminar o editar un deudor valido")
});
