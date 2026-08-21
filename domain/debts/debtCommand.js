var DebtCommand = {
  handle(chatId, parts) {
    const input = DebtParser.parse(parts);
    const result = DebtValidator.validate(input);

    if (!result.ok) {
      sendTelegram(MSG_ERRORS.ERRORES_PREFIX + result.errors.join("\n"));
      return;
    }

    DebtService.startCreateFlow(chatId, result.value);
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