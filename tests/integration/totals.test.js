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

  test("Mes inválido devuelve mensaje de error y no calcula totales", () => {
    const app = createGasTestRuntime();

    const MSG_ERRORS = testUtils.getGlobal(app, "MSG_ERRORS");

    app.sendMessage([
      "TOTALES",
      "mes-inexistente"
    ].join("\n"));

    expect(app.lastMessage()).toContain(MSG_ERRORS.INVALID_MONTH);
  });

  test("TOTALES rechaza un mes con coma decimal", () => {
    const app = createGasTestRuntime();
    const MSG_ERRORS = testUtils.getGlobal(app, "MSG_ERRORS");

    app.sendMessage([
      "TOTALES",
      "6,5"
    ].join("\n"));

    expect(app.lastMessage()).toContain(MSG_ERRORS.INVALID_MONTH);
  });

  test("TOTALES rechaza un float como mes", () => {
    const app = createGasTestRuntime();
    const MSG_ERRORS = testUtils.getGlobal(app, "MSG_ERRORS");

    app.sendMessage([
      "TOTALES",
      "6.5"
    ].join("\n"));

    expect(app.lastMessage()).toContain(MSG_ERRORS.INVALID_MONTH);
  });

  test.todo("Mes futuro tira error", () => {
    const app = createGasTestRuntime();

    app.sendMessage([
      "TOTALES",
      "Diciembre"
    ].join("\n"));

    expect(app.lastMessage()).toContain("No se pueden calcular los totales de un mes futuro.");
  })

  test("Mes sin gastos ni ingresos devuelve todos los totales en cero", () => {
    const app = createGasTestRuntime();

    app.sendMessage([
      "TOTALES",
      "Junio"
    ].join("\n"));

    const msg = app.lastMessage();

    expect(msg).toContain("Totales de Junio de 2026:");
    expect(msg).toContain("Gastos del mes en pesos: $0,00");
    expect(msg).toContain("Gastos del mes en USD: 0,00 USD");
    expect(msg).toContain("Ingresos del mes en pesos: $0,00");
    expect(msg).toContain("Ingresos del mes en USD: 0,00 USD");
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

  test("TOTALES acepta mes por número", () => {
    const app = createGasTestRuntime();

    testUtils.seedCategorias(app);

    testUtils.crearGastoDesdeBot(app, {
      catIndex: "1",
      fecha: "10/06",
      monto: "10000",
      moneda: "ARS",
      detalle: "Gasto junio"
    });

    app.sendMessage([
      "TOTALES",
      "6"
    ].join("\n"));

    const msg = app.lastMessage();

    expect(msg).toContain("Totales de Junio de 2026:");
    expect(msg).toContain("Gastos del mes en pesos: $10.000,00");
  });

  test("TOTALES acepta '-' como mes actual", () => {
    const app = createGasTestRuntime();

    testUtils.seedCategorias(app);

    const now = new Date();
    const dia = String(now.getDate()).padStart(2, "0");
    const mes = String(now.getMonth() + 1).padStart(2, "0");

    testUtils.crearGastoDesdeBot(app, {
      catIndex: "1",
      fecha: `${dia}/${mes}`,
      monto: "12345",
      moneda: "ARS",
      detalle: "Gasto mes actual"
    });

    app.sendMessage([
      "TOTALES",
      "-"
    ].join("\n"));

    const msg = app.lastMessage();

    expect(msg).toContain("Gastos del mes en pesos: $12.345,00");
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
