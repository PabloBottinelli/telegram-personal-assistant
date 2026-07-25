var RefundFormatter = {
    noPending() {
        return "No hay reintegros pendientes.";
    },

    formatPendingItem(expense, index) {
        const date = dateToStringDM_(expense.fecha);
        const method = String(expense.medio || "").trim() || "Medio";
        const detail = String(expense.detalle || "").trim() || "-";

        const prefix = index == null ? "" : `${index + 1}. `;

        return (
            `${prefix}${method} te debe ` +
            `${fmtMoney_(expense.moneda, expense.ahorro)} ` +
            `por compra del ${date}\n` +
            `Descripción: ${detail}`
        );
    },

    formatPendingList(expenses, numbered) {
        return expenses
            .map((expense, index) =>
                this.formatPendingItem(
                    expense,
                    numbered ? index : null
                )
            )
            .join("\n\n");
    },

    selectionPrompt(expenses) {
        return (
            this.formatPendingList(expenses, true) +
            "\n\nRespondé el NÚMERO a marcar como resuelto, o escribí CANCELAR."
        );
    },

    marked(expense) {
        const date = dateToStringDM_(expense.fecha);
        const method = String(expense.medio || "").trim() || "Medio";
        const detail = String(expense.detalle || "").trim() || "-";

        return (
            "Marcado como reintegrado:\n" +
            `${method} te debía ` +
            `${fmtMoney_(expense.moneda, expense.ahorro)} ` +
            `por ${detail} del ${date}`
        );
    },

    invalidIndex() {
        return "Número inválido. Probá otra vez o escribí CANCELAR.";
    }
};