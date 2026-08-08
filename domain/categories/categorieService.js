var CategorieService = {
    startEditFlow(chatId) {
        saveState_(chatId, {
            flow: "EDIT_CATEGORY",
            step: "WAITING_CATEGORY",
            timestamp: Date.now()
        });

        CategoryCommand.sendSelectionList();
    }
}