var CardStatementPolicy = {
    selectCloseDate(card, today) {
        const currentDate = today || todayNoon_();
        const lastDueDate = card.ultimoVencimiento;
        const lastCloseDate = card.ultimoCierre;
        const nextCloseDate = card.proximoCierre;

        if (!(lastCloseDate instanceof Date) && !(nextCloseDate instanceof Date)) return null;

        if (lastDueDate instanceof Date && lastDueDate < currentDate) {
            return nextCloseDate instanceof Date ? nextCloseDate : null;
        }

        return lastCloseDate instanceof Date ? lastCloseDate : null;
    },

    belongsToStatement(debt, cardName, closeDate) {
        const date = debt.fecha;
        const paymentMethod = String(debt.medio || "").trim();
        const remainingInstallments = Number(debt.cuotasRestantes);

        if (!(date instanceof Date)) return false;
        if (paymentMethod !== cardName) return false;
        if (date >= closeDate) return false;
        if (remainingInstallments <= 0) return false;

        return true;
    }
};