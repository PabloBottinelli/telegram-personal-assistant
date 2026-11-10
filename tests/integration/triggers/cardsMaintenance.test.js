import { describe, expect, test } from "vitest";
import { createGasTestRuntime } from "../../gasTestRuntime.js";
import * as testUtils from "../../testUtils.js";

describe("CardsMaintenanceTrigger", () => {
    test("mueve próximo cierre vencido a último cierre, limpia próximos y envía resumen", () => {
        const app = createGasTestRuntime();

        const cierrePasado = testUtils.dateNoon({ daysFromToday: -1 });
        const vencimientoPasado = testUtils.dateNoon({ daysFromToday: -1 });
        const cierreViejo = testUtils.dateNoon({ daysFromToday: -40 });
        const vencimientoViejo = testUtils.dateNoon({ daysFromToday: -30 });

        testUtils.seedTarjetas(app, [
            testUtils.tarjetaRow(app, {
                nombre: "BBVA Visa",
                ultimoCierre: cierreViejo,
                ultimoVencimiento: vencimientoViejo,
                proximoCierre: cierrePasado,
                proximoVencimiento: vencimientoPasado,
                ultimoCierreProcesado: cierreViejo,
                id: "TAR-1"
            })
        ]);

        testUtils.runTrigger(app, "CardsMaintenanceTrigger");

        const tarjeta = testUtils.sheetObjects(app, "SHEET_TARJETAS")[0];

        expect(tarjeta["Tarjeta de crédito"]).toBe("BBVA Visa");
        expect(tarjeta["Último cierre"]).toEqual(cierrePasado);
        expect(tarjeta["Último vencimiento"]).toEqual(vencimientoPasado);
        expect(tarjeta["Próximo Cierre"]).toBe("");
        expect(tarjeta["Próximo Vencimiento"]).toBe("");
        expect(tarjeta["Último Cierre Procesado"]).toEqual(cierreViejo);
        expect(tarjeta["ID"]).toBe("TAR-1");

        expect(app.lastMessage()).toContain("Resumen BBVA Visa");
        expect(app.lastMessage()).toContain("No hay gastos para esta tarjeta.");
    });

    test("No mueve tarjeta si próximo cierre es hoy o futuro", () => {
        const app = createGasTestRuntime();

        const hoy = testUtils.dateNoon();
        const en10Dias = testUtils.dateNoon({ daysFromToday: 10 });
        const cierreViejo = testUtils.dateNoon({ daysFromToday: -40 });
        const vencimientoViejo = testUtils.dateNoon({ daysFromToday: -30 });

        testUtils.seedTarjetas(app, [
            testUtils.tarjetaRow(app, {
                nombre: "BBVA Visa",
                ultimoCierre: cierreViejo,
                ultimoVencimiento: vencimientoViejo,
                proximoCierre: hoy,
                proximoVencimiento: en10Dias,
                id: "TAR-1"
            })
        ]);

        testUtils.runTrigger(app, "CardsMaintenanceTrigger");

        const tarjeta = testUtils.sheetObjects(app, "SHEET_TARJETAS")[0];

        expect(tarjeta["Último cierre"]).toEqual(cierreViejo);
        expect(tarjeta["Último vencimiento"]).toEqual(vencimientoViejo);
        expect(tarjeta["Próximo Cierre"]).toEqual(hoy);
        expect(tarjeta["Próximo Vencimiento"]).toEqual(en10Dias);

        expect(app.messages()).toHaveLength(0);
    });
});