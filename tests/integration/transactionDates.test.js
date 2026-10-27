import { afterEach, describe, expect, test, vi } from "vitest";
import { createGasTestRuntime } from "../gasTestRuntime.js";
import * as testUtils from "../testUtils.js";

describe.each([
  ["GASTO", testUtils.crearGastoDesdeBot, "SHEET_GASTOS"],
  ["TC", testUtils.crearGastoConTarjetaDesdeBot, "SHEET_GASTOS"],
  ["INGRESO", testUtils.crearIngresoDesdeBot, "SHEET_INGRESOS"]
])("Fechas de movimientos: %s", (command, createTransaction, sheetName) => {
  afterEach(() => {
    vi.useRealTimers();
  });

  test.each([
    {
      caso: "elige diciembre del año anterior desde enero",
      hoy: [2026, 0, 5, 23], fecha: "31/12", esperada: [2025, 11, 31]
    },
    {
      caso: "elige enero del año siguiente desde diciembre",
      hoy: [2026, 11, 28, 1], fecha: "02/01", esperada: [2027, 0, 2]
    },
    {
      caso: "acepta hoy aunque ya haya pasado el mediodía",
      hoy: [2026, 9, 27, 23], fecha: "27/10", esperada: [2026, 9, 27]
    },
    {
      caso: "acepta una fecha futura del mismo mes",
      hoy: [2026, 9, 27, 1], fecha: "28/10", esperada: [2026, 9, 28]
    },
    {
      caso: "conserva el año actual para julio desde enero",
      hoy: [2026, 0, 5, 12], fecha: "31/07", esperada: [2026, 6, 31]
    },
    {
      caso: "conserva el año actual para enero desde julio",
      hoy: [2026, 6, 31, 12], fecha: "01/01", esperada: [2026, 0, 1]
    },
    {
      caso: "valida el día bisiesto en el año siguiente elegido",
      hoy: [2023, 11, 5, 12], fecha: "29/02", esperada: [2024, 1, 29]
    },
    {
      caso: "interpreta - como hoy",
      hoy: [2026, 0, 5, 23], fecha: "-", esperada: [2026, 0, 5]
    }
  ])("$caso", ({ hoy, fecha, esperada }) => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(...hoy));
    const app = createGasTestRuntime();

    testUtils.seedCategorias(app);
    if (command === "TC") testUtils.seedTarjetas(app);

    createTransaction(app, { fecha });

    const movimientos = testUtils.sheetObjects(app, sheetName);

    expect(movimientos).toHaveLength(1);
    expect(movimientos[0]["Fecha"]).toEqual(new Date(...esperada, 12, 0, 0, 0));
  });

  test.each(["31/02", "29/02"])("rechaza %s si no existe en el año elegido", fecha => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2025, 0, 5, 12));
    const app = createGasTestRuntime();
    const MSG_ERRORS = testUtils.getGlobal(app, "MSG_ERRORS");
    const buildMessage = {
      GASTO: testUtils.fullGasto,
      TC: testUtils.fullTC,
      INGRESO: testUtils.fullIngreso
    };

    app.sendMessage(buildMessage[command]({ fecha }));

    expect(app.lastMessage()).toContain(MSG_ERRORS.FECHA_INVALIDA);
    expect(testUtils.sheetObjects(app, sheetName)).toHaveLength(0);
  });
});
