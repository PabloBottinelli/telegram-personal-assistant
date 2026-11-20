var ExpenseFormatter = {
    formatTransactionList(expenses, pageNumber) {
        return formatPaginatedList_(expenses, pageNumber, "Estos son los gastos", "No hay gastos guardados.", expense => this.formatTransaction(expense))
    },

    formatTransaction(expense) {
        return [
            `Fecha: ${dateToStringDM_(expense.fecha)}` +
            `Categoría: ${String(expense.categoria)}` +
            `Medio: ${String(expense.medio)}` +
            `Monto: ${fmtMoney_(expense.moneda, expense.monto)}` +
            `Moneda: ${String(expense.moneda)}` +
            `Ahorro: ${fmtMoney_(expense.moneda, expense.ahorro)}` +
            `Detalle: ${String(expense.detalle)}` +
            `Tipo: ${String(expense.tipo)}` +
            `Reintegrado: ${String(expense.reintegrado)}`
        ].join("\n")
    }
}