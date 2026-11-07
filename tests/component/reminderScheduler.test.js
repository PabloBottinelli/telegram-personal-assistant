import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createGasTestRuntime } from "../gasTestRuntime.js";
import * as testUtils from "../testUtils.js";

describe("ReminderScheduler", () => {
    test("ReminderScheduler dispara recordatorio diario activo y actualiza última ejecución", () => {
        const app = createGasTestRuntime();

        testUtils.seedRecordatorios(app, [
            testUtils.recordatorioRow(app, {
                detalle: "Tomar agua",
                tipo: "DAILY",
                campoClave: "-",
                horario: testUtils.buildTimeDate(0, 0),
                activo: true,
                ultimaEjecucion: "",
                id: "REC-1"
            })
        ]);

        testUtils.runReminderScheduler(app);

        expect(app.lastMessage()).toContain("Recordatorio:");
        expect(app.lastMessage()).toContain("Tomar agua");

        const rec = testUtils.sheetObjects(app, "SHEET_RECORDATORIOS")[0];

        expect(rec["Ultima Ejecucion"]).toBeInstanceOf(Date);
        expect(rec["Activo"]).toBe(true);
    });

    test("ReminderScheduler no repite un recordatorio ya ejecutado hoy", () => {
        const app = createGasTestRuntime();

        const ultima = new Date();
        ultima.setHours(1, 0, 0, 0);

        testUtils.seedRecordatorios(app, [
            testUtils.recordatorioRow(app, {
                detalle: "No repetir",
                tipo: "DAILY",
                campoClave: "-",
                horario: testUtils.buildTimeDate(0, 0),
                activo: true,
                ultimaEjecucion: ultima,
                id: "REC-1"
            })
        ]);

        testUtils.runReminderScheduler(app);

        expect(app.messages()).toHaveLength(0);
        expect(testUtils.sheetObjects(app, "SHEET_RECORDATORIOS")[0]["Ultima Ejecucion"]).toEqual(ultima);
    });

    test("ReminderScheduler ignora recordatorios inactivos", () => {
        const app = createGasTestRuntime();

        testUtils.seedRecordatorios(app, [
            testUtils.recordatorioRow(app, {
                detalle: "Inactivo",
                tipo: "DAILY",
                campoClave: "-",
                horario: testUtils.buildTimeDate(0, 0),
                activo: false,
                id: "REC-1"
            })
        ]);

        testUtils.runReminderScheduler(app);

        expect(app.messages()).toHaveLength(0);
        expect(testUtils.sheetObjects(app, "SHEET_RECORDATORIOS")[0]["Ultima Ejecucion"]).toBe("");
    });

    test("ReminderScheduler dispara ONCE y lo desactiva", () => {
        const app = createGasTestRuntime();

        testUtils.seedRecordatorios(app, [
            testUtils.recordatorioRow(app, {
                detalle: "Turno médico",
                tipo: "ONCE",
                campoClave: testUtils.todayDDMMYYYY(),
                horario: testUtils.buildTimeDate(0, 0),
                activo: true,
                id: "REC-1"
            })
        ]);

        testUtils.runReminderScheduler(app);

        expect(app.lastMessage()).toContain("Turno médico");

        const rec = testUtils.sheetObjects(app, "SHEET_RECORDATORIOS")[0];

        expect(rec["Ultima Ejecucion"]).toBeInstanceOf(Date);
        expect(rec["Activo"]).toBe(false);
    });

    test("ReminderScheduler dispara WEEKLY si hoy corresponde", () => {
        const app = createGasTestRuntime();

        const labels = [
            "Domingo",
            "Lunes",
            "Martes",
            "Miércoles",
            "Jueves",
            "Viernes",
            "Sábado"
        ];

        const hoy = labels[new Date().getDay()];

        testUtils.seedRecordatorios(app, [
            testUtils.recordatorioRow(app, {
                detalle: "Semanal de hoy",
                tipo: "WEEKLY",
                campoClave: hoy,
                horario: testUtils.buildTimeDate(0, 0),
                activo: true,
                id: "REC-1"
            })
        ]);

        testUtils.runReminderScheduler(app);

        expect(app.lastMessage()).toContain("Semanal de hoy");
    });

    test("ReminderScheduler dispara WEEKLY_MULTI si hoy corresponde", () => {
        const app = createGasTestRuntime();

        const labels = [
            "Domingo",
            "Lunes",
            "Martes",
            "Miércoles",
            "Jueves",
            "Viernes",
            "Sábado"
        ];

        const hoy = labels[new Date().getDay()];

        testUtils.seedRecordatorios(app, [
            testUtils.recordatorioRow(app, {
                detalle: "Multi-semanal de hoy",
                tipo: "WEEKLY_MULTI",
                campoClave: hoy,
                horario: testUtils.buildTimeDate(0, 0),
                activo: true,
                id: "REC-1"
            })
        ]);

        testUtils.runReminderScheduler(app);

        expect(app.lastMessage()).toContain("Multi-semanal de hoy");
    });

    describe("ReminderScheduler con fecha fija", () => {
        beforeEach(() => {
            vi.useFakeTimers({ toFake: ["Date"] });
            vi.setSystemTime(new Date(2026, 5, 1, 12, 0, 0));
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        test("No dispara antes del horario y dispara al alcanzarlo", () => {
            const app = createGasTestRuntime();

            testUtils.seedRecordatorios(app, [
                testUtils.recordatorioRow(app, {
                    detalle: "Recordatorio de las 12:01",
                    tipo: "DAILY",
                    horario: testUtils.buildTimeDate(12, 1),
                    id: "REC-FUTURO"
                })
            ]);

            const antes = testUtils.sheetObjects(app, "SHEET_RECORDATORIOS");

            testUtils.runReminderScheduler(app);

            expect(app.messages()).toHaveLength(0);
            expect(testUtils.sheetObjects(app, "SHEET_RECORDATORIOS")).toEqual(antes);

            vi.setSystemTime(new Date(2026, 5, 1, 12, 1, 0));
            testUtils.runReminderScheduler(app);

            expect(app.messages()).toHaveLength(1);
            expect(app.lastMessage()).toContain("Recordatorio de las 12:01");

            const rec = testUtils.sheetObjects(app, "SHEET_RECORDATORIOS")[0];
            expect(rec["Ultima Ejecucion"]).toEqual(new Date());
            expect(rec["Activo"]).toBe(true);
        });

        test("No procesa recordatorios ni libera el lock si no puede obtenerlo", () => {
            const app = createGasTestRuntime();
            const lock = {
                tryLock: vi.fn(() => false),
                releaseLock: vi.fn()
            };
            app.context.LockService.getScriptLock = () => lock;

            testUtils.seedRecordatorios(app, [
                testUtils.recordatorioRow(app, {
                    detalle: "Recordatorio bloqueado",
                    tipo: "ONCE",
                    campoClave: "01/06/2026",
                    horario: testUtils.buildTimeDate(0, 0),
                    id: "REC-LOCK"
                })
            ]);

            const antes = testUtils.sheetObjects(app, "SHEET_RECORDATORIOS");

            testUtils.runReminderScheduler(app);

            expect(lock.tryLock).toHaveBeenCalledExactlyOnceWith(20000);
            expect(lock.releaseLock).not.toHaveBeenCalled();
            expect(app.messages()).toHaveLength(0);
            expect(testUtils.sheetObjects(app, "SHEET_RECORDATORIOS")).toEqual(antes);
        });

        test.each([
            { dia: "1", dispara: true },
            { dia: "2", dispara: false },
            { dia: "1.5", dispara: false }
        ])("MONTHLY con día $dia: dispara=$dispara", ({ dia, dispara }) => {
            const app = createGasTestRuntime();

            testUtils.seedRecordatorios(app, [
                testUtils.recordatorioRow(app, {
                    detalle: "Mensual de hoy",
                    tipo: "MONTHLY",
                    campoClave: dia,
                    horario: testUtils.buildTimeDate(0, 0),
                    activo: true,
                    id: "REC-MONTHLY"
                })
            ]);

            testUtils.runReminderScheduler(app);

            const rec = testUtils.sheetObjects(app, "SHEET_RECORDATORIOS")[0];

            expect(app.messages()).toHaveLength(dispara ? 1 : 0);
            if (dispara) expect(app.lastMessage()).toContain("Mensual de hoy");
            expect(rec["Ultima Ejecucion"]).toEqual(dispara ? new Date() : "");
            expect(rec["Activo"]).toBe(true);
        });

        test.each([
            { campoClave: "3, 01/06/2026", dispara: true },
            { campoClave: "3, 29/05/2026", dispara: true },
            { campoClave: "3, 26/05/2026", dispara: true },
            { campoClave: "3, 31/05/2026", dispara: false },
            { campoClave: "3, 04/06/2026", dispara: false },
            { campoClave: "0, 01/06/2026", dispara: false },
            { campoClave: "1.5, 01/06/2026", dispara: false },
            { campoClave: "3, 31/02/2026", dispara: false },
            { campoClave: "3", dispara: false }
        ])("EVERY_N_DAYS con campo clave '$campoClave': dispara=$dispara", ({ campoClave, dispara }) => {
            const app = createGasTestRuntime();

            testUtils.seedRecordatorios(app, [
                testUtils.recordatorioRow(app, {
                    detalle: "Cambiar sábanas",
                    tipo: "EVERY_N_DAYS",
                    campoClave,
                    horario: testUtils.buildTimeDate(0, 0),
                    activo: true,
                    id: "REC-EVERY-N-DAYS"
                })
            ]);

            testUtils.runReminderScheduler(app);

            const rec = testUtils.sheetObjects(app, "SHEET_RECORDATORIOS")[0];

            expect(app.messages()).toHaveLength(dispara ? 1 : 0);
            if (dispara) expect(app.lastMessage()).toContain("Cambiar sábanas");
            expect(rec["Ultima Ejecucion"]).toEqual(dispara ? new Date() : "");
            expect(rec["Activo"]).toBe(true);
        });
    });
});