import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createGasTestRuntime } from "../gasTestRuntime.js";
import * as testUtils from "../testUtils.js";

describe("Totals", () => {
    beforeEach(() => {
        vi.useFakeTimers({ toFake: ["Date"] });
        vi.setSystemTime(new Date(2026, 9, 23, 12));
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    describe("Año opcional", () => {
        function seedHistory(app) {
            const incomeConfig = testUtils.getGlobal(app, "SHEET_INGRESOS");
            for (const [year, expense, income] of [[2025, 100, 500], [2026, 200, 1000]]) {
                for (const [currency, expenseAmount, incomeAmount] of [
                    ["ARS", expense, income], ["USD", expense / 10, income / 10], ["USDT", 5, 25]
                ]) {
                    const fecha = new Date(year, 5, 10, 12);
                    testUtils.seedGastos(app, [testUtils.gastoRow(app, {
                        fecha, monto: expenseAmount, moneda: currency,
                        ahorro: currency === "ARS" ? 20 : 0,
                        id: `GAS-${year}-${currency}`
                    })]);
                    app.appendRows(incomeConfig.name, [testUtils.rowFromObject(incomeConfig.headers, {
                        Fecha: fecha, Monto: incomeAmount, Moneda: currency,
                        Categoría: "Sueldo", Descripción: "Ingreso de prueba", ID: `ING-${year}-${currency}`
                    })]);
                }
            }
            testUtils.seedGastos(app, [testUtils.gastoRow(app, {
                fecha: new Date(2025, 4, 10, 12), monto: 9999, id: "GAS-OTRO-MES"
            })]);
            app.appendRows(incomeConfig.name, [testUtils.rowFromObject(incomeConfig.headers, {
                Fecha: new Date(2025, 4, 10, 12), Monto: 9999, Moneda: "ARS", ID: "ING-OTRO-MES"
            })]);
        }

        test.each(["TOTALES\nJunio", "TOTALES\n6", "TOTALES, 6"])(
            "%j permite consultar años distintos sin mezclar movimientos", prefix => {
                const app = createGasTestRuntime();
                seedHistory(app);
                const separator = prefix.includes(",") ? ", " : "\n";

                for (const [year, expenseARS, expenseUSD, incomeARS, incomeUSD] of [
                    [2025, "80,00", "15,00", "500,00", "75,00"],
                    [2026, "180,00", "25,00", "1.000,00", "125,00"]
                ]) {
                    app.sendMessage(`${prefix}${separator}${year}`);
                    expect(app.lastMessage()).toBe(
                        `Totales de Junio de ${year}:\n` +
                        `Gastos del mes en pesos: $${expenseARS}\n` +
                        `Gastos del mes en USD: ${expenseUSD} USD\n` +
                        `Ingresos del mes en pesos: $${incomeARS}\n` +
                        `Ingresos del mes en USD: ${incomeUSD} USD`
                    );
                }
            }
        );

        test.each([undefined, "-"])("el año %j usa el actual y excluye el anterior", year => {
            const app = createGasTestRuntime();
            seedHistory(app);
            app.sendMessage(["TOTALES", "Junio", year].filter(value => value !== undefined).join("\n"));
            expect(app.lastMessage()).toContain("Totales de Junio de 2026:");
            expect(app.lastMessage()).toContain("Gastos del mes en pesos: $180,00");
            expect(app.lastMessage()).toContain("Ingresos del mes en pesos: $1.000,00");
        });

        test("un año sin movimientos devuelve cero aunque existan datos en otros años", () => {
            const app = createGasTestRuntime();
            seedHistory(app);
            app.sendMessage("TOTALES\nJunio\n2024");
            expect(app.lastMessage()).toBe(
                "Totales de Junio de 2024:\n" +
                "Gastos del mes en pesos: $0,00\n" +
                "Gastos del mes en USD: 0,00 USD\n" +
                "Ingresos del mes en pesos: $0,00\n" +
                "Ingresos del mes en USD: 0,00 USD"
            );
        });

        test.each(["2025abc", "2025.5", "2025,5", "25", "10000", "0000", "0", "-2025", "2e03"])(
            "rechaza el año %j sin consultar los movimientos", year => {
                const app = createGasTestRuntime();
                const getTotals = vi.spyOn(testUtils.getGlobal(app, "TotalsService"), "getMonthlyTotals");
                app.sendMessage(`TOTALES\nJunio\n${year}`);
                expect(app.lastMessage()).toBe(testUtils.getGlobal(app, "MSG_ERRORS").INVALID_YEAR);
                expect(getTotals).not.toHaveBeenCalled();
            }
        );

        test("un mes inválido con año explícito informa el error de mes", () => {
            const app = createGasTestRuntime();
            const getTotals = vi.spyOn(testUtils.getGlobal(app, "TotalsService"), "getMonthlyTotals");
            app.sendMessage("TOTALES\n13\n2025");
            expect(app.lastMessage()).toBe(testUtils.getGlobal(app, "MSG_ERRORS").INVALID_MONTH);
            expect(getTotals).not.toHaveBeenCalled();
        });

        test.each(["TOTALES", "TOTALES\nJunio\n2025\nextra"])(
            "rechaza la cantidad de campos de %j y muestra la ayuda del año", message => {
                const app = createGasTestRuntime();
                app.sendMessage(message);
                expect(app.lastMessage()).toContain("El formato es incorrecto.");
                expect(app.lastMessage()).toContain("Año (opcional, 4 cifras o - para el actual");
            }
        );
    });
});