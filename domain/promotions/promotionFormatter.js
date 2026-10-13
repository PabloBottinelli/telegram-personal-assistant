/** Formatea promociones de NormalizedPromotion V2 para mensajes de Telegram. */
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
    const lines = [`${index + 1}. ${promotion.title || "Promoción sin título"}`];

    const benefits = this.formatBenefits(promotion.benefits);
    if (benefits.length === 1) {
      lines.push(`Beneficio: ${benefits[0]}`);
    } else if (benefits.length > 1) {
      lines.push("Beneficios:");
      benefits.forEach(benefit => lines.push(`• ${benefit}`));
    }

    if (
      promotion.merchant &&
      promotion.merchant.toLowerCase() !== String(promotion.title || "").toLowerCase()
    ) {
      lines.push(`Comercio: ${promotion.merchant}`);
    }

    const limits = this.formatLimits(promotion.limits);
    limits.forEach(limit => lines.push(limit));

    const methods = this.formatPaymentMethods(promotion.payment_methods);
    if (methods) lines.push(`Medios de pago: ${methods}`);

    const days = this.formatDays(promotion.days_of_week, promotion.applies_every_day);
    if (days) lines.push(`Días: ${days}`);

    const channels = this.formatChannels(promotion);
    if (channels) lines.push(`Canales: ${channels}`);

    lines.push(`Vigencia: ${this.formatValidity(promotion.valid_from, promotion.valid_to)}`);

    if (promotion.specific_conditions) {
      lines.push(`Condiciones: ${promotion.specific_conditions}`);
    }

    if (promotion.requires_merchant_verification) {
      lines.push("⚠️ Verificá los comercios o sucursales adheridos en la fuente oficial.");
    }

    if (promotion.promotion_url) {
      lines.push(`Promo: ${promotion.promotion_url}`);
    }

    lines.push(`Fuente: ${this.formatSource(promotion.source)}`);
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

      let text = "";
      switch (benefit.type) {
        case "discount":
          text = percentage ? `${percentage} de descuento` : amount ? `Descuento de ${amount}` : "Descuento";
          if (percentage && amount) text += ` (importe: ${amount})`;
          break;
        case "cashback":
          text = percentage ? `${percentage} de reintegro` : amount ? `Reintegro de ${amount}` : "Reintegro";
          if (percentage && amount) text += ` (importe: ${amount})`;
          if (benefit.reward_currency) {
            text += ` (acreditado en ${benefit.reward_currency})`;
          }
          break;
        case "installments": {
          const options = Array.isArray(benefit.installment_options)
            ? benefit.installment_options.filter(value => this.hasValue(value))
            : [];
          const count = this.joinWithAnd(options.map(value => this.formatNumber(value)));
          text = count ? `${count} cuotas` : "Financiación en cuotas";
          if (benefit.interest_free === true) text += " sin interés";
          if (benefit.interest_free === false) text += " con interés";
          break;
        }
        case "fee_waiver":
          text = "Sin comisión";
          break;
        case "free_service":
          text = "Servicio gratuito";
          break;
        case "points":
          text = amount ? `${this.formatNumber(benefit.amount)} puntos` : "Puntos o millas";
          break;
        case "gift":
          text = "Regalo o beneficio adicional";
          break;
        default:
          text = "Otro beneficio";
      }

      // Se preservan los detalles que no entran en los campos estructurados.
      if (benefit.description) text += ` — ${benefit.description}`;
      return text;
    }).filter(Boolean);
  },

  formatLimits(limits) {
    if (!Array.isArray(limits)) return [];

    return limits.map(limit => {
      if (!limit || typeof limit !== "object") return "";
      const amount = this.hasValue(limit.amount)
        ? this.formatMoney(limit.amount, limit.currency)
        : "";
      const quantity = this.hasValue(limit.quantity)
        ? this.formatNumber(limit.quantity)
        : "";

      let text = "";
      switch (limit.type) {
        case "monetary_cap":
          text = amount ? `Tope: ${amount}` : "Tope monetario (importe no informado)";
          break;
        case "minimum_purchase":
          text = amount ? `Compra mínima: ${amount}` : "Compra mínima (importe no informado)";
          break;
        case "usage_count":
          text = quantity ? `Límite: ${quantity} usos` : "Límite de usos";
          break;
        case "stock":
          text = quantity ? `Stock: ${quantity} unidades` : "Sujeto a stock";
          break;
        default:
          text = "Otra limitación";
      }

      const qualifiers = [];
      if (limit.period) qualifiers.push(this.formatPeriod(limit.period));
      if (limit.scope) qualifiers.push(this.formatScope(limit.scope));
      if (limit.shared_group_id) qualifiers.push("tope compartido");
      if (qualifiers.length) text += ` (${qualifiers.join(", ")})`;
      if (limit.description) text += ` — ${limit.description}`;
      return text;
    }).filter(Boolean);
  },

  formatPaymentMethods(paymentMethods) {
    if (!Array.isArray(paymentMethods) || paymentMethods.length === 0) return "";

    const cardTypes = { credit: "crédito", debit: "débito", prepaid: "prepaga" };
    const rails = {
      qr: "QR",
      nfc: "NFC",
      transfer: "transferencia",
      account_balance: "saldo en cuenta"
    };

    const methods = paymentMethods.map(method => {
      if (!method || typeof method !== "object") return "";

      const base = String(method.raw_name || "").trim();
      const extras = [];
      const includes = value => base.toLowerCase().includes(String(value).toLowerCase());

      if (method.network && !includes(method.network)) {
        extras.push(this.capitalize(method.network));
      }
      const cardType = cardTypes[method.card_type] || method.card_type;
      if (cardType && !includes(cardType)) extras.push(cardType);
      if (method.issuer && !includes(method.issuer)) extras.push(method.issuer);
      if (method.wallet && !includes(method.wallet)) extras.push(`vía ${method.wallet}`);
      const rail = rails[method.payment_rail];
      if (rail && !includes(rail)) extras.push(rail);

      return base
        ? base + (extras.length ? ` (${extras.join(", ")})` : "")
        : extras.join(", ");
    }).filter(Boolean);

    // Mantiene el orden de la fuente y evita mostrar opciones repetidas.
    return [...new Set(methods)].join(", ");
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

  formatChannels(promotion) {
    const channels = [];
    if (promotion.online === true) channels.push("online");
    if (promotion.physical === true) channels.push("presencial");
    return channels.join(", ");
  },

  formatValidity(validFrom, validTo) {
    if (validFrom && validTo) {
      return `del ${this.formatDate(validFrom)} al ${this.formatDate(validTo)}`;
    }
    if (validFrom) return `desde ${this.formatDate(validFrom)}`;
    if (validTo) return `hasta ${this.formatDate(validTo)}`;
    return "no informada (consultar fuente)";
  },

  formatDate(value) {
    const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
    return match ? `${match[3]}/${match[2]}/${match[1]}` : String(value || "");
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

  formatSource(source) {
    const names = {
      galicia: "Galicia", bbva: "BBVA", patagonia: "Banco Patagonia",
      banco_del_sol: "Banco del Sol", cuenta_dni: "Cuenta DNI",
      buepp: "Buepp", credicoop: "Banco Credicoop", naranja_x: "Naranja X",
      modo: "MODO", bna: "Banco Nación", personal_pay: "Personal Pay",
      prex: "Prex", ripio: "Ripio", uala: "Ualá"
    };
    const key = String(source || "").toLowerCase();
    return names[key] || this.capitalize(key.replace(/_/g, " "));
  },

  joinWithAnd(values) {
    if (values.length < 2) return values.join("");
    return `${values.slice(0, -1).join(", ")} y ${values[values.length - 1]}`;
  },

  hasValue(value) {
    return value !== null && value !== undefined && value !== "";
  },

  capitalize(value) {
    const text = String(value || "");
    return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
  }
};
