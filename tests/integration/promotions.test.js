import { describe, expect, test } from "vitest";
import { createGasTestRuntime } from "../gasTestRuntime.js";
import * as testUtils from "../testUtils.js";


function viamoPromotion() {
  return {
    source: "galicia",
    source_id: "170826",
    title: "Viamo",
    merchant: "Viamo",
    category: "Indumentaria",
    promotion_url: "https://www.galicia.ar/personas/buscador-de-promociones?path=%2Fpromocion%2F170826%7CViamo%7CMarca",
    discount_percentage: 20,
    installments: 3,
    valid_from: "2026-07-03",
    valid_to: "2026-12-31",
    days_of_week: ["friday"],
    cap_amount: null,
    minimum_purchase: null,
    payment_methods: [
      {
        network: "visa",
        raw_name: "Tarjeta Visa",
        card_type: "credit"
      }
    ],
    online: true,
    physical: true,
    qr: false,
    nfc: false,
    contactless: false,
    customer_segments: []
  };
}


describe("PROMOS", () => {
  test("busca promociones usando las palabras de la segunda línea", () => {
    const app = createGasTestRuntime();
    const service = testUtils.getGlobal(app, "PromotionsService");

    let receivedQuery = null;
    let receivedLimit = null;

    service.search = (query, limit) => {
      receivedQuery = query;
      receivedLimit = limit;

      return [viamoPromotion()];
    };

    app.sendMessage("PROMOS\nviamo visa");

    expect(receivedQuery).toBe("viamo visa");
    expect(receivedLimit).toBe(10);
  });

  test("formatea correctamente una promoción encontrada", () => {
    const app = createGasTestRuntime();
    const service = testUtils.getGlobal(app, "PromotionsService");

    service.search = () => [viamoPromotion()];

    app.sendMessage("PROMOS\nviamo visa");

    const message = app.lastMessage();

    expect(message).toContain("1. Viamo");
    expect(message).toContain("20% de descuento");
    expect(message).toContain("Hasta 3 cuotas sin interés");
    expect(message).toContain("Categoría: Indumentaria");
    expect(message).toContain("Medios de pago: Visa crédito");
    expect(message).toContain("Días: viernes");
    expect(message).toContain("Canales: online, presencial");
    expect(message).toContain("Vigencia: del 03/07/2026 al 31/12/2026");
    expect(message).toContain("Promo: https://www.galicia.ar/personas/buscador-de-promociones");
    expect(message).toContain("Banco: Galicia");
  });

  test("muestra el link de la promoción", () => {
    const app = createGasTestRuntime();
    const service = testUtils.getGlobal(app, "PromotionsService");

    service.search = () => [viamoPromotion()];

    app.sendMessage("PROMOS\nviamo");

    expect(app.lastMessage()).toContain(
      "Promo: https://www.galicia.ar/personas/buscador-de-promociones?path=%2Fpromocion%2F170826%7CViamo%7CMarca"
    );
  });

  test("no muestra el link cuando promotion_url no existe", () => {
    const app = createGasTestRuntime();
    const service = testUtils.getGlobal(app, "PromotionsService");

    const promotion = {
      ...viamoPromotion(),
      promotion_url: null
    };

    service.search = () => [promotion];

    app.sendMessage("PROMOS\nviamo");

    expect(app.lastMessage()).not.toContain("Promo:");
  });

  test("no repite el comercio cuando merchant y title son iguales", () => {
    const app = createGasTestRuntime();
    const service = testUtils.getGlobal(app, "PromotionsService");

    service.search = () => [viamoPromotion()];

    app.sendMessage("PROMOS\nviamo");

    expect(app.lastMessage()).not.toContain("Comercio: Viamo");
  });

  test("muestra el comercio cuando merchant y title son distintos", () => {
    const app = createGasTestRuntime();
    const service = testUtils.getGlobal(app, "PromotionsService");

    const promotion = {
      ...viamoPromotion(),
      title: "20% de ahorro"
    };

    service.search = () => [promotion];

    app.sendMessage("PROMOS\nviamo");

    expect(app.lastMessage()).toContain("Comercio: Viamo");
  });

  test("informa cuando no encuentra promociones", () => {
    const app = createGasTestRuntime();
    const service = testUtils.getGlobal(app, "PromotionsService");

    service.search = () => [];

    app.sendMessage("PROMOS\ncomercio inexistente");

    expect(app.lastMessage()).toBe("No encontré promociones activas para esa búsqueda.");
  });

  test("PROMOS sin palabras clave devuelve error de formato", () => {
    const app = createGasTestRuntime();

    app.sendMessage("PROMOS");

    const message = app.lastMessage();

    expect(message).toContain("El formato es incorrecto.");
    expect(message).toContain("PROMOS");
    expect(message).toContain("Palabras clave");
  });

  test("muestra tope y compra mínima cuando existen", () => {
    const app = createGasTestRuntime();
    const service = testUtils.getGlobal(app, "PromotionsService");

    const promotion = {
      ...viamoPromotion(),
      cap_amount: 15000,
      minimum_purchase: 30000
    };

    service.search = () => [promotion];

    app.sendMessage("PROMOS\nviamo");

    const message = app.lastMessage();

    expect(message).toContain("Tope: $");
    expect(message).toContain("15");
    expect(message).toContain("Compra mínima: $");
    expect(message).toContain("30");
  });

  test("traduce varios días al español", () => {
    const app = createGasTestRuntime();
    const service = testUtils.getGlobal(app, "PromotionsService");

    const promotion = {
      ...viamoPromotion(),
      days_of_week: ["monday", "wednesday", "friday"]
    };

    service.search = () => [promotion];

    app.sendMessage("PROMOS\nviamo");

    expect(app.lastMessage()).toContain("Días: lunes, miércoles, viernes");
  });

  test("formatea distintos métodos de pago", () => {
    const app = createGasTestRuntime();
    const service = testUtils.getGlobal(app, "PromotionsService");

    const promotion = {
      ...viamoPromotion(),
      payment_methods: [
        {
          network: "visa",
          raw_name: "Tarjeta Visa",
          card_type: "credit"
        },
        {
          network: "mastercard",
          raw_name: "Tarjeta Mastercard",
          card_type: "debit"
        }
      ]
    };

    service.search = () => [promotion];

    app.sendMessage("PROMOS\nviamo");

    expect(app.lastMessage()).toContain("Medios de pago: Visa crédito, Mastercard débito");
  });
});