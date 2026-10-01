import { describe, expect, test, vi } from "vitest";
import { createGasTestRuntime } from "../gasTestRuntime.js";
import * as testUtils from "../testUtils.js";

describe("Card Statement", () => {
  // Errores y avisos
  test("Si no hay tarjetas cargadas, responde avisandolo", () => {
    const app = createGasTestRuntime();

    app.sendMessage("RESUMEN")

    expect(app.lastMessage()).toContain("No hay tarjetas cargadas")
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
    expect(app.lastMessage()).toContain("No hay gastos para esta tarjeta");
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
    expect(summaryMsg).toContain("Total resumen actual (ARS): $0,00");
  });

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
    expect(summaryMsg).toContain("Total resumen actual (ARS): $0,00");
  });

  // Periodos

  test("Muestra todo los gastos con cuotas pendientes anteriores al cierre correspondiente", () => {
    const app = createGasTestRuntime();

    testUtils.seedTarjetasConCierre(app)
    testUtils.seedCategorias(app)

    testUtils.crearGastoConTarjetaDesdeBot(app, {
      fecha: "19/04",
      monto: "10000",
      detalle: "Mucho antes del cierre",
    })

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

    testUtils.crearGastoConTarjetaDesdeBot(app, {
      fecha: "27/06",
      monto: "99999",
      detalle: "Posterior al dia del cierre",
    })

    app.sendMessage("RESUMEN");

    const msg = app.lastMessage();

    expect(msg).toContain("Antes del cierre");
    expect(msg).toContain("Mucho antes del cierre");
    expect(msg).not.toContain("Mismo dia que el cierre");
    expect(msg).not.toContain("Posterior al dia del cierre");
    expect(msg).toContain("Total resumen actual (ARS): $20.000,00");
  });

  test("Si el último vencimiento todavía no pasó, usa el último cierre", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 25, 12, 0, 0)); // 25/06

    const app = createGasTestRuntime();

    testUtils.appendRowsByConfig(app, "SHEET_TARJETAS", [
      [
        "BBVA Visa",
        new Date(2026, 5, 20, 12, 0, 0), // Último cierre: 20/06
        new Date(2026, 5, 30, 12, 0, 0), // Último vencimiento: 30/06
        new Date(2026, 6, 20, 12, 0, 0), // Próximo cierre: 20/07
        new Date(2026, 6, 30, 12, 0, 0), // Próximo vencimiento: 30/07
        "TAR-1"
      ]
    ]);

    testUtils.seedCategorias(app);

    testUtils.crearGastoConTarjetaDesdeBot(app, {
      fecha: "15/06",
      monto: "10000",
      detalle: "Compra antes del último cierre"
    });

    testUtils.crearGastoConTarjetaDesdeBot(app, {
      fecha: "25/06",
      monto: "20000",
      detalle: "Compra después del último cierre"
    });

    app.sendMessage("RESUMEN");

    const msg = app.lastMessage();

    expect(msg).toContain("Compra antes del último cierre");
    expect(msg).not.toContain("Compra después del último cierre");
    expect(msg).toContain("Total resumen actual (ARS): $10.000,00");

    vi.useRealTimers();
  });

  test("Si el último vencimiento pasó y no hay próximo cierre, avisa que no puede determinarlo", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 25, 12, 0, 0)); // 25/06

    const app = createGasTestRuntime();

    testUtils.appendRowsByConfig(app, "SHEET_TARJETAS", [
      [
        "BBVA Visa",
        new Date(2026, 5, 20, 12, 0, 0), // Último cierre: 20/06
        new Date(2026, 5, 24, 12, 0, 0), // Último vencimiento: 24/06
        "",
        "",
        "TAR-1"
      ]
    ]);

    testUtils.seedCategorias(app);

    testUtils.crearGastoConTarjetaDesdeBot(app, {
      fecha: "15/06",
      monto: "10000",
      detalle: "Compra antes del último cierre"
    });

    testUtils.crearGastoConTarjetaDesdeBot(app, {
      fecha: "25/06",
      monto: "20000",
      detalle: "Compra después del último cierre"
    });

    app.sendMessage("RESUMEN");

    const msg = app.lastMessage();

    expect(msg).toContain("no pude determinar fecha de cierre para el resumen.");
    expect(msg).not.toContain("Total resumen actual");


    vi.useRealTimers();
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
    expect(msg).toContain("Total resumen actual (ARS):");
  });

  // Cuotas y totales

  test("Muestra correctamente los totales para el resumen actual y futuro con gastos ajenos y propios", () => {
    const app = createGasTestRuntime();

    testUtils.seedTarjetasConCierre(app)
    testUtils.seedCategorias(app)
    testUtils.seedDeudores(app)

    testUtils.crearGastoConTarjetaDesdeBot(app, {
      fecha: "19/04",
      monto: "9000",
      detalle: "Mucho antes del cierre",
      cuotas: "3"
    })

    testUtils.crearGastoConTarjetaDesdeBot(app, {
      fecha: "19/06",
      monto: "10000",
      detalle: "Antes del cierre",
    })

    testUtils.crearGastoConTarjetaDesdeBot(app, {
      fecha: "12/06",
      monto: "10000",
      detalle: "Ajeno antes del cierre",
      catIndex: "2",
      ajeno: true
    })

    testUtils.crearGastoConTarjetaDesdeBot(app, {
      fecha: "19/07",
      monto: "10000",
      detalle: "Despues del cierre",
    })

    testUtils.crearGastoConTarjetaDesdeBot(app, {
      fecha: "19/07",
      monto: "10000",
      detalle: "Ajeno despues del cierre",
      catIndex: "2",
      ajeno: true
    })

    app.sendMessage("RESUMEN");

    const msg = app.lastMessage();

    expect(msg).toContain("Antes del cierre");
    expect(msg).toContain("Mucho antes del cierre");
    expect(msg).not.toContain("Despues del cierre");

    expect(msg).toContain("Total resumen actual (Ajeno USD): 0,00 USD");
    expect(msg).toContain("Total resumen actual (Ajeno ARS): $10.000,00");

    expect(msg).toContain("Total resumen actual (USD): 0,00 USD");
    expect(msg).toContain("Total resumen actual (ARS): $13.000,00");

    expect(msg).toContain("Total próximos resumenes (Ajeno USD): 0,00 USD");
    expect(msg).toContain("Total próximos resumenes (Ajeno ARS): $10.000,00");

    expect(msg).toContain("Total próximos resumenes (USD): 0,00 USD");
    expect(msg).toContain("Total próximos resumenes (ARS): $16.000,00");
  });

  test("Muestra correctamente la cuota actual y totales de cada gasto", () => {
    const app = createGasTestRuntime();

    testUtils.seedTarjetasConCierre(app);

    testUtils.appendRowsByConfig(app, "SHEET_GASTOS", [
      [
        new Date(2026, 5, 10, 12, 0, 0),
        "Comida",
        "BBVA Visa",
        12000,
        "ARS",
        0,
        "Compra recién iniciada",
        "-",
        true,
        "GAS-1"
      ],
      [
        new Date(2026, 5, 12, 12, 0, 0),
        "Comida",
        "BBVA Visa",
        18000,
        "ARS",
        0,
        "Compra con cuotas avanzadas",
        "-",
        true,
        "GAS-2"
      ]
    ]);

    testUtils.appendRowsByConfig(app, "SHEET_CUOTAS", [
      [
        new Date(2026, 5, 10, 12, 0, 0),
        "BBVA Visa",
        "ARS",
        12000,
        6,
        6,
        "Compra recién iniciada",
        "DT-1",
        "GAS-1"
      ],
      [
        new Date(2026, 5, 12, 12, 0, 0),
        "BBVA Visa",
        "ARS",
        18000,
        6,
        4,
        "Compra con cuotas avanzadas",
        "DT-2",
        "GAS-2"
      ]
    ]);

    app.sendMessage("RESUMEN");

    const msg = app.lastMessage();

    expect(msg).toContain("(1/6) 10/06/2026 · $2.000,00 · Compra recién iniciada");
    expect(msg).toContain("(3/6) 12/06/2026 · $3.000,00 · Compra con cuotas avanzadas");
    expect(msg).toContain("Total resumen actual (ARS): $5.000,00");
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

    expect(msg).toContain("No hay gastos para esta tarjeta.");

    const deudaTarjeta = testUtils.sheetObjects(app, "SHEET_CUOTAS")[0];

    expect(deudaTarjeta["#CuotasRestantes"]).toBe(0);
  });

  test("Calcula la cuota y los totales usando el monto neto después del descuento", () => {
    const app = createGasTestRuntime();

    testUtils.seedTarjetasConCierre(app);

    testUtils.appendRowsByConfig(app, "SHEET_GASTOS", [
      [
        new Date(2026, 5, 10, 12, 0, 0),
        "Comida",
        "BBVA Visa",
        12000,
        "ARS",
        1500,
        "Compra con descuento",
        "D",
        true,
        "GAS-1"
      ]
    ]);

    testUtils.appendRowsByConfig(app, "SHEET_CUOTAS", [
      [
        new Date(2026, 5, 10, 12, 0, 0),
        "BBVA Visa",
        "ARS",
        10500,
        3,
        3,
        "Compra con descuento",
        "DT-1",
        "GAS-1"
      ]
    ]);

    app.sendMessage("RESUMEN");

    const msg = app.lastMessage();

    expect(msg).toContain("(1/3) 10/06/2026 · $3.500,00 · Compra con descuento");
    expect(msg).toContain("Total resumen actual (ARS): $3.500,00");
    expect(msg).not.toContain("$4.000,00");
  });

  // Clasificación y monedas

  test("Separa correctamente los gastos propios de los ajenos", () => {
    const app = createGasTestRuntime();

    testUtils.seedTarjetasConCierre(app);

    testUtils.appendRowsByConfig(app, "SHEET_GASTOS", [
      [new Date(2026, 5, 10, 12, 0, 0), "Comida", "BBVA Visa", 12000, "ARS", 0, "Compra propia", "-", true, "GAS-1"],
      [new Date(2026, 5, 12, 12, 0, 0), "Ajeno", "BBVA Visa", 6000, "ARS", 0, "Compra ajena", "-", true, "GAS-2"]
    ]);

    testUtils.appendRowsByConfig(app, "SHEET_CUOTAS", [
      [new Date(2026, 5, 10, 12, 0, 0), "BBVA Visa", "ARS", 12000, 3, 3, "Compra propia", "DT-1", "GAS-1"],
      [new Date(2026, 5, 12, 12, 0, 0), "BBVA Visa", "ARS", 6000, 2, 2, "Compra ajena", "DT-2", "GAS-2"]
    ]);

    app.sendMessage("RESUMEN");

    const msg = app.lastMessage();
    const foreignSection = msg.slice(msg.indexOf("Gastos Ajenos:"), msg.indexOf("Gastos Propios:"));
    const ownSection = msg.slice(msg.indexOf("Gastos Propios:"));

    expect(foreignSection).toContain("Compra ajena");
    expect(foreignSection).not.toContain("Compra propia");
    expect(ownSection).toContain("Compra propia");
    expect(ownSection).not.toContain("Compra ajena");
    expect(msg).toContain("Total resumen actual (Ajeno ARS): $3.000,00");
    expect(msg).toContain("Total resumen actual (ARS): $4.000,00");
  });

  test("Muestra USD o ARS según corresponda para cada transacción y total", () => {
    const app = createGasTestRuntime();

    testUtils.seedTarjetasConCierre(app);

    testUtils.appendRowsByConfig(app, "SHEET_GASTOS", [
      [new Date(2026, 5, 10, 12, 0, 0), "Comida", "BBVA Visa", 12000, "ARS", 0, "Compra en pesos", "-", true, "GAS-1"],
      [new Date(2026, 5, 12, 12, 0, 0), "Comida", "BBVA Visa", 600, "USD", 0, "Compra en dólares", "-", true, "GAS-2"]
    ]);

    testUtils.appendRowsByConfig(app, "SHEET_CUOTAS", [
      [new Date(2026, 5, 10, 12, 0, 0), "BBVA Visa", "ARS", 12000, 3, 3, "Compra en pesos", "DT-1", "GAS-1"],
      [new Date(2026, 5, 12, 12, 0, 0), "BBVA Visa", "USD", 600, 3, 3, "Compra en dólares", "DT-2", "GAS-2"]
    ]);

    app.sendMessage("RESUMEN");

    const msg = app.lastMessage();

    expect(msg).toContain("(1/3) 10/06/2026 · $4.000,00 · Compra en pesos");
    expect(msg).toContain("(1/3) 12/06/2026 · 200,00 USD · Compra en dólares");
    expect(msg).toContain("Total resumen actual (ARS): $4.000,00");
    expect(msg).toContain("Total resumen actual (USD): 200,00 USD");
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