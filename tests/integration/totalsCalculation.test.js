import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createGasTestRuntime } from "../gasTestRuntime.js";
import * as testUtils from "../testUtils.js";

describe("Totals - Calculation", () => {
    beforeEach(() => {
        vi.useFakeTimers({ toFake: ["Date"] });
        vi.setSystemTime(new Date(2026, 9, 23, 12));
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    test("Calcula gastos e ingresos del mes pedido en ARS y USD", () => {
        const app = createGasTestRuntime();

        testUtils.seedCategorias(app)

        testUtils.crearGastoDesdeBot(app, {
            catIndex: "1",
            fecha: "10/06",
            monto: "10000",
            moneda: "ARS",
            detalle: "Gasto ARS junio"
        });

        testUtils.crearGastoDesdeBot(app, {
            catIndex: "1",
            fecha: "11/06",
            monto: "50",
            moneda: "USD",
            detalle: "Gasto USD junio"
        });

        testUtils.crearIngresoDesdeBot(app, {
            catIndex: "1",
            fecha: "10/06",
            monto: "100000",
            moneda: "ARS",
            detalle: "Ingreso ARS junio"
        });

        testUtils.crearIngresoDesdeBot(app, {
            catIndex: "1",
            fecha: "11/06",
            monto: "200",
            moneda: "USD",
            detalle: "Ingreso USD junio"
        });

        app.sendMessage([
            "TOTALES",
            "Junio"
        ].join("\n"));

        const msg = app.lastMessage();

        expect(msg).toContain("Totales de Junio de 2026:");
        expect(msg).toContain("Gastos del mes en pesos: $10.000,00");
        expect(msg).toContain("Gastos del mes en USD: 50,00 USD");
        expect(msg).toContain("Ingresos del mes en pesos: $100.000,00");
        expect(msg).toContain("Ingresos del mes en USD: 200,00 USD");
    });

    test("Gastos e ingresos de otro mes no entran en el cálculo", () => {
        const app = createGasTestRuntime();

        testUtils.seedCategorias(app)

        testUtils.crearGastoDesdeBot(app, {
            catIndex: "1",
            fecha: "10/06",
            monto: "10000",
            moneda: "ARS",
            detalle: "Gasto junio"
        });

        testUtils.crearGastoDesdeBot(app, {
            catIndex: "1",
            fecha: "10/07",
            monto: "99999",
            moneda: "ARS",
            detalle: "Gasto julio no entra"
        });

        testUtils.crearIngresoDesdeBot(app, {
            catIndex: "1",
            fecha: "10/06",
            monto: "100000",
            moneda: "ARS",
            detalle: "Ingreso junio"
        });

        testUtils.crearIngresoDesdeBot(app, {
            catIndex: "1",
            fecha: "10/07",
            monto: "999999",
            moneda: "ARS",
            detalle: "Ingreso julio no entra"
        });

        app.sendMessage([
            "TOTALES",
            "Junio"
        ].join("\n"));

        const msg = app.lastMessage();

        expect(msg).toContain("Gastos del mes en pesos: $10.000,00");
        expect(msg).toContain("Ingresos del mes en pesos: $100.000,00");

        expect(msg).not.toContain("99999");
        expect(msg).not.toContain("999999");
    });

    test("Gastos con ahorro se calculan como monto menos ahorro", () => {
        const app = createGasTestRuntime();

        testUtils.seedCategorias(app)

        testUtils.crearGastoDesdeBot(app, {
            catIndex: "1",
            fecha: "10/06",
            monto: "10000",
            moneda: "ARS",
            ahorro: "2000",
            detalle: "Gasto con ahorro",
            tipo: "D",
            reintegrado: "Sí"
        });

        testUtils.crearGastoDesdeBot(app, {
            catIndex: "1",
            fecha: "11/06",
            monto: "50",
            moneda: "USD",
            ahorro: "10",
            detalle: "Gasto USD con ahorro",
            tipo: "D",
            reintegrado: "Sí"
        });

        app.sendMessage([
            "TOTALES",
            "Junio"
        ].join("\n"));

        const msg = app.lastMessage();

        expect(msg).toContain("Gastos del mes en pesos: $8.000,00");
        expect(msg).toContain("Gastos del mes en USD: 40,00 USD");
    });

    test("Gastos ajenos no entran en el cálculo de totales", () => {
        const app = createGasTestRuntime();

        testUtils.seedCategorias(app);
        testUtils.seedDeudores(app);

        testUtils.crearGastoDesdeBot(app, {
            catIndex: "1",
            fecha: "10/06",
            monto: "10000",
            moneda: "ARS",
            detalle: "Gasto propio"
        });

        testUtils.crearGastoDesdeBot(app, {
            ajeno: true,
            catIndex: "2",
            fecha: "11/06",
            monto: "50000",
            moneda: "ARS",
            detalle: "Gasto ajeno no entra"
        });

        app.sendMessage([
            "TOTALES",
            "Junio"
        ].join("\n"));

        const msg = app.lastMessage();

        expect(msg).toContain("Gastos del mes en pesos: $10.000,00");
        expect(msg).not.toContain("$60.000,00");
        expect(msg).not.toContain("$50.000,00");
    });

    test("Gastos TC se computan como gastos comunes usando medio de pago tarjeta", () => {
        const app = createGasTestRuntime();

        testUtils.seedCategorias(app);
        testUtils.seedTarjetas(app);

        testUtils.crearGastoConTarjetaDesdeBot(app, {
            catIndex: "1",
            medioIndex: "1",
            fecha: "10/06",
            monto: "12000",
            moneda: "ARS",
            cuotas: "1",
            detalle: "Compra TC"
        });

        testUtils.crearGastoDesdeBot(app, {
            catIndex: "3",
            fecha: "11/06",
            monto: "3000",
            moneda: "ARS",
            medio: "Efectivo",
            detalle: "Compra efectivo"
        });

        app.sendMessage([
            "TOTALES",
            "Junio"
        ].join("\n"));

        const msg = app.lastMessage();

        expect(msg).toContain("Gastos del mes en pesos: $15.000,00");
    });

    test("USDT se suma dentro del total USD", () => {
        const app = createGasTestRuntime();

        testUtils.seedCategorias(app);

        testUtils.crearGastoDesdeBot(app, {
            catIndex: "1",
            fecha: "10/06",
            monto: "50",
            moneda: "USD",
            detalle: "Gasto USD"
        });

        testUtils.crearGastoDesdeBot(app, {
            catIndex: "1",
            fecha: "11/06",
            monto: "25",
            moneda: "USDT",
            detalle: "Gasto USDT"
        });

        testUtils.crearIngresoDesdeBot(app, {
            catIndex: "1",
            fecha: "10/06",
            monto: "100",
            moneda: "USD",
            detalle: "Ingreso USD"
        });

        testUtils.crearIngresoDesdeBot(app, {
            catIndex: "1",
            fecha: "11/06",
            monto: "50",
            moneda: "USDT",
            detalle: "Ingreso USDT"
        });


        app.sendMessage([
            "TOTALES",
            "Junio"
        ].join("\n"));

        const msg = app.lastMessage();

        expect(msg).toContain("Gastos del mes en USD: 75,00 USD");
        expect(msg).toContain("Ingresos del mes en USD: 150,00 USD");
    });
});