var RefundService = {
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