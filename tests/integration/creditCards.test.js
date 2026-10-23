import { afterEach, describe, expect, test, vi } from "vitest";
import { createGasTestRuntime } from "../gasTestRuntime.js";
import * as testUtils from "../testUtils.js";

describe("Credit Cards", () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    // Avisos y errores
    test("Si no hay tarjetas, muestra un mensaje de aviso", () => {
        const app = createGasTestRuntime();

        app.sendMessage("TARJETAS");

        expect(app.lastMessage()).toContain("No hay tarjetas guardadas");
    })

    test("Si la tarjeta ya existe, no se vuelve a agregar, salta un aviso y la tarjeta permanece guardada", () => {
        const app = createGasTestRuntime();

        testUtils.seedTarjetas(app);

        app.sendMessage("NUEVA TARJETA \n BBVA Visa");

        expect(app.lastMessage()).toContain("Ese item ya existe");

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
        vi.useFakeTimers({ toFake: ["Date"] });
        vi.setSystemTime(new Date(2026, 9, 23, 12));

        const app = createGasTestRuntime();

        testUtils.seedTarjetas(app)

        const mesAdelantado = 10; 
        const mesAtrasado = 8; 
        const fechaAdelantada = "15/11";
        const fechaPasada = "15/09";

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
        expect(tarjeta["Último cierre"].getFullYear()).toBe(2026);
        testUtils.checkHours(tarjeta["Último cierre"])

        expect(tarjeta["Último vencimiento"]).toBeInstanceOf(Date);
        expect(tarjeta["Último vencimiento"].getDate()).toBe(15);
        expect(tarjeta["Último vencimiento"].getMonth()).toBe(mesAtrasado);
        expect(tarjeta["Último vencimiento"].getFullYear()).toBe(2026);
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

    test.each([
        {
            caso: "un mes pasado",
            hoy: new Date(2026, 9, 23, 12),
            entrada: "15/09",
            anterior: new Date(2026, 8, 15, 12),
            proxima: new Date(2027, 8, 15, 12)
        },
        {
            caso: "un mes futuro",
            hoy: new Date(2026, 9, 23, 12),
            entrada: "15/11",
            anterior: new Date(2025, 10, 15, 12),
            proxima: new Date(2026, 10, 15, 12)
        },
        {
            caso: "un día pasado del mismo mes",
            hoy: new Date(2026, 9, 23, 12),
            entrada: "22/10",
            anterior: new Date(2026, 9, 22, 12),
            proxima: new Date(2027, 9, 22, 12)
        },
        {
            caso: "un día futuro del mismo mes",
            hoy: new Date(2026, 9, 23, 12),
            entrada: "24/10",
            anterior: new Date(2025, 9, 24, 12),
            proxima: new Date(2026, 9, 24, 12)
        },
        {
            caso: "diciembre desde enero",
            hoy: new Date(2027, 0, 10, 12),
            entrada: "15/12",
            anterior: new Date(2026, 11, 15, 12),
            proxima: new Date(2027, 11, 15, 12)
        },
        {
            caso: "enero desde diciembre",
            hoy: new Date(2026, 11, 23, 12),
            entrada: "15/01",
            anterior: new Date(2026, 0, 15, 12),
            proxima: new Date(2027, 0, 15, 12)
        },
        {
            caso: "hoy antes del mediodía",
            hoy: new Date(2026, 9, 23, 9),
            entrada: "23/10",
            anterior: new Date(2026, 9, 23, 12),
            proxima: new Date(2026, 9, 23, 12)
        },
        {
            caso: "hoy después del mediodía",
            hoy: new Date(2026, 9, 23, 18),
            entrada: "23/10",
            anterior: new Date(2026, 9, 23, 12),
            proxima: new Date(2026, 9, 23, 12)
        }
    ])("Distingue últimos y próximos para $caso", ({ hoy, entrada, anterior, proxima }) => {
        vi.useFakeTimers({ toFake: ["Date"] });
        vi.setSystemTime(hoy);

        const app = createGasTestRuntime();
        testUtils.seedTarjetas(app);

        const campos = [
            ["ULTIMO CIERRE", "Último cierre", anterior],
            ["ULTIMO VENCIMIENTO", "Último vencimiento", anterior],
            ["PROXIMO CIERRE", "Próximo Cierre", proxima],
            ["PROXIMO VENCIMIENTO", "Próximo Vencimiento", proxima]
        ];

        for (const [comando] of campos) {
            app.sendMessage(`${comando}\n${entrada}`);
            expect(app.lastMessage()).toContain(testUtils.TARJETA_LISTA_HEADER);

            app.sendMessage("1");
            expect(app.lastMessage()).toContain("Fecha actualizada");
        }

        const tarjeta = testUtils.sheetObjects(app, "SHEET_TARJETAS")[0];
        expect(tarjeta["Tarjeta de crédito"]).toBe("BBVA Visa");

        for (const [, header, esperada] of campos) {
            testUtils.expectSameDay(tarjeta[header], esperada);
            testUtils.checkHours(tarjeta[header]);
        }
    });

    test("Los comandos de actualizacion de fechas de tarjeta tiran error si la fecha es invalida", () => {
        const app = createGasTestRuntime();

        testUtils.seedTarjetas(app)

        app.sendMessage(`ULTIMO CIERRE\n asd`)

        expect(app.lastMessage()).toContain("Fecha inválida")
    })
});
