var ExpenseCommand = {
  handle(chatId, parts) {
    handleValidatedCommand_(chatId, parts, ExpenseParser, ExpenseValidator, (chatId, value) => {
      ExpenseService.startCreateFlow(chatId, value);
    });
  },

  list(parts){
    const pageNumber = parts[1] ? validatePositiveNumber(parts[1]) : 1
    const expenses = listSheetValuesByPage_(SHEET_GASTOS.name, ExpenseMapper, pageNumber, 10)
    const msg = ExpenseFormatter.formatExpenseList(expenses, pageNumber)
    sendTelegram(msg)
  }
};