var DebtCommand = {
  handle(chatId, parts) {
    handleValidatedCommand_(chatId, parts, DebtParser, DebtValidator, (chatId, value) => {
      DebtService.startCreateFlow(chatId, value);
    });
  },

  list() {
    const debts = DebtRepository.listPending();

    if (debts.length === 0) {
      sendTelegram("No hay deudas pendientes 🎉");
      return;
    }

    const groups = DebtService.groupPendingByDebtorAndCurrency(debts);
    const msg = DebtFormatter.formatPendingGroups(groups);

    sendTelegram(msg);
  }
};