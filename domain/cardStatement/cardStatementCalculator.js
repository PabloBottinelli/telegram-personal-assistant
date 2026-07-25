var CardStatementCalculator = {
    buildItem(debt, expense) {
        const currency = String(debt.moneda || "").trim().toUpperCase();
        const installments = Number(debt.cuotas);
        const remainingInstallments = Number(debt.cuotasRestantes);
        const totalAmount = nOrZero_(debt.monto);

        const installmentAmount = installments > 1 ? totalAmount / installments : totalAmount;
        const installmentNumber = installments > 1 ? installments - remainingInstallments + 1 : null;

        const category = String(expense.categoria || "").trim().toLowerCase();
        const isForeign = category === "ajeno";

        const type = String(expense.tipo || "").trim().toUpperCase();
        const refunded = expense.reintegrado === true;

        const pendingDiscount = type === "D" && !refunded ? nOrZero_(expense.ahorro) : 0;

        return {
            debtId: debt.id,
            expenseId: debt.gastoId,
            date: debt.fecha,
            detail: String(debt.detalle || "").trim(),
            currency,
            installments,
            remainingInstallments,
            installmentNumber,
            installmentAmount,
            isForeign,
            pendingDiscount
        };
    },

    emptyTotals() {
        return {
            own: {
                ars: 0,
                usd: 0
            },
            foreign: {
                ars: 0,
                usd: 0
            }
        };
    },

    addToTotals(totals, item) {
        const group = item.isForeign ? totals.foreign : totals.own;
        const isDollar = item.currency === "USD" || item.currency === "USDT";

        if (isDollar) {
            group.usd += item.installmentAmount;
            return;
        }

        group.ars += item.installmentAmount;
    },

    calculateTotals(items) {
        const totals = CardStatementCalculator.emptyTotals();

        for (const item of items) {
            CardStatementCalculator.addToTotals(totals, item);
        }

        return totals;
    }
};