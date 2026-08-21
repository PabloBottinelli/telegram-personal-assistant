var RefundService = {
    startMarkFlow(chatId, pendingExpenses) {
        const state = {
            flow: "MARK_REFUND",
            step: "WAITING_INDEX",
            data: {
                pendingRefunds: pendingExpenses.map(expense => ({
                    id: expense.id,
                    fecha: expense.fecha,
                    moneda: expense.moneda,
                    ahorro: expense.ahorro,
                    detalle: expense.detalle,
                    medio: expense.medio
                }))
            },
            timestamp: Date.now()
        };

        saveState_(chatId, state);

        sendTelegram(RefundFormatter.selectionPrompt(pendingExpenses));
    },
    
    isPending(expense) {
        const type = String(expense.tipo || "").trim().toUpperCase();
        const saving = nOrZero_(expense.ahorro);

        return (
            type === "R" &&
            saving > 0 &&
            expense.reintegrado !== true
        );
    },

    listPending() {
        return ExpenseRepository
            .list()
            .filter(expense => expense.fecha instanceof Date)
            .filter(expense => this.isPending(expense));
    },

    markAsRefunded(expenseId) {
        const expense = ExpenseRepository.findById(expenseId);

        if (!expense) {
            return {
                ok: false,
                message: "No encontré el gasto seleccionado."
            };
        }

        if (!this.isPending(expense)) {
            return {
                ok: false,
                message: "Ese reintegro ya no está pendiente."
            };
        }

        const updated = ExpenseRepository.markAsRefundedById(expenseId);

        if (!updated) {
            return {
                ok: false,
                message: "No se pudo actualizar el reintegro."
            };
        }

        return {
            ok: true,
            value: expense
        };
    }
};