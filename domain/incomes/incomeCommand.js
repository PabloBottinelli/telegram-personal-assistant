var IncomeCommand = {
  handle(chatId, parts) {
    handleValidatedCommand_(chatId, parts, IncomeParser, IncomeValidator, (chatId, value) => {
      IncomeService.startCreateFlow(chatId, value);
    });
  },

  list(parts) {
    listPageWithFormat_(parts, SHEET_INGRESOS.name, IncomeMapper, IncomeFormatter)
  }
};
