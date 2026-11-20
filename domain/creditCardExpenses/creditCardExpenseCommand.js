var CreditCardExpenseCommand = {
  handle(chatId, parts) {
    handleValidatedCommand_(chatId, parts, CreditCardExpenseParser, CreditCardExpenseValidator, (chatId, value) => {
      CreditCardExpenseService.startCreateFlow(chatId, value);
    });
  },

  list(parts) {
    const pageNumber = parts[1] ? validatePositiveNumber(parts[1]) : 1
    const ccExpenses = listSheetValuesByPage_(SHEET_CUOTAS.name, CreditCardExpenseMapper, pageNumber, 10)
    const msg = CreditCardExpenseFormatter.formatExpenseList(ccExpenses, pageNumber)
    sendTelegram(msg)
  }
};