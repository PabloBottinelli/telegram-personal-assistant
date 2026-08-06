import { describe, expect, test } from "vitest";
import { createGasTestRuntime } from "../gasTestRuntime.js";
import * as testUtils from "../testUtils.js";

describe("Reminders", () => {
  test("Al iniciar el flujo muestra los tipos de recordatorio", () => {
    const app = createGasTestRuntime();

    app.sendMessage(testUtils.fullRecordatorio());

    const msg = app.lastMessage();

    expect(msg).toContain("Elegí el TIPO");
    expect(msg).toContain("1. Diario");
    expect(msg).toContain("2. Semanal");
    expect(msg).toContain("3. Semanal");
    expect(msg).toContain("4. Cada N días");
    expect(msg).toContain("5. Mensual");
    expect(msg).toContain("6. Fecha específica");
    expect(msg).toContain("CANCELAR");

    expect(testUtils.sheetObjects(app, "SHEET_RECORDATORIOS")).toHaveLength(0);
  });

  test("Elegir tipo inválido reenvía la lista y no guarda", () => {
    const app = createGasTestRuntime();

    app.sendMessage(testUtils.fullRecordatorio());

    app.sendMessage("99");

    const msg = app.lastMessage();

    expect(msg).toContain("Número inválido");
    expect(msg).toContain("1. Diario");
    expect(msg).toContain("6. Fecha específica");

    expect(testUtils.sheetObjects(app, "SHEET_RECORDATORIOS")).toHaveLength(0);
  });

  test("Guarda un recordatorio diario con hora válida", () => {
    const app = createGasTestRuntime();

    testUtils.crearRecordatorioDiarioDesdeBot(app);

    const recordatorios = testUtils.sheetObjects(app, "SHEET_RECORDATORIOS");
    expect(recordatorios).toHaveLength(1);

    const rec = recordatorios[0];

    expect(rec["Detalle"]).toBe("Tomar agua");
    expect(rec["Tipo"]).toBe("DAILY");
    expect(rec["Campo Clave"]).toBe("-");
    expect(rec["Activo"]).toBe(true);
    expect(rec["Ultima Ejecucion"]).toBe("");
    expect(rec["ID"]).toMatch(/^REC-/);

    testUtils.expectHora(rec["Horario"], 8, 0);
  });

  test("Guarda hora default 07:00 cuando se responde '-'", () => {
    const app = createGasTestRuntime();

    testUtils.crearRecordatorioDiarioDesdeBot(app, {
      hora: "-"
    });

    const rec = testUtils.sheetObjects(app, "SHEET_RECORDATORIOS")[0];

    testUtils.expectHora(rec["Horario"], 7, 0);
    expect(app.lastMessage()).toContain("Hora: 07:00");
  });

  test("Guarda un recordatorio semanal", () => {
    const app = createGasTestRuntime();

    testUtils.crearRecordatorioSemanalDesdeBot(app);

    const rec = testUtils.sheetObjects(app, "SHEET_RECORDATORIOS")[0];

    expect(rec["Detalle"]).toBe("Sacar basura");
    expect(rec["Tipo"]).toBe("WEEKLY");
    expect(rec["Campo Clave"]).toBe("Lunes");

    testUtils.expectHora(rec["Horario"], 9, 0);
  });

  test("Recordatorio semanal acepta día por número", () => {
    const app = createGasTestRuntime();

    testUtils.crearRecordatorioSemanalDesdeBot(app, {
      dia: "5"
    });

    const rec = testUtils.sheetObjects(app, "SHEET_RECORDATORIOS")[0];

    expect(rec["Tipo"]).toBe("WEEKLY");
    expect(rec["Campo Clave"]).toBe("Viernes");
  });

  test("Día semanal inválido no guarda", () => {
    const app = createGasTestRuntime();

    app.sendMessage(testUtils.fullRecordatorio());

    app.sendMessage("2");
    app.sendMessage("sdaas");

    expect(app.lastMessage()).toContain("Día inválido");
    expect(testUtils.sheetObjects(app, "SHEET_RECORDATORIOS")).toHaveLength(0);
  });

  test("Guarda un recordatorio semanal de varios días", () => {
    const app = createGasTestRuntime();

    testUtils.crearRecordatorioSemanalMultipleDesdeBot(app, {
      dias: "Lunes, mie, 5",
    });

    const rec = testUtils.sheetObjects(app, "SHEET_RECORDATORIOS")[0];

    expect(rec["Detalle"]).toBe("Gimnasio");
    expect(rec["Tipo"]).toBe("WEEKLY_MULTI");
    expect(rec["Campo Clave"]).toBe("Lunes, Miércoles, Viernes");

    testUtils.expectHora(rec["Horario"], 18, 0);
  });

  test("Día inválido en semanal múltiple no guarda", () => {
    const app = createGasTestRuntime();

    app.sendMessage(testUtils.fullRecordatorio());

    app.sendMessage("3");
    app.sendMessage("Lunes, asdas");

    expect(app.lastMessage()).toContain("Día inválido");
    expect(testUtils.sheetObjects(app, "SHEET_RECORDATORIOS")).toHaveLength(0);
  });

  test("Guarda un recordatorio cada N días", () => {
    const app = createGasTestRuntime();

    testUtils.crearRecordatorioCadaNDiasDesdeBot(app);

    const rec = testUtils.sheetObjects(app, "SHEET_RECORDATORIOS")[0];

    expect(rec["Detalle"]).toBe("Cambiar sábanas");
    expect(rec["Tipo"]).toBe("EVERY_N_DAYS");
    expect(rec["Campo Clave"]).toContain("3,");

    testUtils.expectHora(rec["Horario"], 8, 0);
  });

  test("Cada N días inválido no guarda", () => {
    const app = createGasTestRuntime();

    app.sendMessage(testUtils.fullRecordatorio());

    app.sendMessage("4");
    app.sendMessage("0");

    expect(app.lastMessage()).toContain("Valor inválido");
    expect(testUtils.sheetObjects(app, "SHEET_RECORDATORIOS")).toHaveLength(0);
  });

  test("Guarda un recordatorio mensual", () => {
    const app = createGasTestRuntime();

    testUtils.crearRecordatorioMensualDesdeBot(app);

    const rec = testUtils.sheetObjects(app, "SHEET_RECORDATORIOS")[0];

    expect(rec["Detalle"]).toBe("Pagar tarjeta");
    expect(rec["Tipo"]).toBe("MONTHLY");
    expect(rec["Campo Clave"]).toBe("10");

    testUtils.expectHora(rec["Horario"], 7, 30);
  });

  test("Día mensual inválido no guarda", () => {
    const app = createGasTestRuntime();

    app.sendMessage(testUtils.fullRecordatorio());

    app.sendMessage("5");
    app.sendMessage("32");

    expect(app.lastMessage()).toContain("Día inválido");
    expect(testUtils.sheetObjects(app, "SHEET_RECORDATORIOS")).toHaveLength(0);
  });

  test("Guarda un recordatorio de fecha específica", () => {
    const app = createGasTestRuntime();

    const hoy = new Date();
    const mesProximo = new Date(hoy);
    mesProximo.setMonth(mesProximo.getMonth() + 1);

    const fecha = `15/${String(mesProximo.getMonth() + 1).padStart(2, "0")}`;

    testUtils.crearRecordatorioUnaVezDesdeBot(app, {
      fecha,
      hora: "10:15"
    });

    const rec = testUtils.sheetObjects(app, "SHEET_RECORDATORIOS")[0];

    expect(rec["Detalle"]).toBe("Turno médico");
    expect(rec["Tipo"]).toBe("ONCE");
    expect(rec["Campo Clave"]).toContain(fecha);

    testUtils.expectHora(rec["Horario"], 10, 15);
  });

  test("Fecha específica inválida no guarda", () => {
    const app = createGasTestRuntime();

    app.sendMessage(testUtils.fullRecordatorio());

    app.sendMessage("6");
    app.sendMessage("40/20");

    expect(app.lastMessage()).toContain("Fecha inválida");
    expect(testUtils.sheetObjects(app, "SHEET_RECORDATORIOS")).toHaveLength(0);
  });

  test("Hora inválida no guarda y permite reintentar", () => {
    const app = createGasTestRuntime();

    app.sendMessage(testUtils.fullRecordatorio());

    app.sendMessage("1");
    app.sendMessage("7");

    expect(app.lastMessage()).toContain("Hora inválida");
    expect(testUtils.sheetObjects(app, "SHEET_RECORDATORIOS")).toHaveLength(0);

    app.sendMessage("07:05");

    expect(app.lastMessage()).toContain("Recordatorio creado");

    const rec = testUtils.sheetObjects(app, "SHEET_RECORDATORIOS")[0];
    testUtils.expectHora(rec["Horario"], 7, 5);
  });

  test("Hora fuera de rango no guarda", () => {
    const app = createGasTestRuntime();

    app.sendMessage(testUtils.fullRecordatorio());

    app.sendMessage("1");
    app.sendMessage("25:00");

    expect(app.lastMessage()).toContain("Hora fuera de rango");
    expect(testUtils.sheetObjects(app, "SHEET_RECORDATORIOS")).toHaveLength(0);
  });

  test("CANCELAR corta el flujo y no guarda", () => {
    const app = createGasTestRuntime();

    app.sendMessage(testUtils.fullRecordatorio());

    app.sendMessage("1");
    app.sendMessage("CANCELAR");

    expect(app.lastMessage()).toContain("Operación cancelada");
    expect(testUtils.sheetObjects(app, "SHEET_RECORDATORIOS")).toHaveLength(0);

    app.sendMessage("08:00");

    expect(app.lastMessage()).toContain("Elegí un comando válido");
    expect(testUtils.sheetObjects(app, "SHEET_RECORDATORIOS")).toHaveLength(0);
  });

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

  test("ReminderScheduler dispara WEEKLY si hoy coincide", () => {
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
});