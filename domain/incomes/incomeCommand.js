var IncomeCommand = {
  handle(chatId, parts) {
    handleValidatedCommand_(chatId, parts, IncomeParser, IncomeValidator, (chatId, value) => {
      IncomeService.startCreateFlow(chatId, value);
    });
  },

  list(parts) {
    const pageNumber = parts[1] ? validatePositiveNumber(parts[1]) : 1
    const incomes = listSheetValuesByPage_(SHEET_INGRESOS.name, IncomeMapper, pageNumber, 10)
    const msg = IncomeFormatter.formatIncomeList(incomes, pageNumber)
    sendTelegram(msg)
  }
};
