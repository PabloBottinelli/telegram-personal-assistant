var CreditCardExpenseFormatter = {
    formatExpenseList(ccExpenses, pageNumber) {
        if (ccExpenses.length === 0) { return "No hay gastos con tarjeta guardados."}

        const blocks = ccExpenses.map(expense => {
            const block = 
                `Fecha: ${dateToStringDM_(expense.fecha)}\n` +
                `Medio: ${String(expense.medio)}\n` +
                `Moneda: ${String(expense.moneda)}\n` +
                `Monto: ${fmtMoney_(expense.moneda, expense.monto)}\n` +
                `Cuotas: ${String(expense.cuotas)}\n` +
                `CuotasRestantes: ${String(expense.cuotasRestantes)}\n` +
                `Detalle: ${String(expense.detalle)}\n` 
                
            return block
        })

        return `Estos son los gastos con tarjeta de la página ${pageNumber}:\n\n` + blocks.join("\n\n")
    }
}