var ExpenseCommand = {
  handle(chatId, parts) {
    handleValidatedCommand_(chatId, parts, ExpenseParser, ExpenseValidator, (chatId, value) => {
      ExpenseService.startCreateFlow(chatId, value);
    });
  },

  list(parts){
    listPageWithFormat_(parts, SHEET_GASTOS.name, ExpenseMapper, ExpenseFormatter)
  }
};