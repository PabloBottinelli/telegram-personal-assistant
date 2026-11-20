var CreditCardExpenseFormatter = {
    formatTransactionList(ccExpenses, pageNumber) {
        return formatPaginatedList_(ccExpenses, pageNumber, "Estos son los gastos con tarjeta", "No hay gastos con tarjeta guardados.", expense => this.formatTransaction(expense))
    },

    formatTransaction(expense) {
        return [
            `Fecha: ${dateToStringDM_(expense.fecha)}` +
            `Medio: ${String(expense.medio)}` +
            `Moneda: ${String(expense.moneda)}` +
            `Monto: ${fmtMoney_(expense.moneda, expense.monto)}` +
            `Cuotas: ${String(expense.cuotas)}` +
            `CuotasRestantes: ${String(expense.cuotasRestantes)}` +
            `Detalle: ${String(expense.detalle)}`
        ].join("\n")
    }
}