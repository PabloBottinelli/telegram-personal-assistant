import { describe, expect, test, vi } from "vitest";
import { createGasTestRuntime } from "../../gasTestRuntime.js";
import * as testUtils from "../../testUtils.js";

describe("ExpirationsAlertTrigger", () => {
    test("avisa vencimientos dentro de los próximos 3 días", () => {
        const app = createGasTestRuntime();

        const cierrePasado = testUtils.dateNoon({ daysFromToday: -10 });
        const venceEn3Dias = testUtils.dateNoon({ daysFromToday: 3 });

        testUtils.seedTarjetas(app, [
            testUtils.tarjetaRow(app, {
                nombre: "BBVA Visa",
                ultimoCierre: cierrePasado,
                ultimoVencimiento: "",
                proximoCierre: "",
                proximoVencimiento: venceEn3Dias,
                id: "TAR-1"
            })
        ]);

        testUtils.runTrigger(app, "ExpirationsAlertTrigger");

        const msg = app.lastMessage();

        expect(msg).toContain("⏰ Vencimientos próximos");
        expect(msg).toContain("BBVA Visa: vence el");
        expect(msg).toContain("Acordate de pagar los consumos en USD por adelantado");
    });

    test("Si el vencimiento es hoy avisa, actualiza cuotas y descuenta una cuota", () => {
        const app = createGasTestRuntime();

        const cierrePasado = testUtils.dateNoon({ daysFromToday: -1 });
        const venceHoy = testUtils.dateNoon();

        testUtils.seedTarjetas(app, [
            testUtils.tarjetaRow(app, {
                nombre: "BBVA Visa",
                ultimoCierre: cierrePasado,
                ultimoVencimiento: venceHoy,
                proximoCierre: "",
                proximoVencimiento: "",
                id: "TAR-1"
            })
        ]);

        testUtils.seedCardDebts(app, [
            testUtils.cardDebtRow(app, {
                fecha: testUtils.dateNoon({ daysFromToday: -5 }),
                medio: "BBVA Visa",
                moneda: "ARS",
                monto: 12000,
                cuotas: 3,
                cuotasRestantes: 3,
                detalle: "Compra antes del cierre",
                id: "DT-1",
                gastoId: "GAS-1"
            }),
            testUtils.cardDebtRow(app, {
                fecha: testUtils.dateNoon(),
                medio: "BBVA Visa",
                moneda: "ARS",
                monto: 99999,
                cuotas: 1,
                cuotasRestantes: 1,
                detalle: "Compra posterior al cierre no se actualiza",
                id: "DT-2",
                gastoId: "GAS-2"
            })
        ]);

        testUtils.runTrigger(app, "ExpirationsAlertTrigger");

        const msg = app.lastMessage();

        expect(msg).toContain("BBVA Visa: vence hoy!");
        expect(msg).toContain("BBVA Visa: se actualizaron las cuotas");

        const cuotas = testUtils.sheetObjects(app, "SHEET_CUOTAS");

        const cuotaActualizada = cuotas.find(c => c["ID"] === "DT-1");
        const cuotaNoActualizada = cuotas.find(c => c["ID"] === "DT-2");

        expect(cuotaActualizada["#CuotasRestantes"]).toBe(2);
        expect(cuotaNoActualizada["#CuotasRestantes"]).toBe(1);
        expect(testUtils.sheetObjects(app, "SHEET_TARJETAS")[0]["Último Cierre Procesado"])
            .toEqual(cierrePasado);
    });

    test("repetir cada vencimiento descuenta una sola cuota y el ciclo siguiente descuenta otra", () => {
        vi.useFakeTimers({ toFake: ["Date"] });

        try {
            vi.setSystemTime(new Date(2026, 9, 5, 12));
            const app = createGasTestRuntime();
            const primerCierre = new Date(2026, 8, 24, 12);
            const segundoCierre = new Date(2026, 9, 24, 12);

            testUtils.seedTarjetas(app, [testUtils.tarjetaRow(app, {
                ultimoCierre: primerCierre,
                ultimoVencimiento: new Date(2026, 9, 5, 12),
                proximoCierre: segundoCierre,
                proximoVencimiento: new Date(2026, 10, 5, 12),
                id: "TAR-1"
            })]);
            testUtils.seedCardDebts(app, [testUtils.cardDebtRow(app, {
                fecha: new Date(2026, 8, 8, 12),
                cuotas: 6,
                cuotasRestantes: 6,
                id: "DT-1"
            })]);

            for (let intento = 0; intento < 2; intento++) {
                testUtils.runTrigger(app, "ExpirationsAlertTrigger");
                expect(testUtils.sheetObjects(app, "SHEET_CUOTAS")[0]["#CuotasRestantes"]).toBe(5);
                expect(testUtils.sheetObjects(app, "SHEET_TARJETAS")[0]["Último Cierre Procesado"]).toEqual(primerCierre);
                expect(app.lastMessage()).toContain("BBVA Visa: vence hoy!");
                expect(app.lastMessage().includes("se actualizaron las cuotas")).toBe(intento === 0);
            }

            vi.setSystemTime(new Date(2026, 9, 25, 12));
            testUtils.runTrigger(app, "CardsMaintenanceTrigger");
            expect(testUtils.sheetObjects(app, "SHEET_TARJETAS")[0]["Último Cierre Procesado"]).toEqual(primerCierre);
            expect(testUtils.sheetObjects(app, "SHEET_CUOTAS")[0]["#CuotasRestantes"]).toBe(5);

            vi.setSystemTime(new Date(2026, 10, 5, 12));
            for (let intento = 0; intento < 2; intento++) {
                testUtils.runTrigger(app, "ExpirationsAlertTrigger");
                expect(testUtils.sheetObjects(app, "SHEET_CUOTAS")[0]["#CuotasRestantes"]).toBe(4);
                expect(testUtils.sheetObjects(app, "SHEET_TARJETAS")[0]["Último Cierre Procesado"]).toEqual(segundoCierre);
                expect(app.lastMessage().includes("se actualizaron las cuotas")).toBe(intento === 0);
            }
        } finally {
            vi.useRealTimers();
        }
    });

    test("usa próximo cierre si el vencimiento de hoy corresponde al próximo ciclo", () => {
        const app = createGasTestRuntime();
        const cierre = testUtils.dateNoon({ daysFromToday: -10 });
        testUtils.seedTarjetas(app, [
            testUtils.tarjetaRow(app, {
                nombre: "Galicia Mastercard",
                id: "TAR-2"
            }),
            testUtils.tarjetaRow(app, {
                ultimoCierre: testUtils.dateNoon({ daysFromToday: -40 }),
                ultimoVencimiento: testUtils.dateNoon({ daysFromToday: -30 }),
                proximoCierre: cierre,
                proximoVencimiento: testUtils.dateNoon(),
                id: "TAR-1"
            })
        ]);
        testUtils.seedCardDebts(app, [
            testUtils.cardDebtRow(app, {
                fecha: testUtils.dateNoon({ daysFromToday: -15 }),
                id: "DT-1"
            }),
            testUtils.cardDebtRow(app, {
                fecha: testUtils.dateNoon({ daysFromToday: -5 }),
                id: "DT-2"
            })
        ]);

        testUtils.runTrigger(app, "ExpirationsAlertTrigger");

        expect(testUtils.sheetObjects(app, "SHEET_CUOTAS").map(row => row["#CuotasRestantes"])).toEqual([2, 3]);
        expect(testUtils.sheetObjects(app, "SHEET_TARJETAS").map(row => row["Último Cierre Procesado"])).toEqual(["", cierre]);
        expect(app.lastMessage()).toContain("se actualizaron las cuotas");
    });

    test.each([0, 30])("no reprocesa un cierre si el marcador es del mismo día o posterior (%i días)", dias => {
        const app = createGasTestRuntime();
        const cierre = testUtils.dateNoon({ daysFromToday: -10 });
        const procesado = testUtils.dateNoon({ daysFromToday: -10 + dias });
        procesado.setHours(0);
        testUtils.seedTarjetas(app, [testUtils.tarjetaRow(app, {
            ultimoCierre: cierre,
            ultimoVencimiento: testUtils.dateNoon(),
            ultimoCierreProcesado: procesado
        })]);
        testUtils.seedCardDebts(app, [testUtils.cardDebtRow(app, {
            fecha: testUtils.dateNoon({ daysFromToday: -15 })
        })]);

        testUtils.runTrigger(app, "ExpirationsAlertTrigger");

        expect(testUtils.sheetObjects(app, "SHEET_CUOTAS")[0]["#CuotasRestantes"]).toBe(3);
        expect(testUtils.sheetObjects(app, "SHEET_TARJETAS")[0]["Último Cierre Procesado"]).toEqual(procesado);
        expect(app.lastMessage()).toContain("vence hoy!");
        expect(app.lastMessage()).not.toContain("se actualizaron las cuotas");
    });

    test("registra el ciclo sin consumos pendientes y no anuncia una actualización", () => {
        const app = createGasTestRuntime();
        const cierre = testUtils.dateNoon({ daysFromToday: -10 });
        testUtils.seedTarjetas(app, [testUtils.tarjetaRow(app, {
            ultimoCierre: cierre,
            ultimoVencimiento: testUtils.dateNoon()
        })]);
        testUtils.seedCardDebts(app, [
            testUtils.cardDebtRow(app, {
                fecha: testUtils.dateNoon({ daysFromToday: -15 }),
                cuotasRestantes: 0,
                id: "DT-1"
            }),
            testUtils.cardDebtRow(app, {
                fecha: testUtils.dateNoon({ daysFromToday: -15 }),
                medio: "Galicia Mastercard",
                id: "DT-2"
            })
        ]);

        testUtils.runTrigger(app, "ExpirationsAlertTrigger");

        expect(testUtils.sheetObjects(app, "SHEET_CUOTAS").map(row => row["#CuotasRestantes"])).toEqual([0, 3]);
        expect(testUtils.sheetObjects(app, "SHEET_TARJETAS")[0]["Último Cierre Procesado"]).toEqual(cierre);
        expect(app.lastMessage()).not.toContain("se actualizaron las cuotas");
    });

    test("no descuenta ni registra un ciclo si falta su cierre", () => {
        const app = createGasTestRuntime();
        testUtils.seedTarjetas(app, [testUtils.tarjetaRow(app, {
            ultimoVencimiento: testUtils.dateNoon()
        })]);
        testUtils.seedCardDebts(app, [testUtils.cardDebtRow(app, {
            fecha: testUtils.dateNoon({ daysFromToday: -15 })
        })]);

        testUtils.runTrigger(app, "ExpirationsAlertTrigger");

        expect(testUtils.sheetObjects(app, "SHEET_CUOTAS")[0]["#CuotasRestantes"]).toBe(3);
        expect(testUtils.sheetObjects(app, "SHEET_TARJETAS")[0]["Último Cierre Procesado"]).toBe("");
        expect(app.lastMessage()).not.toContain("se actualizaron las cuotas");
    });

    test("propaga el error y no marca el ciclo si falla a mitad de los consumos", () => {
        const app = createGasTestRuntime();
        testUtils.seedTarjetas(app, [testUtils.tarjetaRow(app, {
            ultimoCierre: testUtils.dateNoon({ daysFromToday: -10 }),
            ultimoVencimiento: testUtils.dateNoon()
        })]);
        testUtils.seedCardDebts(app, ["DT-1", "DT-2"].map(id =>
            testUtils.cardDebtRow(app, {
                fecha: testUtils.dateNoon({ daysFromToday: -15 }),
                id
            })
        ));
        const repository = testUtils.getGlobal(app, "CreditCardExpenseRepository");
        const update = repository.updateRemainingInstallments.bind(repository);
        const spy = vi.spyOn(repository, "updateRemainingInstallments")
            .mockImplementationOnce(update)
            .mockReturnValueOnce(false);

        try {
            expect(() => testUtils.runTrigger(app, "ExpirationsAlertTrigger")).toThrow("No se pudo actualizar el consumo DT-2");
            expect(testUtils.sheetObjects(app, "SHEET_CUOTAS").map(row => row["#CuotasRestantes"])).toEqual([2, 3]);
            expect(testUtils.sheetObjects(app, "SHEET_TARJETAS")[0]["Último Cierre Procesado"]).toBe("");
            expect(app.messages()).toHaveLength(0);
        } finally {
            spy.mockRestore();
        }
    });

    test("no avisa si no hay vencimientos próximos", () => {
        const app = createGasTestRuntime();

        const cierrePasado = testUtils.dateNoon({ daysFromToday: -10 });
        const venceEn10Dias = testUtils.dateNoon({ daysFromToday: 10 });

        testUtils.seedTarjetas(app, [
            testUtils.tarjetaRow(app, {
                nombre: "BBVA Visa",
                ultimoCierre: cierrePasado,
                ultimoVencimiento: "",
                proximoCierre: "",
                proximoVencimiento: venceEn10Dias,
                id: "TAR-1"
            })
        ]);

        testUtils.runTrigger(app, "ExpirationsAlertTrigger");

        expect(app.messages()).toHaveLength(0);
    });

    test("cuando llega el vencimiento, descuenta exactamente una cuota", () => {
        const app = createGasTestRuntime();

        const cierrePasado = testUtils.dateNoon({ daysFromToday: -10 });
        const venceHoy = testUtils.dateNoon();

        testUtils.seedTarjetas(app, [
            testUtils.tarjetaRow(app, {
                nombre: "BBVA Visa",
                ultimoCierre: cierrePasado,
                ultimoVencimiento: venceHoy,
                proximoCierre: "",
                proximoVencimiento: "",
                id: "TAR-1"
            })
        ]);

        testUtils.seedCardDebts(app, [
            testUtils.cardDebtRow(app, {
                fecha: testUtils.dateNoon({ daysFromToday: -15 }),
                medio: "BBVA Visa",
                cuotas: 3,
                cuotasRestantes: 3,
                id: "DT-1",
                gastoId: "GAS-1"
            })
        ]);

        testUtils.runTrigger(app, "ExpirationsAlertTrigger");

        const cuota = testUtils.sheetObjects(app, "SHEET_CUOTAS")[0];

        expect(cuota["#CuotasRestantes"]).toBe(2);
    });


    test("una compra en cuotas conserva la misma cantidad de cuotas restantes después del cierre si aún no venció", () => {
        const app = createGasTestRuntime();

        const cierreAyer = testUtils.dateNoon({ daysFromToday: -1 });
        const vencimientoEn10Dias = testUtils.dateNoon({ daysFromToday: 10 });

        testUtils.seedTarjetas(app, [
            testUtils.tarjetaRow(app, {
                nombre: "BBVA Visa",
                ultimoCierre: testUtils.dateNoon({ daysFromToday: -40 }),
                ultimoVencimiento: testUtils.dateNoon({ daysFromToday: -30 }),
                proximoCierre: cierreAyer,
                proximoVencimiento: vencimientoEn10Dias,
                id: "TAR-1"
            })
        ]);

        testUtils.seedCardDebts(app, [
            testUtils.cardDebtRow(app, {
                fecha: testUtils.dateNoon({ daysFromToday: -5 }),
                medio: "BBVA Visa",
                monto: 30000,
                cuotas: 3,
                cuotasRestantes: 3,
                detalle: "Compra en 3 cuotas",
                id: "DT-1",
                gastoId: "GAS-1"
            })
        ]);

        testUtils.runTrigger(app, "CardsMaintenanceTrigger");

        const cuota = testUtils.sheetObjects(app, "SHEET_CUOTAS")[0];

        expect(cuota["#Cuotas"]).toBe(3);
        expect(cuota["#CuotasRestantes"]).toBe(3);
    });


    test("en un ciclo completo cierre y vencimiento descuenta la cuota una sola vez", () => {
        vi.useFakeTimers();

        try {
            vi.setSystemTime(new Date(2026, 8, 25, 12, 0, 0));

            const app = createGasTestRuntime();

            testUtils.seedTarjetas(app, [
                testUtils.tarjetaRow(app, {
                    nombre: "BBVA Visa",
                    ultimoCierre: new Date(2026, 7, 24, 12, 0, 0),
                    ultimoVencimiento: new Date(2026, 8, 5, 12, 0, 0),

                    // ciclo que acaba de cerrar
                    proximoCierre: new Date(2026, 8, 24, 12, 0, 0),
                    proximoVencimiento: new Date(2026, 9, 5, 12, 0, 0),

                    id: "TAR-1"
                })
            ]);

            testUtils.seedCardDebts(app, [
                testUtils.cardDebtRow(app, {
                    fecha: new Date(2026, 8, 8, 12, 0, 0),
                    medio: "BBVA Visa",
                    monto: 30000,
                    cuotas: 3,
                    cuotasRestantes: 3,
                    detalle: "Compra BBVA",
                    id: "DT-1",
                    gastoId: "GAS-1"
                })
            ]);

            // 25/09: ya pasó el cierre del 24/09
            testUtils.runTrigger(app, "CardsMaintenanceTrigger");

            let cuota = testUtils.sheetObjects(app, "SHEET_CUOTAS")[0];

            // Cerrar el resumen NO consume una cuota
            expect(cuota["#CuotasRestantes"]).toBe(3);

            // 05/10: llega el vencimiento del resumen
            vi.setSystemTime(new Date(2026, 9, 5, 12, 0, 0));

            testUtils.runTrigger(app, "ExpirationsAlertTrigger");

            cuota = testUtils.sheetObjects(app, "SHEET_CUOTAS")[0];

            // Recién ahora debe bajar una
            expect(cuota["#CuotasRestantes"]).toBe(2);

        } finally {
            vi.useRealTimers();
        }
    });
});