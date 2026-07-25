var TotalsFormatter = {
    monthlySummary(result) {
        return (
            `Totales de ${result.period.monthText}:\n` +
            `Gastos del mes en pesos: ${fmtARS_(result.expenses.ars)}\n` +
            `Gastos del mes en USD: ${fmtUSDplain_(result.expenses.usd)} USD\n` +
            `Ingresos del mes en pesos: ${fmtARS_(result.incomes.ars)}\n` +
            `Ingresos del mes en USD: ${fmtUSDplain_(result.incomes.usd)} USD`
        );
    },

    invalidMonth() {
        return MSG_ERRORS.INVALID_MONTH;
    }
};