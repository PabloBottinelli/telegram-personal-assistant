const PromotionsFormatter = {
  format(promotions) {
    if (!promotions.length) {
      return "No encontré promociones activas para esa búsqueda.";
    }

    return promotions
      .map((promotion, index) => PromotionsFormatter.formatItem(promotion, index))
      .join("\n\n");
  },

  formatItem(promotion, index) {
    const lines = [`${index + 1}. ${promotion.title}`];

    if (promotion.discount_percentage) {
      lines.push(`${PromotionsFormatter.formatNumber(promotion.discount_percentage)}% de descuento`);
    }

    if (promotion.installments) {
      lines.push(`Hasta ${promotion.installments} cuotas sin interés`);
    }

    if (promotion.merchant && promotion.merchant.toLowerCase() !== String(promotion.title || "").toLowerCase()) {
      lines.push(`Comercio: ${promotion.merchant}`);
    }

    // if (promotion.category) {
    //   lines.push(`Categoría: ${promotion.category}`);
    // }

    const paymentMethods = PromotionsFormatter.formatPaymentMethods(promotion.payment_methods);
    if (paymentMethods) {
      lines.push(`Medios de pago: ${paymentMethods}`);
    }

    const days = PromotionsFormatter.formatDays(promotion.days_of_week);
    if (days) {
      lines.push(`Días: ${days}`);
    }

    if (promotion.cap_amount) {
      lines.push(`Tope: $${PromotionsFormatter.formatMoney(promotion.cap_amount)}`);
    }

    if (promotion.minimum_purchase) {
      lines.push(`Compra mínima: $${PromotionsFormatter.formatMoney(promotion.minimum_purchase)}`);
    }

    const channels = PromotionsFormatter.formatChannels(promotion);
    if (channels) {
      lines.push(`Canales: ${channels}`);
    }

    const segments = PromotionsFormatter.formatSegments(promotion.customer_segments);
    if (segments) {
      lines.push(`Segmentos: ${segments}`);
    }

    if (promotion.valid_from || promotion.valid_to) {
      lines.push(`Vigencia: ${PromotionsFormatter.formatValidity(promotion.valid_from, promotion.valid_to)}`);
    }

    if (promotion.promotion_url) {
      lines.push(`Promo: ${promotion.promotion_url}`);
    }

    if (promotion.eligibility_requirements) {
      lines.push(`Elegibilidad: ${promotion.eligibility_requirements}`);
    }

    lines.push(`Banco: ${PromotionsFormatter.capitalize(promotion.source)}`);

    return lines.join("\n");
  },

  formatPaymentMethods(paymentMethods) {
    if (!Array.isArray(paymentMethods) || paymentMethods.length === 0) return "";

    const cardTypes = {
      credit: "crédito",
      debit: "débito",
      prepaid: "prepaga"
    };

    return paymentMethods
      .map(method => {
        const network = PromotionsFormatter.capitalize(method.network || method.raw_name || "");
        const cardType = cardTypes[method.card_type] || method.card_type || "";

        return [network, cardType].filter(Boolean).join(" ");
      })
      .filter(Boolean)
      .join(", ");
  },

  formatDays(days) {
    if (!Array.isArray(days) || days.length === 0) return "";

    const dayNames = {
      monday: "lunes",
      tuesday: "martes",
      wednesday: "miércoles",
      thursday: "jueves",
      friday: "viernes",
      saturday: "sábado",
      sunday: "domingo"
    };

    return days.map(day => dayNames[day] || day).join(", ");
  },

  formatChannels(promotion) {
    const channels = [];

    if (promotion.online) channels.push("online");
    if (promotion.physical) channels.push("presencial");
    if (promotion.qr) channels.push("QR");
    if (promotion.nfc) channels.push("NFC");
    if (promotion.contactless) channels.push("contactless");

    return channels.join(", ");
  },

  formatSegments(segments) {
    if (!Array.isArray(segments) || segments.length === 0) return "";

    return segments
      .map(segment => PromotionsFormatter.capitalize(segment))
      .join(", ");
  },

  formatValidity(validFrom, validTo) {
    if (validFrom && validTo) {
      return `del ${PromotionsFormatter.formatDate(validFrom)} al ${PromotionsFormatter.formatDate(validTo)}`;
    }

    if (validFrom) {
      return `desde ${PromotionsFormatter.formatDate(validFrom)}`;
    }

    return `hasta ${PromotionsFormatter.formatDate(validTo)}`;
  },

  formatDate(value) {
    const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})/);

    return match ? `${match[3]}/${match[2]}/${match[1]}` : String(value || "");
  },

  formatMoney(value) {
    const number = Number(value);

    return Number.isFinite(number) ? number.toLocaleString("es-AR") : String(value || "");
  },

  formatNumber(value) {
    const number = Number(value);

    return Number.isFinite(number) ? number.toLocaleString("es-AR") : String(value || "");
  },

  capitalize(value) {
    const text = String(value || "");

    return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
  }
};