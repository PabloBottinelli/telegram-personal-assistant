import { describe, expect, test } from "vitest";
import { createGasTestRuntime } from "../../gasTestRuntime.js";
import * as testUtils from "../../testUtils.js";

describe("RefundsTrigger", () => {
    test("si no hay gastos no manda mensaje", () => {
        const app = createGasTestRuntime();

        testUtils.runTrigger(app, "RefundsTrigger");

        expect(app.messages()).toHaveLength(0);
    });

    test("si hay gastos pero no hay reintegros pendientes manda mensaje de no pendientes", () => {
        const app = createGasTestRuntime();

        testUtils.seedGastos(app, [
            testUtils.gastoRow(app, {
                fecha: testUtils.dateNoon(),
                categoria: "Comida",
                medio: "Efectivo",
                monto: 10000,
                moneda: "ARS",
                ahorro: 0,
                detalle: "Gasto normal",
                tipo: "-",
                reintegrado: true,
                id: "GAS-1"
            })
        ]);

        testUtils.runTrigger(app, "RefundsTrigger");

        expect(app.lastMessage()).toContain("No hay reintegros pendientes");
    });

    test("Lista solo reintegros pendientes reales", () => {
        const app = createGasTestRuntime();

        testUtils.seedGastos(app, [
            testUtils.gastoRow(app, {
                fecha: testUtils.dateNoon({ daysFromToday: -2 }),
                categoria: "Comida",
                medio: "Galicia",
                monto: 10000,
                moneda: "ARS",
                ahorro: 2000,
                detalle: "Promo reintegro pendiente",
                tipo: "R",
                reintegrado: false,
                id: "GAS-1"
            }),
            testUtils.gastoRow(app, {
                fecha: testUtils.dateNoon({ daysFromToday: -2 }),
                categoria: "Comida",
                medio: "BBVA",
                monto: 10000,
                moneda: "ARS",
                ahorro: 3000,
                detalle: "Promo ya reintegrada",
                tipo: "R",
                reintegrado: true,
                id: "GAS-2"
            }),
            testUtils.gastoRow(app, {
                fecha: testUtils.dateNoon({ daysFromToday: -2 }),
                categoria: "Comida",
                medio: "Modo",
                monto: 10000,
                moneda: "ARS",
                ahorro: 1500,
                detalle: "Descuento no reintegro",
                tipo: "D",
                reintegrado: false,
                id: "GAS-3"
            })
        ]);

        testUtils.runTrigger(app, "RefundsTrigger");

        const msg = app.lastMessage();

        expect(msg).toContain("Galicia te debe");
        expect(msg).toContain("Promo reintegro pendiente");

        expect(msg).not.toContain("Promo ya reintegrada");
        expect(msg).not.toContain("Descuento no reintegro");
    });
});