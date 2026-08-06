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

    belongsToCard(debt, cardName) {
        const date = debt.fecha;
        const paymentMethod = String(debt.medio || "").trim();
        const remainingInstallments = Number(debt.cuotasRestantes);

        if (!(date instanceof Date)) return false;
        if (paymentMethod !== cardName) return false;
        if (!Number.isInteger(remainingInstallments)) return false;
        if (remainingInstallments <= 0) return false;

        return true;
    },

    belongsToStatement(debt, cardName, closeDate) {
        if (!(closeDate instanceof Date)) return false;
        if (!CardStatementPolicy.belongsToCard(debt, cardName)) return false;

        return debt.fecha < closeDate;
    },

    futureInstallmentsCount(debt, cardName, closeDate) {
        if (!(closeDate instanceof Date)) return 0;
        if (!CardStatementPolicy.belongsToCard(debt, cardName)) return 0;

        const remainingInstallments = Number(debt.cuotasRestantes);

        if (debt.fecha < closeDate) {
            return Math.max(remainingInstallments - 1, 0);
        }

        return remainingInstallments;
    }
};