import { describe, expect, test } from "vitest";
import { createGasTestRuntime } from "../gasTestRuntime.js";
import * as testUtils from "../testUtils.js";

describe("CardStatement", () => {
  // Errores y avisos
  test.todo("Si no hay tarjetas cargadas, responde avisandolo", () => {
    expect(false).toBe(true)
  });

  test("Si la tarjeta no tiene fecha de cierre determinable, lo avisa", () => {
    const app = createGasTestRuntime();

    testUtils.seedTarjetas(app, [["BBVA Visa", "", "", "", "", "TAR-1"]])

    app.sendMessage("RESUMEN");

    expect(app.lastMessage()).toContain("BBVA Visa");
    expect(app.lastMessage()).toContain("no pude determinar fecha de cierre");
  });

  test("Si no hay deudas de tarjeta cargadas, lo avisa", () => {
    const app = createGasTestRuntime();

    testUtils.seedTarjetasConCierre(app)

    app.sendMessage("RESUMEN");

    expect(app.lastMessage()).toContain("BBVA Visa");
    expect(app.lastMessage()).toContain("No hay deudas de tarjeta cargadas");
  });
  
  test("Si una deuda de tarjeta no tiene Gasto ID, avisa y no la incluye en totales", () => {
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
  }); // revisar

  test("Si no encuentra el gasto vinculado, avisa y no incluye la deuda en totales", () => {
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
  }); // revisar

  // Periodos

  test("Muestra el detalle y totales solo del periodo correspondiente, salvo que sea un gasto viejo con cuotas restantes", () => {
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
      detalle: "Mismo dia que el cierre",
    })

    app.sendMessage("RESUMEN");

    const msg = app.lastMessage();

    expect(msg).toContain("Antes del cierre");
    expect(msg).not.toContain("Mismo dia que el cierre");
    expect(msg).toContain("Total general ARS: $10.000,00");
  });

  test("Si el último vencimiento todavía no pasó, usa el último cierre", () => {
    expect(false).toBe(true)
  });

  test("Si el último vencimiento pasó y no hay próximo cierre, avisa que no puede determinarlo", () => {
    expect(false).toBe(true)
  });

  test("Si último vencimiento ya pasó, usa próximo cierre para el resumen", () => {
    const app = createGasTestRuntime();

    testUtils.appendRowsByConfig(app, "SHEET_TARJETAS", [["BBVA Visa", new Date(2026, 5, 20, 12, 0, 0), new Date(2026, 5, 1, 12, 0, 0), new Date(2026, 6, 20, 12, 0, 0), "", "TAR-2"]])
    testUtils.seedCategorias(app)

    testUtils.crearGastoConTarjetaDesdeBot(app, {
      fecha: "25/06",
      monto: "10000",
      detalle: "Compra despues del ultimo cierre",
    })

    testUtils.crearGastoConTarjetaDesdeBot(app, {
      fecha: "21/07",
      monto: "10000",
      detalle: "Compra posterior al proximo cierre",
    })

    app.sendMessage("RESUMEN");

    const msg = app.lastMessage();

    expect(msg).toContain("Compra despues del ultimo cierre");
    expect(msg).toContain("Total general ARS: $10.000,00");
  });

  // Cuotas y totales

  test("Muestra correctamente los totales general y futuros", () => {
    expect(false).toBe(true)
  });

  test("Muestra correctamente el total a pagar en este periodo", () => {
    expect(false).toBe(true)
  });

  test("Muestra correctamente la cuota actual y totales de cada gasto", () => {
    expect(false).toBe(true)
  });

  test("Ignora deudas con cuotas restantes en cero", () => {
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

  test("Calcula la cuota y los totales usando el monto neto después del descuento", () => {
    expect(false).toBe(true)
  });

  // Clasificación y monedas

  test("Separa correctamente los gastos propios de los ajenos", () => {
    expect(false).toBe(true)
  }); // sacar el aviso de cuando aun no te devolvieron plata

  test("Muestra usd o ars segun corresponda para cada transaccion o total", () => {
    expect(false).toBe(true)
  });

  // Otros

  test("Si hay varias tarjetas, envía un resumen por cada una", () => {
    const app = createGasTestRuntime();

    testUtils.appendRowsByConfig(app, "SHEET_TARJETAS", [["BBVA Visa", new Date(2026, 5, 20, 12, 0, 0), "", "", "", "TAR-2"], ["Galicia Mastercard", new Date(2026, 5, 20, 12, 0, 0), "", "", "", "TAR-3"]])
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

});