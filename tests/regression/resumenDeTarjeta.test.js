import { describe, expect, test } from "vitest";
import { createGasTestRuntime } from "../gasTestRuntime.js";
import * as testUtils from "../testUtils.js";

function rowFromObject(headers, data) {
  return headers.map(header => data[header] ?? "");
}

function cardRow(app, {
  nombre = "BBVA Visa",
  ultimoCierre = new Date(2026, 5, 20, 12, 0, 0),
  ultimoVencimiento = "",
  proximoCierre = "",
  proximoVencimiento = "",
  id = "TAR-1"
} = {}) {
  const SHEET_TARJETAS = getGlobal(app, "SHEET_TARJETAS");

  return rowFromObject(SHEET_TARJETAS.headers, {
    "Tarjeta de crédito": nombre,
    "Último cierre": ultimoCierre,
    "Último vencimiento": ultimoVencimiento,
    "Próximo Cierre": proximoCierre,
    "Próximo Vencimiento": proximoVencimiento,
    "ID": id
  });
}

function gastoRow(app, {
  fecha = new Date(2026, 5, 10, 12, 0, 0),
  categoria = "Super",
  medio = "BBVA Visa",
  monto = 12000,
  moneda = "ARS",
  ahorro = 0,
  detalle = "Compra test",
  tipo = "-",
  reintegrado = true,
  devuelto = true,
  id = "GAS-1"
} = {}) {
  const SHEET_GASTOS = getGlobal(app, "SHEET_GASTOS");

  return rowFromObject(SHEET_GASTOS.headers, {
    "Fecha": fecha,
    "Categoría": categoria,
    "Medio de pago": medio,
    "Monto": monto,
    "Moneda": moneda,
    "Ahorro": ahorro,
    "Detalle": detalle,
    "Tipo": tipo,
    "Reintegrado?": reintegrado,
    "Devuelto?": devuelto,
    "ID": id
  });
}

function cardDebtRow(app, {
  fecha = new Date(2026, 5, 10, 12, 0, 0),
  medio = "BBVA Visa",
  moneda = "ARS",
  monto = 12000,
  cuotas = 3,
  cuotasRestantes = 3,
  detalle = "Compra test",
  id = "DT-1",
  gastoId = "GAS-1"
} = {}) {
  const SHEET_CUOTAS = getGlobal(app, "SHEET_CUOTAS");

  return rowFromObject(SHEET_CUOTAS.headers, {
    "Fecha": fecha,
    "Medio de pago": medio,
    "Moneda": moneda,
    "Monto": monto,
    "#Cuotas": cuotas,
    "#CuotasRestantes": cuotasRestantes,
    "Detalle": detalle,
    "ID": id,
    "Gasto ID": gastoId
  });
}

function seedCards(app, rows) {
  appendRowsByConfig(app, "SHEET_TARJETAS", rows);
}

function seedGastos(app, rows) {
  appendRowsByConfig(app, "SHEET_GASTOS", rows);
}

function seedCardDebts(app, rows) {
  appendRowsByConfig(app, "SHEET_CUOTAS", rows);
}

function cardDebtsObjects(app) {
  const SHEET_CUOTAS = getGlobal(app, "SHEET_CUOTAS");

  return sheetRowsByConfig(app, "SHEET_CUOTAS").map(row =>
    rowToObject(SHEET_CUOTAS.headers, row)
  );
}

