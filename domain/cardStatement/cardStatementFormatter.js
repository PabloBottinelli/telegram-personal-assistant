var CardStatementFormatter = {
    format(result) {
        const cardName = String(result.card.nombre || "").trim();

        if (!result.hasCardDebts) {
            return `Resumen ${cardName}\n\nNo hay deudas de tarjeta cargadas.`;
        }

        const foreignItems = result.items.filter(item => item.isForeign);
        const ownItems = result.items.filter(item => !item.isForeign);

        let message = `Resumen ${cardName}\n\n`;

        message += "Gastos Ajenos:\n";
        message += foreignItems.length > 0
            ? foreignItems.map(item => CardStatementFormatter.formatItem(item)).join("\n")
            : "- No hay gastos ajenos.";

        message += "\n\n";
        message += `Total a pagar en usd de cosas ajenas: ${fmtMoney_("USD", result.totals.foreign.usd)}\n`;
        message += `Total a pagar en pesos de cosas ajenas: ${fmtMoney_("ARS", result.totals.foreign.ars)}\n`;

        message += "\n";
        message += "Gastos Propios:\n";
        message += ownItems.length > 0
            ? ownItems.map(item => CardStatementFormatter.formatItem(item)).join("\n")
            : "- No hay gastos propios.";

        message += "\n\n";
        message += `Total a pagar en usd de cosas propias: ${fmtMoney_("USD", result.totals.own.usd)}\n`;
        message += `Total a pagar en pesos de cosas propias: ${fmtMoney_("ARS", result.totals.own.ars)}\n`;

        const totalUSD = result.totals.own.usd + result.totals.foreign.usd;
        const totalARS = result.totals.own.ars + result.totals.foreign.ars;

        message += "\n";
        message += `Total general USD: ${fmtMoney_("USD", totalUSD)}\n`;
        message += `Total general ARS: ${fmtMoney_("ARS", totalARS)}`;

        return message;
    },

    formatItem(item) {
        const installmentText = item.installmentNumber !== null
            ? `(${item.installmentNumber}/${item.installments}) `
            : "";

        const discountText = item.pendingDiscount > 0
            ? ` (descuento pendiente: ${fmtMoney_(item.currency, item.pendingDiscount)})`
            : "";

        return `- ${installmentText}${dateToStringDM_(item.date)} · ${fmtMoney_(item.currency, item.installmentAmount)} · ${item.detail}${discountText} [${item.expenseId}]`;
    },

    warning(warning) {
        if (warning.type === "MISSING_EXPENSE_ID") {
            return (
                "⚠️ Hay una deuda de tarjeta sin Gasto ID.\n" +
                `Tarjeta: ${warning.cardName}\n` +
                `Fecha: ${dateToStringDM_(warning.date)}\n` +
                `Detalle: ${warning.detail}`
            );
        }

        if (warning.type === "EXPENSE_NOT_FOUND") {
            return (
                "⚠️ No encontré el gasto vinculado a una deuda de tarjeta.\n" +
                `Tarjeta: ${warning.cardName}\n` +
                `Gasto ID: ${warning.expenseId}\n` +
                `Detalle deuda: ${warning.detail}\n` +
                "Sugerencia: revisá que exista ese ID en la hoja Gastos."
            );
        }

        return "⚠️ Se encontró un problema generando el resumen.";
    },

    closeDateError(cardName) {
        return `⚠️ ${cardName}: no pude determinar fecha de cierre para el resumen.`;
    },

    generationError(cardName, error) {
        const detail = error && error.stack ? error.stack : error.message || error;
        return `⚠️ ${cardName}: error generando resumen.\n${detail}`;
    }
};