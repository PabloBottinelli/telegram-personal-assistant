import { describe, expect, test } from "vitest";
import { createGasTestRuntime } from "../gasTestRuntime.js";
import * as testUtils from "../testUtils.js";


function gastoRow({
  fecha = new Date(2026, 5, 10, 12, 0, 0),
  categoria = "Comida",
  medio = "Efectivo",
  monto = 10000,
  moneda = "ARS",
  ahorro = 0,
  detalle = "Gasto test",
  tipo = "-",
  reintegrado = true,
  devuelto = true,
  id = "GAS-TEST-1"
} = {}) {
  return [
    fecha,
    categoria,
    medio,
    monto,
    moneda,
    ahorro,
    detalle,
    tipo,
    reintegrado,
    devuelto,
    id
  ];
}

function ingresoRow({
  fecha = new Date(2026, 5, 10, 12, 0, 0),
  monto = 100000,
  moneda = "ARS",
  categoria = "Sueldo",
  descripcion = "Ingreso test",
  id = "ING-TEST-1"
} = {}) {
  return [
    fecha,
    monto,
    moneda,
    categoria,
    descripcion,
    id
  ];
}

function seedGastos(app, rows) {
  appendRowsByConfig(app, "SHEET_GASTOS", rows);
}

function seedIngresos(app, rows) {
  appendRowsByConfig(app, "SHEET_INGRESOS", rows);
}