describe("RESUMEN / Card Summary", () => {
  test("si no hay tarjetas cargadas, no envía resumen", () => {
    const app = createGasTestRuntime();

    app.sendMessage("RESUMEN");

    expect(app.messages()).toHaveLength(0);
  });

  test("si la tarjeta no tiene fecha de cierre determinable, avisa error", () => {
    const app = createGasTestRuntime();

    seedCards(app, [
      cardRow(app, {
        nombre: "BBVA Visa",
        ultimoCierre: "",
        ultimoVencimiento: "",
        proximoCierre: "",
        proximoVencimiento: "",
        id: "TAR-1"
      })
    ]);

    app.sendMessage("RESUMEN");

    expect(app.lastMessage()).toContain("BBVA Visa");
    expect(app.lastMessage()).toContain("no pude determinar fecha de cierre");
  });

  test("si no hay deudas de tarjeta cargadas, envía resumen sin deudas", () => {
    const app = createGasTestRuntime();

    seedCards(app, [
      cardRow(app, {
        nombre: "BBVA Visa",
        ultimoCierre: new Date(2026, 5, 20, 12, 0, 0),
        id: "TAR-1"
      })
    ]);

    app.sendMessage("RESUMEN");

    expect(app.lastMessage()).toContain("Resumen BBVA Visa");
    expect(app.lastMessage()).toContain("No hay deudas de tarjeta cargadas");
  });

  test("arma resumen con gastos ajenos separados de gastos propios", () => {
    const app = createGasTestRuntime();

    seedCards(app, [
      cardRow(app, {
        nombre: "BBVA Visa",
        ultimoCierre: new Date(2026, 5, 20, 12, 0, 0),
        id: "TAR-1"
      })
    ]);

    seedGastos(app, [
      gastoRow(app, {
        categoria: "Ajeno",
        medio: "BBVA Visa",
        monto: 12000,
        detalle: "Compra ajena",
        devuelto: false,
        id: "GAS-AJENO"
      }),
      gastoRow(app, {
        categoria: "Super",
        medio: "BBVA Visa",
        monto: 9000,
        detalle: "Compra propia",
        id: "GAS-PROPIO"
      })
    ]);

    seedCardDebts(app, [
      cardDebtRow(app, {
        medio: "BBVA Visa",
        monto: 12000,
        cuotas: 3,
        cuotasRestantes: 3,
        detalle: "Compra ajena",
        id: "DT-AJENO",
        gastoId: "GAS-AJENO"
      }),
      cardDebtRow(app, {
        medio: "BBVA Visa",
        monto: 9000,
        cuotas: 3,
        cuotasRestantes: 3,
        detalle: "Compra propia",
        id: "DT-PROPIO",
        gastoId: "GAS-PROPIO"
      })
    ]);

    app.sendMessage("RESUMEN");

    const msg = app.lastMessage();

    expect(msg).toContain("Gastos Ajenos:");
    expect(msg).toContain("Compra ajena");
    expect(msg).toContain("[GAS-AJENO]");
    expect(msg).toContain("Total a pagar en pesos de cosas ajenas: $4.000,00");

    expect(msg).toContain("Gastos Propios:");
    expect(msg).toContain("Compra propia");
    expect(msg).toContain("[GAS-PROPIO]");
    expect(msg).toContain("Total a pagar en pesos de cosas propias: $3.000,00");

    expect(msg).toContain("Total general ARS: $7.000,00");
  });

  test("calcula totales en USD y ARS por separado", () => {
    const app = createGasTestRuntime();

    seedCards(app, [
      cardRow(app, {
        nombre: "BBVA Visa",
        ultimoCierre: new Date(2026, 5, 20, 12, 0, 0),
        id: "TAR-1"
      })
    ]);

    seedGastos(app, [
      gastoRow(app, {
        categoria: "Super",
        medio: "BBVA Visa",
        monto: 12000,
        moneda: "ARS",
        detalle: "Compra ARS",
        id: "GAS-ARS"
      }),
      gastoRow(app, {
        categoria: "Cursos",
        medio: "BBVA Visa",
        monto: 60,
        moneda: "USD",
        detalle: "Compra USD",
        id: "GAS-USD"
      })
    ]);

    seedCardDebts(app, [
      cardDebtRow(app, {
        medio: "BBVA Visa",
        moneda: "ARS",
        monto: 12000,
        cuotas: 3,
        cuotasRestantes: 3,
        detalle: "Compra ARS",
        id: "DT-ARS",
        gastoId: "GAS-ARS"
      }),
      cardDebtRow(app, {
        medio: "BBVA Visa",
        moneda: "USD",
        monto: 60,
        cuotas: 3,
        cuotasRestantes: 3,
        detalle: "Compra USD",
        id: "DT-USD",
        gastoId: "GAS-USD"
      })
    ]);

    app.sendMessage("RESUMEN");

    const msg = app.lastMessage();

    expect(msg).toContain("Compra ARS");
    expect(msg).toContain("$4.000,00");

    expect(msg).toContain("Compra USD");
    expect(msg).toContain("20,00 USD");

    expect(msg).toContain("Total a pagar en pesos de cosas propias: $4.000,00");
    expect(msg).toContain("Total a pagar en usd de cosas propias: 20,00 USD");

    expect(msg).toContain("Total general ARS: $4.000,00");
    expect(msg).toContain("Total general USD: 20,00 USD");
  });

  test("incluye descuento pendiente cuando tipo D no está reintegrado", () => {
    const app = createGasTestRuntime();

    seedCards(app, [
      cardRow(app, {
        nombre: "BBVA Visa",
        ultimoCierre: new Date(2026, 5, 20, 12, 0, 0),
        id: "TAR-1"
      })
    ]);

    seedGastos(app, [
      gastoRow(app, {
        categoria: "Super",
        medio: "BBVA Visa",
        monto: 10000,
        ahorro: 2000,
        detalle: "Compra con descuento pendiente",
        tipo: "D",
        reintegrado: false,
        id: "GAS-1"
      })
    ]);

    seedCardDebts(app, [
      cardDebtRow(app, {
        medio: "BBVA Visa",
        monto: 10000,
        cuotas: 1,
        cuotasRestantes: 1,
        detalle: "Compra con descuento pendiente",
        id: "DT-1",
        gastoId: "GAS-1"
      })
    ]);

    app.sendMessage("RESUMEN");

    const msg = app.lastMessage();

    expect(msg).toContain("Compra con descuento pendiente");
    expect(msg).toContain("descuento pendiente");
    expect(msg).toContain("$2.000,00");
  });

  test("no incluye descuento pendiente si ya está reintegrado", () => {
    const app = createGasTestRuntime();

    seedCards(app, [
      cardRow(app, {
        nombre: "BBVA Visa",
        ultimoCierre: new Date(2026, 5, 20, 12, 0, 0),
        id: "TAR-1"
      })
    ]);

    seedGastos(app, [
      gastoRow(app, {
        categoria: "Super",
        medio: "BBVA Visa",
        monto: 10000,
        ahorro: 2000,
        detalle: "Compra con descuento aplicado",
        tipo: "D",
        reintegrado: true,
        id: "GAS-1"
      })
    ]);

    seedCardDebts(app, [
      cardDebtRow(app, {
        medio: "BBVA Visa",
        monto: 10000,
        cuotas: 1,
        cuotasRestantes: 1,
        detalle: "Compra con descuento aplicado",
        id: "DT-1",
        gastoId: "GAS-1"
      })
    ]);

    app.sendMessage("RESUMEN");

    const msg = app.lastMessage();

    expect(msg).toContain("Compra con descuento aplicado");
    expect(msg).not.toContain("descuento pendiente");
  });

  test("ignora deudas de otra tarjeta", () => {
    const app = createGasTestRuntime();

    seedCards(app, [
      cardRow(app, {
        nombre: "BBVA Visa",
        ultimoCierre: new Date(2026, 5, 20, 12, 0, 0),
        id: "TAR-1"
      })
    ]);

    seedGastos(app, [
      gastoRow(app, {
        categoria: "Super",
        medio: "Galicia Mastercard",
        monto: 99999,
        detalle: "Compra otra tarjeta",
        id: "GAS-OTRA"
      })
    ]);

    seedCardDebts(app, [
      cardDebtRow(app, {
        medio: "Galicia Mastercard",
        monto: 99999,
        cuotas: 1,
        cuotasRestantes: 1,
        detalle: "Compra otra tarjeta",
        id: "DT-OTRA",
        gastoId: "GAS-OTRA"
      })
    ]);

    app.sendMessage("RESUMEN");

    const msg = app.lastMessage();

    expect(msg).toContain("Resumen BBVA Visa");
    expect(msg).not.toContain("Compra otra tarjeta");
    expect(msg).toContain("- No hay gastos propios");
    expect(msg).toContain("- No hay gastos ajenos");
    expect(msg).toContain("Total general ARS: $0,00");
  });

  test("ignora deudas con fecha posterior o igual al cierre", () => {
    const app = createGasTestRuntime();

    seedCards(app, [
      cardRow(app, {
        nombre: "BBVA Visa",
        ultimoCierre: new Date(2026, 5, 20, 12, 0, 0),
        id: "TAR-1"
      })
    ]);

    seedGastos(app, [
      gastoRow(app, {
        categoria: "Super",
        medio: "BBVA Visa",
        monto: 10000,
        detalle: "Antes del cierre",
        id: "GAS-ANTES"
      }),
      gastoRow(app, {
        categoria: "Super",
        medio: "BBVA Visa",
        monto: 99999,
        detalle: "Despues del cierre",
        id: "GAS-DESPUES"
      })
    ]);

    seedCardDebts(app, [
      cardDebtRow(app, {
        fecha: new Date(2026, 5, 19, 12, 0, 0),
        medio: "BBVA Visa",
        monto: 10000,
        cuotas: 1,
        cuotasRestantes: 1,
        detalle: "Antes del cierre",
        id: "DT-ANTES",
        gastoId: "GAS-ANTES"
      }),
      cardDebtRow(app, {
        fecha: new Date(2026, 5, 20, 12, 0, 0),
        medio: "BBVA Visa",
        monto: 99999,
        cuotas: 1,
        cuotasRestantes: 1,
        detalle: "Despues del cierre",
        id: "DT-DESPUES",
        gastoId: "GAS-DESPUES"
      })
    ]);

    app.sendMessage("RESUMEN");

    const msg = app.lastMessage();

    expect(msg).toContain("Antes del cierre");
    expect(msg).not.toContain("Despues del cierre");
    expect(msg).toContain("Total general ARS: $10.000,00");
  });

  test("ignora deudas con cuotas restantes en cero", () => {
    const app = createGasTestRuntime();

    seedCards(app, [
      cardRow(app, {
        nombre: "BBVA Visa",
        ultimoCierre: new Date(2026, 5, 20, 12, 0, 0),
        id: "TAR-1"
      })
    ]);

    seedGastos(app, [
      gastoRow(app, {
        categoria: "Super",
        medio: "BBVA Visa",
        monto: 99999,
        detalle: "Compra ya procesada",
        id: "GAS-1"
      })
    ]);

    seedCardDebts(app, [
      cardDebtRow(app, {
        medio: "BBVA Visa",
        monto: 99999,
        cuotas: 3,
        cuotasRestantes: 0,
        detalle: "Compra ya procesada",
        id: "DT-1",
        gastoId: "GAS-1"
      })
    ]);

    app.sendMessage("RESUMEN");

    const msg = app.lastMessage();

    expect(msg).not.toContain("Compra ya procesada");
    expect(msg).toContain("Total general ARS: $0,00");

    const [deudaTarjeta] = cardDebtsObjects(app);

    expect(deudaTarjeta["#CuotasRestantes"]).toBe(0);
  });

  test("si una deuda de tarjeta no tiene Gasto ID, avisa y no la incluye en totales", () => {
    const app = createGasTestRuntime();

    seedCards(app, [
      cardRow(app, {
        nombre: "BBVA Visa",
        ultimoCierre: new Date(2026, 5, 20, 12, 0, 0),
        id: "TAR-1"
      })
    ]);

    seedCardDebts(app, [
      cardDebtRow(app, {
        medio: "BBVA Visa",
        monto: 10000,
        cuotas: 1,
        cuotasRestantes: 1,
        detalle: "Deuda sin gasto id",
        id: "DT-1",
        gastoId: ""
      })
    ]);

    app.sendMessage("RESUMEN");

    const [warningMsg, summaryMsg] = app.lastMessages(2);

    expect(warningMsg).toContain("Hay una deuda de tarjeta sin Gasto ID");
    expect(warningMsg).toContain("BBVA Visa");
    expect(warningMsg).toContain("Deuda sin gasto id");

    expect(summaryMsg).toContain("Resumen BBVA Visa");
    expect(summaryMsg).not.toContain("Deuda sin gasto id");
    expect(summaryMsg).toContain("Total general ARS: $0,00");
  });

  test("si no encuentra el gasto vinculado, avisa y no incluye la deuda en totales", () => {
    const app = createGasTestRuntime();

    seedCards(app, [
      cardRow(app, {
        nombre: "BBVA Visa",
        ultimoCierre: new Date(2026, 5, 20, 12, 0, 0),
        id: "TAR-1"
      })
    ]);

    seedCardDebts(app, [
      cardDebtRow(app, {
        medio: "BBVA Visa",
        monto: 10000,
        cuotas: 1,
        cuotasRestantes: 1,
        detalle: "Deuda con gasto inexistente",
        id: "DT-1",
        gastoId: "GAS-NO-EXISTE"
      })
    ]);

    app.sendMessage("RESUMEN");

    const [warningMsg, summaryMsg] = app.lastMessages(2);

    expect(warningMsg).toContain("No encontré el gasto vinculado");
    expect(warningMsg).toContain("GAS-NO-EXISTE");
    expect(warningMsg).toContain("Deuda con gasto inexistente");

    expect(summaryMsg).toContain("Resumen BBVA Visa");
    expect(summaryMsg).not.toContain("Deuda con gasto inexistente");
    expect(summaryMsg).toContain("Total general ARS: $0,00");
  });

  test("si hay varias tarjetas, envía un resumen por cada una", () => {
    const app = createGasTestRuntime();

    seedCards(app, [
      cardRow(app, {
        nombre: "BBVA Visa",
        ultimoCierre: new Date(2026, 5, 20, 12, 0, 0),
        id: "TAR-1"
      }),
      cardRow(app, {
        nombre: "Galicia Mastercard",
        ultimoCierre: new Date(2026, 5, 20, 12, 0, 0),
        id: "TAR-2"
      })
    ]);

    seedGastos(app, [
      gastoRow(app, {
        categoria: "Super",
        medio: "BBVA Visa",
        monto: 12000,
        detalle: "Compra Visa",
        id: "GAS-VISA"
      }),
      gastoRow(app, {
        categoria: "Super",
        medio: "Galicia Mastercard",
        monto: 9000,
        detalle: "Compra Galicia",
        id: "GAS-GALICIA"
      })
    ]);

    seedCardDebts(app, [
      cardDebtRow(app, {
        medio: "BBVA Visa",
        monto: 12000,
        cuotas: 3,
        cuotasRestantes: 3,
        detalle: "Compra Visa",
        id: "DT-VISA",
        gastoId: "GAS-VISA"
      }),
      cardDebtRow(app, {
        medio: "Galicia Mastercard",
        monto: 9000,
        cuotas: 3,
        cuotasRestantes: 3,
        detalle: "Compra Galicia",
        id: "DT-GALICIA",
        gastoId: "GAS-GALICIA"
      })
    ]);

    app.sendMessage("RESUMEN");

    const messages = app.messages();

    expect(messages).toHaveLength(2);

    expect(messages[0]).toContain("Resumen BBVA Visa");
    expect(messages[0]).toContain("Compra Visa");
    expect(messages[0]).not.toContain("Compra Galicia");

    expect(messages[1]).toContain("Resumen Galicia Mastercard");
    expect(messages[1]).toContain("Compra Galicia");
    expect(messages[1]).not.toContain("Compra Visa");
  });

  test("si último vencimiento ya pasó, usa próximo cierre para el resumen", () => {
    const app = createGasTestRuntime();

    seedCards(app, [
      cardRow(app, {
        nombre: "BBVA Visa",
        ultimoCierre: new Date(2026, 5, 10, 12, 0, 0),
        ultimoVencimiento: new Date(2026, 5, 1, 12, 0, 0),
        proximoCierre: new Date(2026, 6, 20, 12, 0, 0),
        id: "TAR-1"
      })
    ]);

    seedGastos(app, [
      gastoRow(app, {
        categoria: "Super",
        medio: "BBVA Visa",
        monto: 10000,
        detalle: "Compra despues del ultimo cierre",
        id: "GAS-1"
      })
    ]);

    seedCardDebts(app, [
      cardDebtRow(app, {
        fecha: new Date(2026, 5, 15, 12, 0, 0),
        medio: "BBVA Visa",
        monto: 10000,
        cuotas: 1,
        cuotasRestantes: 1,
        detalle: "Compra despues del ultimo cierre",
        id: "DT-1",
        gastoId: "GAS-1"
      })
    ]);

    app.sendMessage("RESUMEN");

    const msg = app.lastMessage();

    expect(msg).toContain("Compra despues del ultimo cierre");
    expect(msg).toContain("Total general ARS: $10.000,00");
  });
});