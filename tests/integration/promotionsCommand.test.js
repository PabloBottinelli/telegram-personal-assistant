import { describe, expect, test } from "vitest";
import { createGasTestRuntime } from "../gasTestRuntime.js";
import * as testUtils from "../testUtils.js";

function viamoPromotion() {
  return {
    source: "galicia",
    source_id: "170826",
    title: "Descuento en Viamo",
    merchant: "Viamo",
    promotion_url: "https://www.galicia.ar/personas/buscador-de-promociones?path=%2Fpromocion%2F170826%7CViamo%7CMarca",
    benefits: [
      { type: "discount", percentage: "20" },
      { type: "installments", installment_options: [3], interest_free: true }
    ],
    limits: [
      { type: "monetary_cap", amount: "15000", currency: "ARS", period: "monthly", scope: "person" },
      { type: "minimum_purchase", amount: "30000", currency: "ARS" }
    ],
    days_of_week: ["friday"],
    applies_every_day: false,
    payment_methods: [{ network: "visa", raw_name: "Tarjeta Visa", card_type: "credit" }],
    valid_from: "2026-07-03",
    valid_to: "2026-12-31",
    online: true,
    physical: true,
    specific_conditions: "Solo tarjetas seleccionadas"
  };
}

describe("PROMOS", () => {
  test("busca con las palabras de la segunda línea sin pasar un límite", () => {
    const app = createGasTestRuntime();
    const service = testUtils.getGlobal(app, "PromotionsService");
    const calls = [];
    service.search = (...args) => {
      calls.push(args);
      return [viamoPromotion()];
    };

    app.sendMessage("PROMOS\nviamo visa");

    expect(calls).toEqual([["viamo visa"]]);
  });

  test("muestra únicamente comercio, beneficios, tope, días y URL", () => {
    const app = createGasTestRuntime();
    testUtils.getGlobal(app, "PromotionsService").search = () => [viamoPromotion()];

    app.sendMessage("PROMOS\nviamo");

    expect(app.lastMessage()).toBe([
      "1. 🛍️ Viamo",
      "🎁 Beneficios: 20% de descuento · 3 cuotas sin interés",
      "💰 Tope: $15.000 (mensual, por persona)",
      "📅 Días: viernes",
      `🔗 Promo: ${viamoPromotion().promotion_url}`
    ].join("\n"));
  });

  test("no muestra la URL si la promoción no tiene una", () => {
    const app = createGasTestRuntime();
    testUtils.getGlobal(app, "PromotionsService").search = () => [{ ...viamoPromotion(), promotion_url: null }];

    app.sendMessage("PROMOS\nviamo");

    expect(app.lastMessage()).not.toContain("Promo:");
  });

  test("usa el título como respaldo si falta el comercio", () => {
    const app = createGasTestRuntime();
    testUtils.getGlobal(app, "PromotionsService").search = () => [{ ...viamoPromotion(), merchant: null }];

    app.sendMessage("PROMOS\nviamo");

    expect(app.lastMessage()).toContain("1. 🛍️ Descuento en Viamo");
  });

  test("indica cuando el tope y los días son desconocidos sin inferir que no hay tope", () => {
    const app = createGasTestRuntime();
    testUtils.getGlobal(app, "PromotionsService").search = () => [{
      ...viamoPromotion(), limits: [], days_of_week: [], applies_every_day: null
    }];

    app.sendMessage("PROMOS\nviamo");

    expect(app.lastMessage()).toContain("💰 Tope: No informado");
    expect(app.lastMessage()).toContain("📅 Días: No informados");
  });

  test("interpreta todos los días solo si está explícito", () => {
    const app = createGasTestRuntime();
    testUtils.getGlobal(app, "PromotionsService").search = () => [{
      ...viamoPromotion(), days_of_week: [], applies_every_day: true
    }];

    app.sendMessage("PROMOS\nviamo");

    expect(app.lastMessage()).toContain("📅 Días: todos los días");
  });

  test("traduce varios días al español", () => {
    const app = createGasTestRuntime();
    testUtils.getGlobal(app, "PromotionsService").search = () => [{
      ...viamoPromotion(), days_of_week: ["monday", "wednesday", "friday"]
    }];

    app.sendMessage("PROMOS\nviamo");

    expect(app.lastMessage()).toContain("📅 Días: lunes, miércoles, viernes");
  });

  test("solo muestra topes monetarios y conserva cuando son compartidos", () => {
    const app = createGasTestRuntime();
    testUtils.getGlobal(app, "PromotionsService").search = () => [{
      ...viamoPromotion(),
      limits: [
        { type: "usage_count", quantity: 5 },
        { type: "monetary_cap", amount: "4000", currency: "ARS", period: "transaction", shared_group_id: "group" }
      ]
    }];

    app.sendMessage("PROMOS\nviamo");

    expect(app.lastMessage()).toContain("💰 Tope: $4.000 (por operación, compartido)");
    expect(app.lastMessage()).not.toContain("5 usos");
  });

  test("envía todos los resultados aunque superen el tamaño de un mensaje de Telegram", () => {
    const app = createGasTestRuntime();
    const service = testUtils.getGlobal(app, "PromotionsService");
    service.search = () => Array.from({ length: 45 }, (_, index) => ({
      ...viamoPromotion(), merchant: `Comercio ${index + 1}`
    }));

    app.sendMessage("PROMOS\ncomercio");

    const messages = app.messages();
    expect(messages.length).toBeGreaterThan(1);
    expect(messages.every(message => message.length <= 4000)).toBe(true);
    expect(messages.join("\n\n")).toContain("45. 🛍️ Comercio 45");
  });

  test("informa cuando no encuentra promociones", () => {
    const app = createGasTestRuntime();
    testUtils.getGlobal(app, "PromotionsService").search = () => [];

    app.sendMessage("PROMOS\ncomercio inexistente");

    expect(app.lastMessage()).toBe("No encontré promociones activas para esa búsqueda.");
  });

  test("PROMOS sin palabras clave devuelve error de formato", () => {
    const app = createGasTestRuntime();
    app.sendMessage("PROMOS");
    expect(app.lastMessage()).toContain("El formato es incorrecto.");
  });
});