describe("TOTALES", () => {
  test("mes inválido devuelve mensaje de error y no calcula totales", () => {
    const app = createGasTestRuntime();

    const MSG_ERRORS = getGlobal(app, "MSG_ERRORS");

    app.sendMessage([
      "TOTALES",
      "mes-inexistente"
    ].join("\n"));

    expect(app.lastMessage()).toContain(MSG_ERRORS.INVALID_MONTH);
  });

  test("cantidad de líneas inválida devuelve formato correcto", () => {
    const app = createGasTestRuntime();

    const FORMATS = getGlobal(app, "FORMATS");

    app.sendMessage("TOTALES");

    expect(app.lastMessage()).toContain("Usá el formato correcto");
    expect(app.lastMessage()).toContain(FORMATS["TOTALES"]);
  });

  test("mes sin gastos ni ingresos devuelve todos los totales en cero", () => {
    const app = createGasTestRuntime();

    app.sendMessage([
      "TOTALES",
      "Junio"
    ].join("\n"));

    const msg = app.lastMessage();

    expect(msg).toContain("Totales de Junio:");
    expect(msg).toContain("Gastos del mes en pesos: $0,00");
    expect(msg).toContain("Gastos del mes en USD: 0,00 USD");
    expect(msg).toContain("Ingresos del mes en pesos: $0,00");
    expect(msg).toContain("Ingresos del mes en USD: 0,00 USD");
  });

  test("calcula gastos e ingresos del mes pedido en ARS y USD", () => {
    const app = createGasTestRuntime();

    seedGastos(app, [
      gastoRow({
        fecha: new Date(2026, 5, 10, 12, 0, 0),
        categoria: "Comida",
        monto: 10000,
        moneda: "ARS",
        ahorro: 0,
        detalle: "Gasto ARS junio",
        id: "GAS-1"
      }),
      gastoRow({
        fecha: new Date(2026, 5, 11, 12, 0, 0),
        categoria: "Comida",
        monto: 50,
        moneda: "USD",
        ahorro: 0,
        detalle: "Gasto USD junio",
        id: "GAS-2"
      })
    ]);

    seedIngresos(app, [
      ingresoRow({
        fecha: new Date(2026, 5, 10, 12, 0, 0),
        monto: 100000,
        moneda: "ARS",
        categoria: "Sueldo",
        descripcion: "Ingreso ARS junio",
        id: "ING-1"
      }),
      ingresoRow({
        fecha: new Date(2026, 5, 11, 12, 0, 0),
        monto: 200,
        moneda: "USD",
        categoria: "Venta",
        descripcion: "Ingreso USD junio",
        id: "ING-2"
      })
    ]);

    app.sendMessage([
      "TOTALES",
      "Junio"
    ].join("\n"));

    const msg = app.lastMessage();

    expect(msg).toContain("Totales de Junio:");
    expect(msg).toContain("Gastos del mes en pesos: $10.000,00");
    expect(msg).toContain("Gastos del mes en USD: 50,00 USD");
    expect(msg).toContain("Ingresos del mes en pesos: $100.000,00");
    expect(msg).toContain("Ingresos del mes en USD: 200,00 USD");
  });

  test("gastos e ingresos de otro mes no entran en el cálculo", () => {
    const app = createGasTestRuntime();

    seedGastos(app, [
      gastoRow({
        fecha: new Date(2026, 5, 10, 12, 0, 0),
        categoria: "Comida",
        monto: 10000,
        moneda: "ARS",
        detalle: "Gasto junio",
        id: "GAS-1"
      }),
      gastoRow({
        fecha: new Date(2026, 6, 10, 12, 0, 0),
        categoria: "Comida",
        monto: 99999,
        moneda: "ARS",
        detalle: "Gasto julio no entra",
        id: "GAS-2"
      })
    ]);

    seedIngresos(app, [
      ingresoRow({
        fecha: new Date(2026, 5, 10, 12, 0, 0),
        monto: 100000,
        moneda: "ARS",
        descripcion: "Ingreso junio",
        id: "ING-1"
      }),
      ingresoRow({
        fecha: new Date(2026, 6, 10, 12, 0, 0),
        monto: 999999,
        moneda: "ARS",
        descripcion: "Ingreso julio no entra",
        id: "ING-2"
      })
    ]);

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

  test("gastos con ahorro se calculan como monto menos ahorro", () => {
    const app = createGasTestRuntime();

    seedGastos(app, [
      gastoRow({
        fecha: new Date(2026, 5, 10, 12, 0, 0),
        categoria: "Comida",
        monto: 10000,
        moneda: "ARS",
        ahorro: 2000,
        detalle: "Gasto con ahorro",
        tipo: "D",
        reintegrado: true,
        id: "GAS-1"
      }),
      gastoRow({
        fecha: new Date(2026, 5, 11, 12, 0, 0),
        categoria: "Comida",
        monto: 50,
        moneda: "USD",
        ahorro: 10,
        detalle: "Gasto USD con ahorro",
        tipo: "D",
        reintegrado: true,
        id: "GAS-2"
      })
    ]);

    app.sendMessage([
      "TOTALES",
      "Junio"
    ].join("\n"));

    const msg = app.lastMessage();

    expect(msg).toContain("Gastos del mes en pesos: $8.000,00");
    expect(msg).toContain("Gastos del mes en USD: 40,00 USD");
  });

  test("gastos ajenos no entran en el cálculo de totales", () => {
    const app = createGasTestRuntime();

    seedGastos(app, [
      gastoRow({
        fecha: new Date(2026, 5, 10, 12, 0, 0),
        categoria: "Comida",
        monto: 10000,
        moneda: "ARS",
        detalle: "Gasto propio",
        id: "GAS-1"
      }),
      gastoRow({
        fecha: new Date(2026, 5, 11, 12, 0, 0),
        categoria: "Ajeno",
        monto: 50000,
        moneda: "ARS",
        ahorro: 0,
        detalle: "Gasto ajeno no entra",
        id: "GAS-2"
      })
    ]);

    app.sendMessage([
      "TOTALES",
      "Junio"
    ].join("\n"));

    const msg = app.lastMessage();

    expect(msg).toContain("Gastos del mes en pesos: $10.000,00");
    expect(msg).not.toContain("$60.000,00");
    expect(msg).not.toContain("$50.000,00");
  });

  test("gastos TC se computan como gastos comunes usando medio de pago tarjeta", () => {
    const app = createGasTestRuntime();

    seedGastos(app, [
      gastoRow({
        fecha: new Date(2026, 5, 10, 12, 0, 0),
        categoria: "Super",
        medio: "BBVA Visa",
        monto: 12000,
        moneda: "ARS",
        ahorro: 0,
        detalle: "Compra TC",
        id: "GAS-1"
      }),
      gastoRow({
        fecha: new Date(2026, 5, 11, 12, 0, 0),
        categoria: "Comida",
        medio: "Efectivo",
        monto: 3000,
        moneda: "ARS",
        ahorro: 0,
        detalle: "Compra efectivo",
        id: "GAS-2"
      })
    ]);

    app.sendMessage([
      "TOTALES",
      "Junio"
    ].join("\n"));

    const msg = app.lastMessage();

    expect(msg).toContain("Gastos del mes en pesos: $15.000,00");
  });

  test("USDT se suma dentro del total USD", () => {
    const app = createGasTestRuntime();

    seedGastos(app, [
      gastoRow({
        fecha: new Date(2026, 5, 10, 12, 0, 0),
        categoria: "Comida",
        monto: 50,
        moneda: "USD",
        ahorro: 0,
        detalle: "Gasto USD",
        id: "GAS-1"
      }),
      gastoRow({
        fecha: new Date(2026, 5, 11, 12, 0, 0),
        categoria: "Comida",
        monto: 25,
        moneda: "USDT",
        ahorro: 0,
        detalle: "Gasto USDT",
        id: "GAS-2"
      })
    ]);

    seedIngresos(app, [
      ingresoRow({
        fecha: new Date(2026, 5, 10, 12, 0, 0),
        monto: 100,
        moneda: "USD",
        descripcion: "Ingreso USD",
        id: "ING-1"
      }),
      ingresoRow({
        fecha: new Date(2026, 5, 11, 12, 0, 0),
        monto: 50,
        moneda: "USDT",
        descripcion: "Ingreso USDT",
        id: "ING-2"
      })
    ]);

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

    seedGastos(app, [
      gastoRow({
        fecha: new Date(2026, 5, 10, 12, 0, 0),
        categoria: "Comida",
        monto: 10000,
        moneda: "ARS",
        id: "GAS-1"
      })
    ]);

    app.sendMessage([
      "TOTALES",
      "6"
    ].join("\n"));

    const msg = app.lastMessage();

    expect(msg).toContain("Totales de Junio:");
    expect(msg).toContain("Gastos del mes en pesos: $10.000,00");
  });

  test("TOTALES acepta '-' como mes actual", () => {
    const app = createGasTestRuntime();

    const now = new Date();

    seedGastos(app, [
      gastoRow({
        fecha: new Date(now.getFullYear(), now.getMonth(), 10, 12, 0, 0),
        categoria: "Comida",
        monto: 12345,
        moneda: "ARS",
        id: "GAS-ACTUAL"
      })
    ]);

    app.sendMessage([
      "TOTALES",
      "-"
    ].join("\n"));

    const msg = app.lastMessage();

    expect(msg).toContain("Gastos del mes en pesos: $12.345,00");
  });

  test("TOTALES ignora filas con fecha inválida o moneda no computable", () => {
    const app = createGasTestRuntime();

    seedGastos(app, [
      gastoRow({
        fecha: "no-es-fecha",
        categoria: "Comida",
        monto: 99999,
        moneda: "ARS",
        id: "GAS-FECHA-MALA"
      }),
      gastoRow({
        fecha: new Date(2026, 5, 10, 12, 0, 0),
        categoria: "Comida",
        monto: 10000,
        moneda: "EUR",
        id: "GAS-EUR"
      }),
      gastoRow({
        fecha: new Date(2026, 5, 10, 12, 0, 0),
        categoria: "Comida",
        monto: 5000,
        moneda: "ARS",
        id: "GAS-OK"
      })
    ]);

    seedIngresos(app, [
      ingresoRow({
        fecha: "no-es-fecha",
        monto: 999999,
        moneda: "ARS",
        id: "ING-FECHA-MALA"
      }),
      ingresoRow({
        fecha: new Date(2026, 5, 10, 12, 0, 0),
        monto: 888888,
        moneda: "EUR",
        id: "ING-EUR"
      }),
      ingresoRow({
        fecha: new Date(2026, 5, 10, 12, 0, 0),
        monto: 25000,
        moneda: "ARS",
        id: "ING-OK"
      })
    ]);

    app.sendMessage([
      "TOTALES",
      "Junio"
    ].join("\n"));

    const msg = app.lastMessage();

    expect(msg).toContain("Gastos del mes en pesos: $5.000,00");
    expect(msg).toContain("Gastos del mes en USD: 0,00 USD");
    expect(msg).toContain("Ingresos del mes en pesos: $25.000,00");
    expect(msg).toContain("Ingresos del mes en USD: 0,00 USD");
  });

  test("TOTALES no modifica ninguna hoja", () => {
    const app = createGasTestRuntime();

    seedGastos(app, [
      gastoRow({
        fecha: new Date(2026, 5, 10, 12, 0, 0),
        categoria: "Comida",
        monto: 10000,
        moneda: "ARS",
        id: "GAS-1"
      })
    ]);

    seedIngresos(app, [
      ingresoRow({
        fecha: new Date(2026, 5, 10, 12, 0, 0),
        monto: 100000,
        moneda: "ARS",
        id: "ING-1"
      })
    ]);

    const gastosAntes = sheetRowsByConfig(app, "SHEET_GASTOS");
    const ingresosAntes = sheetRowsByConfig(app, "SHEET_INGRESOS");

    app.sendMessage([
      "TOTALES",
      "Junio"
    ].join("\n"));

    expect(sheetRowsByConfig(app, "SHEET_GASTOS")).toEqual(gastosAntes);
    expect(sheetRowsByConfig(app, "SHEET_INGRESOS")).toEqual(ingresosAntes);
  });
});