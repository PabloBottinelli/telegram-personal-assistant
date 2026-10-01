import { describe, expect, test, vi } from "vitest";
import { createGasTestRuntime } from "../gasTestRuntime.js";
import * as testUtils from "../testUtils.js";

describe("Triggers", () => {
  describe("BestCardTrigger", () => {
    test("Si no hay tarjetas avisa que no hay tarjetas", () => {
      const app = createGasTestRuntime();

      testUtils.runTrigger(app, "BestCardTrigger");

      expect(app.lastMessage()).toContain("Mejor tarjeta: (no hay tarjetas)");
    });

    test("Elige la tarjeta elegible con vencimiento más lejano", () => {
      const app = createGasTestRuntime();

      const ayer = testUtils.dateNoon({ daysFromToday: -1 });
      const mañana = testUtils.dateNoon({ daysFromToday: 1 });
      const en10Dias = testUtils.dateNoon({ daysFromToday: 10 });
      const en20Dias = testUtils.dateNoon({ daysFromToday: 20 });

      testUtils.seedTarjetas(app, [
        testUtils.tarjetaRow(app, {
          nombre: "BBVA Visa",
          ultimoCierre: ayer,
          ultimoVencimiento: mañana,
          proximoCierre: en10Dias,
          proximoVencimiento: en10Dias,
          id: "TAR-1"
        }),
        testUtils.tarjetaRow(app, {
          nombre: "Galicia Mastercard",
          ultimoCierre: ayer,
          ultimoVencimiento: mañana,
          proximoCierre: en20Dias,
          proximoVencimiento: en20Dias,
          id: "TAR-2"
        })
      ]);

      testUtils.runTrigger(app, "BestCardTrigger");

      expect(app.lastMessage()).toContain("Mejor tarjeta: Galicia Mastercard");
    });

    test("Avisa tarjetas con información incompleta", () => {
      const app = createGasTestRuntime();

      const ayer = testUtils.dateNoon({ daysFromToday: -1 });
      const en10Dias = testUtils.dateNoon({ daysFromToday: 10 });

      testUtils.seedTarjetas(app, [
        testUtils.tarjetaRow(app, {
          nombre: "BBVA Visa",
          ultimoCierre: ayer,
          ultimoVencimiento: en10Dias,
          proximoCierre: en10Dias,
          proximoVencimiento: en10Dias,
          id: "TAR-1"
        }),
        testUtils.tarjetaRow(app, {
          nombre: "Tarjeta incompleta",
          ultimoCierre: ayer,
          ultimoVencimiento: "",
          proximoCierre: "",
          proximoVencimiento: en10Dias,
          id: "TAR-2"
        })
      ]);

      testUtils.runTrigger(app, "BestCardTrigger");

      const msg = app.lastMessage();

      expect(msg).toContain("Mejor tarjeta: BBVA Visa");
      expect(msg).toContain("Falta actualizar información de la tarjeta: Tarjeta incompleta");
    });

    test("Si ninguna tarjeta es elegible avisa que no hay tarjeta elegible", () => {
      const app = createGasTestRuntime();

      const manana = testUtils.dateNoon({ daysFromToday: 1 });
      const en10Dias = testUtils.dateNoon({ daysFromToday: 10 });

      testUtils.seedTarjetas(app, [
        testUtils.tarjetaRow(app, {
          nombre: "BBVA Visa",
          ultimoCierre: manana,
          ultimoVencimiento: en10Dias,
          proximoCierre: en10Dias,
          proximoVencimiento: en10Dias,
          id: "TAR-1"
        })
      ]);

      testUtils.runTrigger(app, "BestCardTrigger");

      expect(app.lastMessage()).toContain("Mejor tarjeta: (sin tarjeta elegible hoy)");
    });
  });

  describe("RefundsTrigger", () => {
    test("si no hay gastos no manda mensaje", () => {
      const app = createGasTestRuntime();

      testUtils.runTrigger(app, "RefundsTrigger");

      expect(app.messages()).toHaveLength(0);
    });

    test("si hay gastos pero no hay reintegros pendientes manda mensaje de no pendientes", () => {
      const app = createGasTestRuntime();

      testUtils.seedGastos(app, [
        testUtils.gastoRow(app, {
          fecha: testUtils.dateNoon(),
          categoria: "Comida",
          medio: "Efectivo",
          monto: 10000,
          moneda: "ARS",
          ahorro: 0,
          detalle: "Gasto normal",
          tipo: "-",
          reintegrado: true,
          id: "GAS-1"
        })
      ]);

      testUtils.runTrigger(app, "RefundsTrigger");

      expect(app.lastMessage()).toContain("No hay reintegros pendientes");
    });

    test("Lista solo reintegros pendientes reales", () => {
      const app = createGasTestRuntime();

      testUtils.seedGastos(app, [
        testUtils.gastoRow(app, {
          fecha: testUtils.dateNoon({ daysFromToday: -2 }),
          categoria: "Comida",
          medio: "Galicia",
          monto: 10000,
          moneda: "ARS",
          ahorro: 2000,
          detalle: "Promo reintegro pendiente",
          tipo: "R",
          reintegrado: false,
          id: "GAS-1"
        }),
        testUtils.gastoRow(app, {
          fecha: testUtils.dateNoon({ daysFromToday: -2 }),
          categoria: "Comida",
          medio: "BBVA",
          monto: 10000,
          moneda: "ARS",
          ahorro: 3000,
          detalle: "Promo ya reintegrada",
          tipo: "R",
          reintegrado: true,
          id: "GAS-2"
        }),
        testUtils.gastoRow(app, {
          fecha: testUtils.dateNoon({ daysFromToday: -2 }),
          categoria: "Comida",
          medio: "Modo",
          monto: 10000,
          moneda: "ARS",
          ahorro: 1500,
          detalle: "Descuento no reintegro",
          tipo: "D",
          reintegrado: false,
          id: "GAS-3"
        })
      ]);

      testUtils.runTrigger(app, "RefundsTrigger");

      const msg = app.lastMessage();

      expect(msg).toContain("Galicia te debe");
      expect(msg).toContain("Promo reintegro pendiente");

      expect(msg).not.toContain("Promo ya reintegrada");
      expect(msg).not.toContain("Descuento no reintegro");
    });
  });

  describe("CardsMaintenanceTrigger", () => {
    test("mueve próximo cierre vencido a último cierre, limpia próximos y envía resumen", () => {
      const app = createGasTestRuntime();

      const cierrePasado = testUtils.dateNoon({ daysFromToday: -1 });
      const vencimientoPasado = testUtils.dateNoon({ daysFromToday: -1 });
      const cierreViejo = testUtils.dateNoon({ daysFromToday: -40 });
      const vencimientoViejo = testUtils.dateNoon({ daysFromToday: -30 });

      testUtils.seedTarjetas(app, [
        testUtils.tarjetaRow(app, {
          nombre: "BBVA Visa",
          ultimoCierre: cierreViejo,
          ultimoVencimiento: vencimientoViejo,
          proximoCierre: cierrePasado,
          proximoVencimiento: vencimientoPasado,
          id: "TAR-1"
        })
      ]);

      testUtils.runTrigger(app, "CardsMaintenanceTrigger");

      const tarjeta = testUtils.sheetObjects(app, "SHEET_TARJETAS")[0];

      expect(tarjeta["Tarjeta de crédito"]).toBe("BBVA Visa");
      expect(tarjeta["Último cierre"]).toEqual(cierrePasado);
      expect(tarjeta["Último vencimiento"]).toEqual(vencimientoPasado);
      expect(tarjeta["Próximo Cierre"]).toBe("");
      expect(tarjeta["Próximo Vencimiento"]).toBe("");

      expect(app.lastMessage()).toContain("Resumen BBVA Visa");
      expect(app.lastMessage()).toContain("No hay gastos para esta tarjeta.");
    });

    test("No mueve tarjeta si próximo cierre es hoy o futuro", () => {
      const app = createGasTestRuntime();

      const hoy = testUtils.dateNoon();
      const en10Dias = testUtils.dateNoon({ daysFromToday: 10 });
      const cierreViejo = testUtils.dateNoon({ daysFromToday: -40 });
      const vencimientoViejo = testUtils.dateNoon({ daysFromToday: -30 });

      testUtils.seedTarjetas(app, [
        testUtils.tarjetaRow(app, {
          nombre: "BBVA Visa",
          ultimoCierre: cierreViejo,
          ultimoVencimiento: vencimientoViejo,
          proximoCierre: hoy,
          proximoVencimiento: en10Dias,
          id: "TAR-1"
        })
      ]);

      testUtils.runTrigger(app, "CardsMaintenanceTrigger");

      const tarjeta = testUtils.sheetObjects(app, "SHEET_TARJETAS")[0];

      expect(tarjeta["Último cierre"]).toEqual(cierreViejo);
      expect(tarjeta["Último vencimiento"]).toEqual(vencimientoViejo);
      expect(tarjeta["Próximo Cierre"]).toEqual(hoy);
      expect(tarjeta["Próximo Vencimiento"]).toEqual(en10Dias);

      expect(app.messages()).toHaveLength(0);
    });
  });

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
});