import { describe, expect, test } from "vitest";
import { createGasTestRuntime } from "../gasTestRuntime.js";
import * as testUtils from "../testUtils.js";

describe("Credit Cards", () => {
    // Avisos y errores
    test("Si no hay tarjetas, muestra un mensaje de aviso", () => {
        const app = createGasTestRuntime();

        app.sendMessage("TARJETAS");

        expect(app.lastMessage()).toContain("No hay tarjetas cargadas.");
    })

    test("Si la tarjeta ya existe, no se vuelve a agregar, salta un aviso y la tarjeta permanece guardada", () => {
        const app = createGasTestRuntime();

        testUtils.seedTarjetas(app);

        app.sendMessage("NUEVA TARJETA BBVA Visa");

        expect(app.lastMessage()).toContain("Ya existe esa tarjeta.");

        app.sendMessage("Tarjetas")

        expect((app.lastMessage().match(/BBVA/g) || []).length).toBe(1)
    })

    // Funcionamiento

    test("El comando TARJETAS lista correctamente", () => {
        const app = createGasTestRuntime();

        testUtils.seedTarjetas(app);

        app.sendMessage("Tarjetas")

        expect(app.lastMessage()).toContain("BBVA")
        expect(app.lastMessage()).toContain("Galicia")
    })

    test("Se puede crear correctamente una tarjeta", () => {
        const app = createGasTestRuntime();

        app.sendMessage("NUEVA TARJETA \n BBVA Visa")

        expect(app.lastMessage()).toContain("Tarjeta agregada")

        const tarjetas = testUtils.sheetObjects(app, "SHEET_TARJETAS")

        expect(tarjetas).toHaveLength(1);

        const tarjeta = tarjetas[0]

        expect(tarjeta["Tarjeta de crédito"]).toBe("BBVA Visa")
    })

    test.todo("Se puede editar el nombre de una tarjeta y el cambio impacta correctamente en los registros donde se uso")

    test.todo("Solo se puede editar una tarjeta valida")

    test("El comando FECHAS devuelve la lista de tarjetas con sus fechas", () => {
        const app = createGasTestRuntime();

        testUtils.seedTarjetasConCierre(app);

        app.sendMessage("FECHAS")

        expect(app.lastMessage()).toContain("BBVA Visa")
        expect(app.lastMessage()).toContain("20/06")
        expect(app.lastMessage()).toContain("FUC")
        expect(app.lastMessage()).toContain("FUV")
        expect(app.lastMessage()).toContain("FPC")
        expect(app.lastMessage()).toContain("FPV")
    })

    test("Los comandos para actualizar fechas de tarjetas funcionan bien", () => {
        const app = createGasTestRuntime();

        testUtils.seedTarjetas(app)

        const mesActual = (new Date()).getMonth();
        const mesAdelantado = mesActual + 1
        const mesAtrasado = mesActual - 1
        const fechaAdelantada = `15/${String(mesAdelantado + 1).padStart(2, "0")}`;
        const fechaPasada = `15/${String(mesAtrasado + 1).padStart(2, "0")}`;

        app.sendMessage(`ULTIMO CIERRE\n${fechaPasada}`)

        app.sendMessage("1")
        expect(app.lastMessage()).toContain("Fecha actualizada")

        app.sendMessage(`ULTIMO VENCIMIENTO\n${fechaPasada}`)

        app.sendMessage("1")
        expect(app.lastMessage()).toContain("Fecha actualizada")

        app.sendMessage(`PROXIMO VENCIMIENTO\n${fechaAdelantada}`)

        app.sendMessage("1")
        expect(app.lastMessage()).toContain("Fecha actualizada")

        app.sendMessage(`PROXIMO CIERRE\n${fechaAdelantada}`)

        app.sendMessage("1")
        expect(app.lastMessage()).toContain("Fecha actualizada")

        const tarjeta = testUtils.sheetObjects(app, "SHEET_TARJETAS")[0]

        expect(tarjeta["Tarjeta de crédito"]).toBe("BBVA Visa")

        expect(tarjeta["Último cierre"]).toBeInstanceOf(Date);
        expect(tarjeta["Último cierre"].getDate()).toBe(15);
        expect(tarjeta["Último cierre"].getMonth()).toBe(mesAtrasado);
        expect(tarjeta["Último cierre"].getFullYear()).toBe(2027);
        testUtils.checkHours(tarjeta["Último cierre"])

        expect(tarjeta["Último vencimiento"]).toBeInstanceOf(Date);
        expect(tarjeta["Último vencimiento"].getDate()).toBe(15);
        expect(tarjeta["Último vencimiento"].getMonth()).toBe(mesAtrasado);
        expect(tarjeta["Último vencimiento"].getFullYear()).toBe(2027);
        testUtils.checkHours(tarjeta["Último vencimiento"])

        expect(tarjeta["Próximo Cierre"]).toBeInstanceOf(Date);
        expect(tarjeta["Próximo Cierre"].getDate()).toBe(15);
        expect(tarjeta["Próximo Cierre"].getMonth()).toBe(mesAdelantado);
        expect(tarjeta["Próximo Cierre"].getFullYear()).toBe(2026);
        testUtils.checkHours(tarjeta["Próximo Cierre"])

        expect(tarjeta["Próximo Vencimiento"]).toBeInstanceOf(Date);
        expect(tarjeta["Próximo Vencimiento"].getDate()).toBe(15);
        expect(tarjeta["Próximo Vencimiento"].getMonth()).toBe(mesAdelantado);
        expect(tarjeta["Próximo Vencimiento"].getFullYear()).toBe(2026);
        testUtils.checkHours(tarjeta["Próximo Vencimiento"])
    })

    test("Los comandos de actualizacion de fechas de tarjeta tiran error si la fecha es invalida", () => {
        const app = createGasTestRuntime();

        testUtils.seedTarjetas(app)

        app.sendMessage(`ULTIMO CIERRE\n asd`)

        expect(app.lastMessage()).toContain("Fecha inválida")
    })
});