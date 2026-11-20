var ExpenseFormatter = {
    formatExpenseList(expenses, pageNumber) {
        if (expenses.length === 0) { return "No hay gastos guardados."}

        const blocks = expenses.map(expense => {
            const block = 
                `Fecha: ${dateToStringDM_(expense.fecha)}\n` +
                `Categoría: ${String(expense.categoria)}\n` +
                `Medio: ${String(expense.medio)}\n` +
                `Monto: ${fmtMoney_(expense.moneda, expense.monto)}\n` +
                `Moneda: ${String(expense.moneda)}\n` +
                `Ahorro: ${fmtMoney_(expense.moneda, expense.ahorro)}\n` +
                `Detalle: ${String(expense.detalle)}\n` +
                `Tipo: ${String(expense.tipo)}\n` +
                `Reintegrado: ${String(expense.reintegrado)}\n` +
                `Id: ${String(expense.id)}`
            
            return block
        })

        return `Estos son los gastos de la página ${pageNumber}:\n\n` + blocks.join("\n\n")
    }
}