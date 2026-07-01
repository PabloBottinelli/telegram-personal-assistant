import { describe, expect, test } from "vitest";
import { createGasTestRuntime } from "../gasTestRuntime.js";
import * as testUtils from "../testUtils.js";

describe("RESUMEN / Card Summary", () => {
  test("si no hay tarjetas cargadas, no envía resumen", () => {
    const app = createGasTestRuntime();

    app.sendMessage("RESUMEN");

    expect(app.messages()).toHaveLength(0);
  });

  test("si la tarjeta no tiene fecha de cierre determinable, avisa error", () => {
    const app = createGasTestRuntime();

    testUtils.seedTarjetas(app,  [["BBVA Visa", "", "", "", "", "TAR-1"]])

    app.sendMessage("RESUMEN");

    expect(app.lastMessage()).toContain("BBVA Visa");
    expect(app.lastMessage()).toContain("no pude determinar fecha de cierre");
  });

  test("si no hay deudas de tarjeta cargadas, envía resumen sin deudas", () => {
    const app = createGasTestRuntime();

    testUtils.seedTarjetasConCierre(app)

    app.sendMessage("RESUMEN");

    expect(app.lastMessage()).toContain("BBVA Visa");
    expect(app.lastMessage()).toContain("No hay deudas de tarjeta cargadas");
  });

  test("arma resumen con gastos ajenos separados de gastos propios", () => {
    const app = createGasTestRuntime();

    testUtils.seedCategorias(app)
    testUtils.seedDeudores(app)
    testUtils.seedTarjetasConCierre(app)

    testUtils.crearGastoConTarjetaDesdeBot(app, {
      catIndex: "2",
      ajeno: true,
      monto: "12000",
      cuotas: "3",
      detalle: "Compra ajena",
    })

    testUtils.crearGastoConTarjetaDesdeBot(app, {
      monto: "9000",
      cuotas: "3",
      detalle: "Compra propia",
    })

    app.sendMessage("RESUMEN");

    const msg = app.lastMessage();

    expect(msg).toContain("Gastos Ajenos:");
    expect(msg).toContain("Compra ajena");
    expect(msg).toContain("Total a pagar en pesos de cosas ajenas: $4.000,00");

    expect(msg).toContain("Gastos Propios:");
    expect(msg).toContain("Compra propia");
    expect(msg).toContain("Total a pagar en pesos de cosas propias: $3.000,00");

    expect(msg).toContain("Total general ARS: $7.000,00");
  });

  test("calcula totales en USD y ARS por separado", () => {
    const app = createGasTestRuntime();

    testUtils.seedCategorias(app)
    testUtils.seedDeudores(app)
    testUtils.seedTarjetasConCierre(app)

    testUtils.crearGastoConTarjetaDesdeBot(app, {
      catIndex: "2",
      ajeno: true,
      monto: "12000",
      cuotas: "3",
      detalle: "Compra ARS",
    })

    testUtils.crearGastoConTarjetaDesdeBot(app, {
      monto: "60",
      moneda: "USD",
      cuotas: "3",
      detalle: "Compra USD",
    })

    app.sendMessage("RESUMEN");

    const msg = app.lastMessage();

    expect(msg).toContain("Compra ARS");
    expect(msg).toContain("$4.000,00");

    expect(msg).toContain("Compra USD");
    expect(msg).toContain("20,00 USD");

    expect(msg).toContain("Total a pagar en usd de cosas propias: 20,00 USD");

    expect(msg).toContain("Total general USD: 20,00 USD");
  });

  test("ignora deudas con fecha posterior o igual al cierre", () => {
    const app = createGasTestRuntime();

    testUtils.seedTarjetasConCierre(app)
    testUtils.seedCategorias(app)
    
    testUtils.crearGastoConTarjetaDesdeBot(app, {
      fecha: "19/06",
      monto: "10000",
      detalle: "Antes del cierre",
    })

    testUtils.crearGastoConTarjetaDesdeBot(app, {
      fecha: "20/06",
      monto: "99999",
      detalle: "Despues del cierre",
    })

    app.sendMessage("RESUMEN");

    const msg = app.lastMessage();

    expect(msg).toContain("Antes del cierre");
    expect(msg).not.toContain("Despues del cierre");
    expect(msg).toContain("Total general ARS: $10.000,00");
  });

  test("ignora deudas con cuotas restantes en cero", () => {
    const app = createGasTestRuntime();

    testUtils.seedTarjetasConCierre(app)
    testUtils.seedCategorias(app)

    testUtils.appendRowsByConfig(app, "SHEET_CUOTAS", [
      [
        new Date(2026, 5, 10, 12, 0, 0), 
        "BBVA Visa",                      
        "ARS",                            
        99999,                            
        3,                                
        0,                               
        "Compra ya procesada",            
        "DT-1",                           
        "GAS-1"                           
      ]
    ]);

    app.sendMessage("RESUMEN");

    const msg = app.lastMessage();

    expect(msg).not.toContain("Compra ya procesada");
    expect(msg).toContain("Total general ARS: $0,00");

    const deudaTarjeta = testUtils.sheetObjects(app, "SHEET_CUOTAS")[0];

    expect(deudaTarjeta["#CuotasRestantes"]).toBe(0);
  });

  test("si una deuda de tarjeta no tiene Gasto ID, avisa y no la incluye en totales", () => {
    const app = createGasTestRuntime();

    testUtils.seedTarjetasConCierre(app)
    testUtils.seedCategorias(app)

    testUtils.appendRowsByConfig(app, "SHEET_CUOTAS", [
      [
        new Date(2026, 5, 10, 12, 0, 0), 
        "BBVA Visa",                      
        "ARS",                            
        10000,                            
        1,                                
        1,                               
        "Deuda sin gasto id",            
        "DT-1",                           
        ""                           
      ]
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

    testUtils.seedTarjetasConCierre(app)
    testUtils.seedCategorias(app)

    testUtils.appendRowsByConfig(app, "SHEET_CUOTAS", [
      [
        new Date(2026, 5, 10, 12, 0, 0), 
        "BBVA Visa",                      
        "ARS",                            
        10000,                            
        1,                                
        1,                               
        "Deuda con gasto inexistente",            
        "DT-1",                           
        "GAS-NO-EXISTE"                           
      ]
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

    testUtils.appendRowsByConfig(app, "SHEET_TARJETAS", [["BBVA Visa", new Date(2026, 5, 20, 12, 0, 0), "", "", "", "TAR-2"],["Galicia Mastercard", new Date(2026, 5, 20, 12, 0, 0), "", "", "", "TAR-2"]])
    testUtils.seedCategorias(app)

    testUtils.crearGastoConTarjetaDesdeBot(app, {
      monto: "12000",
      detalle: "Compra Visa",
      cuotas: "3"
    })

    testUtils.crearGastoConTarjetaDesdeBot(app, {
      monto: "9000",
      detalle: "Compra Galicia",
      cuotas: "3",
      medioIndex: "2"
    })

    app.sendMessage("RESUMEN");

    const [primerResumen, segundoResumen] = app.lastMessages(2);

    expect(primerResumen).toContain("Resumen BBVA Visa");
    expect(primerResumen).toContain("Compra Visa");
    expect(primerResumen).not.toContain("Compra Galicia");

    expect(segundoResumen).toContain("Resumen Galicia Mastercard");
    expect(segundoResumen).toContain("Compra Galicia");
    expect(segundoResumen).not.toContain("Compra Visa");
  });

  test("si último vencimiento ya pasó, usa próximo cierre para el resumen", () => {
    const app = createGasTestRuntime();
    
    testUtils.appendRowsByConfig(app, "SHEET_TARJETAS", [["BBVA Visa", new Date(2026, 5, 20, 12, 0, 0), new Date(2026, 5, 1, 12, 0, 0), new Date(2026, 6, 20, 12, 0, 0), "", "TAR-2"]])
    testUtils.seedCategorias(app)

    testUtils.crearGastoConTarjetaDesdeBot(app, {
      fecha: "15/06",
      monto: "10000",
      detalle: "Compra despues del ultimo cierre",
    })

    app.sendMessage("RESUMEN");

    const msg = app.lastMessage();

    expect(msg).toContain("Compra despues del ultimo cierre");
    expect(msg).toContain("Total general ARS: $10.000,00");
  });
});