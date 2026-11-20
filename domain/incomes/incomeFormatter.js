var IncomeFormatter = {
    formatTransactionList(incomes, pageNumber) {
        return formatPaginatedList_(incomes, pageNumber, "Estos son los ingresos", "No hay ingresos guardados.", income => this.formatTransaction(income))
    },

    formatTransaction(income) {
        return [
            `Fecha: ${dateToStringDM_(income.fecha)}` +
            `Monto: ${fmtMoney_(income.moneda, income.monto)}` +
            `Moneda: ${String(income.moneda)}` +
            `Categoría: ${String(income.categoria)}` +
            `Descripción: ${String(income.descripcion)}`
        ].join("\n")
    }
}