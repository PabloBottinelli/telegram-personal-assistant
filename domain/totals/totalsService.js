var TotalsService = {
    getMonthlyTotals(period) {
        const expenses = ExpenseRepository.list();
        const incomes = IncomeRepository.list();

        const expenseTotals = TotalsCalculator.calculateExpenses(expenses, period.year, period.monthNumber);
        const incomeTotals = TotalsCalculator.calculateIncomes(incomes, period.year, period.monthNumber);

        return {
            period,
            expenses: expenseTotals,
            incomes: incomeTotals
        };
    }
};