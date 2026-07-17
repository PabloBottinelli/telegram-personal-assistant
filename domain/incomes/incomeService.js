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

    }
}
