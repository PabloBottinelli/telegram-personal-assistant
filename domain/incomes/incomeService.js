var IncomeService = {
    startCreateFlow(chatId, income){
        saveState_(chatId, {
            flow: "CREATE_INCOME",
            step: "WAITING_CATEGORY",
            data: income,
            timestamp: Date.now()
        });

        CategoryCommand.sendSelectionList();
    },

    create(income){
        const id = income.id || generateId_("ING");

        IncomeRepository.append({
            id: id,
            fecha: income.fecha,
            categoria: income.categoria,
            monto: income.monto,
            moneda: income.moneda,
            detalle: income.detalle,
        });

        return id;
    }
}
