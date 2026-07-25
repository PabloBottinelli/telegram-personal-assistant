var TotalsCalculator = {
    calculateExpenses(expenses, year, monthNumber) {
        return expenses.reduce((totals, expense) => {
            if (!TotalsCalculator.isFromPeriod(expense.fecha, year, monthNumber)) {
                return totals;
            }

            if (TotalsCalculator.isForeignExpense(expense)) {
                return totals;
            }

            const amount = TotalsCalculator.effectiveExpenseAmount(expense);

            TotalsCalculator.addCurrencyAmount(totals, expense.moneda, amount);

            return totals;
        }, TotalsCalculator.emptyTotals());
    },

    calculateIncomes(incomes, year, monthNumber) {
        return incomes.reduce((totals, income) => {
            if (!TotalsCalculator.isFromPeriod(income.fecha, year, monthNumber)) {
                return totals;
            }

            const amount = nOrZero_(income.monto);

            TotalsCalculator.addCurrencyAmount(totals, income.moneda, amount);

            return totals;
        }, TotalsCalculator.emptyTotals());
    },

    isFromPeriod(date, year, monthNumber) {
        return date instanceof Date &&
            date.getFullYear() === year &&
            date.getMonth() === monthNumber;
    },

    isForeignExpense(expense) {
        const category = String(expense.categoria || "").trim().toLowerCase();
        return category === "ajeno";
    },

    effectiveExpenseAmount(expense) {
        const amount = nOrZero_(expense.monto);
        const saving = nOrZero_(expense.ahorro);

        return amount - saving;
    },

    addCurrencyAmount(totals, currency, amount) {
        const normalizedCurrency = String(currency || "").trim().toUpperCase();

        if (normalizedCurrency === "ARS") {
            totals.ars += amount;
            return;
        }

        if (normalizedCurrency === "USD" || normalizedCurrency === "USDT") {
            totals.usd += amount;
        }
    },

    emptyTotals() {
        return {
            ars: 0,
            usd: 0
        };
    }
};