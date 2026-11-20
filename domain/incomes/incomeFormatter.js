var IncomeFormatter = {
    formatIncomeList(incomes, pageNumber) {
        if (incomes.length === 0) { return "No hay ingresos guardados."}

        const blocks = incomes.map(income => {
            const block = 
                `Fecha: ${dateToStringDM_(income.fecha)}\n` +
                `Monto: ${fmtMoney_(income.moneda, income.monto)}\n` +
                `Moneda: ${String(income.moneda)}\n` +
                `Categoría: ${String(income.categoria)}\n` +
                `Descripción: ${String(income.descripcion)}\n` +
                `Id: ${String(income.id)}`
            
            return block
        })

        return `Estos son los ingresos de la página ${pageNumber}:\n\n` + blocks.join("\n\n")
    }
}