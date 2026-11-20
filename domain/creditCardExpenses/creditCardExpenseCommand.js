var CreditCardExpenseCommand = {
  handle(chatId, parts) {
    handleValidatedCommand_(chatId, parts, CreditCardExpenseParser, CreditCardExpenseValidator, (chatId, value) => {
      CreditCardExpenseService.startCreateFlow(chatId, value);
    });
  },

  list(parts) {
    listPageWithFormat_(parts, SHEET_CUOTAS.name, CreditCardExpenseMapper, CreditCardExpenseFormatter)
  }
};