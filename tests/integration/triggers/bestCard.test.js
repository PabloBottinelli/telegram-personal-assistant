import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createGasTestRuntime } from "../../gasTestRuntime.js";
import * as testUtils from "../../testUtils.js";


describe("BestCardTrigger", () => {
    beforeEach(() => {
        vi.useFakeTimers({ toFake: ["Date"] });
        vi.setSystemTime(new Date(2026, 5, 15, 12, 0, 0));
    });

    afterEach(() => {
        vi.useRealTimers();
    });
    
    test("Si no hay tarjetas avisa que no hay tarjetas", () => {
        const app = createGasTestRuntime();

        testUtils.runTrigger(app, "BestCardTrigger");

        expect(app.lastMessage()).toContain("Mejor tarjeta: (no hay tarjetas)");
    });

    test("Elige la tarjeta elegible con vencimiento más lejano", () => {
        const app = createGasTestRuntime();

        const ayer = testUtils.dateNoon({ daysFromToday: -1 });
        const mañana = testUtils.dateNoon({ daysFromToday: 1 });
        const en10Dias = testUtils.dateNoon({ daysFromToday: 10 });
        const en20Dias = testUtils.dateNoon({ daysFromToday: 20 });

        testUtils.seedTarjetas(app, [
            testUtils.tarjetaRow(app, {
                nombre: "BBVA Visa",
                ultimoCierre: ayer,
                ultimoVencimiento: mañana,
                proximoCierre: en10Dias,
                proximoVencimiento: en10Dias,
                id: "TAR-1"
            }),
            testUtils.tarjetaRow(app, {
                nombre: "Galicia Mastercard",
                ultimoCierre: ayer,
                ultimoVencimiento: mañana,
                proximoCierre: en20Dias,
                proximoVencimiento: en20Dias,
                id: "TAR-2"
            })
        ]);

        testUtils.runTrigger(app, "BestCardTrigger");

        expect(app.lastMessage()).toContain("Mejor tarjeta: Galicia Mastercard");
    });

    test("Avisa tarjetas con información incompleta", () => {
        const app = createGasTestRuntime();

        const ayer = testUtils.dateNoon({ daysFromToday: -1 });
        const en10Dias = testUtils.dateNoon({ daysFromToday: 10 });

        testUtils.seedTarjetas(app, [
            testUtils.tarjetaRow(app, {
                nombre: "BBVA Visa",
                ultimoCierre: ayer,
                ultimoVencimiento: en10Dias,
                proximoCierre: en10Dias,
                proximoVencimiento: en10Dias,
                id: "TAR-1"
            }),
            testUtils.tarjetaRow(app, {
                nombre: "Tarjeta incompleta",
                ultimoCierre: ayer,
                ultimoVencimiento: "",
                proximoCierre: "",
                proximoVencimiento: en10Dias,
                id: "TAR-2"
            })
        ]);

        testUtils.runTrigger(app, "BestCardTrigger");

        const msg = app.lastMessage();

        expect(msg).toContain("Mejor tarjeta: BBVA Visa");
        expect(msg).toContain("Falta actualizar información de la tarjeta: Tarjeta incompleta");
    });

    test("Si ninguna tarjeta es elegible avisa que no hay tarjeta elegible", () => {
        const app = createGasTestRuntime();

        const manana = testUtils.dateNoon({ daysFromToday: 1 });
        const en10Dias = testUtils.dateNoon({ daysFromToday: 10 });

        testUtils.seedTarjetas(app, [
            testUtils.tarjetaRow(app, {
                nombre: "BBVA Visa",
                ultimoCierre: manana,
                ultimoVencimiento: en10Dias,
                proximoCierre: en10Dias,
                proximoVencimiento: en10Dias,
                id: "TAR-1"
            })
        ]);

        testUtils.runTrigger(app, "BestCardTrigger");

        expect(app.lastMessage()).toContain("Mejor tarjeta: (sin tarjeta elegible hoy)");
    });
});