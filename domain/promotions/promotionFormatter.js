/** Presentación compacta de promociones NormalizedPromotion V2 en Telegram. */
const PromotionsFormatter = {
  format(promotions) {
    if (!Array.isArray(promotions) || promotions.length === 0) {
      return "No encontré promociones activas para esa búsqueda.";
    }

    return promotions
      .map((promotion, index) => this.formatItem(promotion, index))
      .join("\n\n");
  },

  formatItem(promotion, index) {
    const merchant = String(promotion.merchant || promotion.title || "Comercio no informado").trim();
    const benefits = this.formatBenefits(promotion.benefits);
    const caps = this.formatCaps(promotion.limits);
    const days = this.formatDays(promotion.days_of_week, promotion.applies_every_day);

    const lines = [
      `${index + 1}. 🛍️ ${merchant}`,
      `🎁 Beneficios: ${benefits.length ? benefits.join(" · ") : "No informados"}`,
      `💰 Tope: ${caps.length ? caps.join(" · ") : "No informado"}`,
      `📅 Días: ${days || "No informados"}`
    ];

    if (promotion.promotion_url) {
      lines.push(`🔗 Promo: ${promotion.promotion_url}`);
    }

    return lines.join("\n");
  },

  formatBenefits(benefits) {
    if (!Array.isArray(benefits)) return [];

    return benefits.map(benefit => {
      if (!benefit || typeof benefit !== "object") return "";

      const percentage = this.hasValue(benefit.percentage)
        ? `${this.formatNumber(benefit.percentage)}%`
        : "";
      const amount = this.hasValue(benefit.amount)
        ? this.formatMoney(benefit.amount, benefit.currency)
        : "";

      switch (benefit.type) {
        case "discount": {
          const text = percentage ? `${percentage} de descuento` : amount ? `${amount} de descuento` : benefit.description || "Descuento";
          return percentage && amount ? `${text} (importe: ${amount})` : text;
        }
        case "cashback": {
          let text = percentage ? `${percentage} de reintegro` : amount ? `${amount} de reintegro` : benefit.description || "Reintegro";
          if (percentage && amount) text += ` (importe: ${amount})`;
          if (benefit.reward_currency) text += ` (acreditado en ${benefit.reward_currency})`;
          return text;
        }
        case "installments": {
          const options = Array.isArray(benefit.installment_options)
            ? benefit.installment_options.filter(value => this.hasValue(value))
            : [];
          const count = this.joinWithAnd(options.map(value => this.formatNumber(value)));
          const text = count ? `${count} cuotas` : "Financiación en cuotas";
          if (benefit.interest_free === true) return `${text} sin interés`;
          if (benefit.interest_free === false) return `${text} con interés`;
          return text;
        }
        case "fee_waiver":
          return benefit.description || "Sin comisión";
        case "free_service":
          return benefit.description || "Servicio gratuito";
        case "points":
          return amount ? `${this.formatNumber(benefit.amount)} puntos` : benefit.description || "Puntos o millas";
        case "gift":
          return benefit.description || "Regalo";
        default:
          return benefit.description || "Otro beneficio";
      }
    }).filter(Boolean);
  },

  // Únicamente topes monetarios, sin compras mínimas, stock ni límite de usos.
  formatCaps(limits) {
    if (!Array.isArray(limits)) return [];

    return limits
      .filter(limit => limit && limit.type === "monetary_cap")
      .map(limit => {
        const amount = this.hasValue(limit.amount)
          ? this.formatMoney(limit.amount, limit.currency)
          : "Importe no informado";
        const qualifiers = [];
        if (limit.period) qualifiers.push(this.formatPeriod(limit.period));
        if (limit.scope) qualifiers.push(this.formatScope(limit.scope));
        if (limit.shared_group_id) qualifiers.push("compartido");
        return qualifiers.length ? `${amount} (${qualifiers.join(", ")})` : amount;
      });
  },

  formatDays(days, appliesEveryDay) {
    if (appliesEveryDay === true) return "todos los días";
    if (!Array.isArray(days) || days.length === 0) return "";

    const names = {
      monday: "lunes", tuesday: "martes", wednesday: "miércoles",
      thursday: "jueves", friday: "viernes", saturday: "sábado", sunday: "domingo"
    };
    return days.map(day => names[day] || day).join(", ");
  },

  formatMoney(value, currency) {
    const code = String(currency || "").toUpperCase();
    const number = this.formatNumber(value, code === "BTC" ? 8 : 2);
    const prefixes = { ARS: "$", USD: "US$", EUR: "€" };
    if (!code) return `${number} (moneda no informada)`;
    return prefixes[code] ? `${prefixes[code]}${number}` : `${code} ${number}`;
  },

  formatNumber(value, maximumFractionDigits = 2) {
    const number = Number(value);
    return Number.isFinite(number)
      ? number.toLocaleString("es-AR", { maximumFractionDigits })
      : String(value ?? "");
  },

  formatPeriod(value) {
    const names = {
      daily: "diario", weekly: "semanal", monthly: "mensual",
      transaction: "por operación", per_transaction: "por operación",
      promotion: "por promoción", yearly: "anual"
    };
    return names[value] || value;
  },

  formatScope(value) {
    const names = {
      person: "por persona", customer: "por cliente", user: "por usuario",
      account: "por cuenta", card: "por tarjeta", merchant: "por comercio",
      campaign: "por campaña", purchase: "por compra"
    };
    return names[value] || value;
  },

  joinWithAnd(values) {
    if (values.length < 2) return values.join("");
    return `${values.slice(0, -1).join(", ")} y ${values[values.length - 1]}`;
  },

  hasValue(value) {
    return value !== null && value !== undefined && value !== "";
  }
};
