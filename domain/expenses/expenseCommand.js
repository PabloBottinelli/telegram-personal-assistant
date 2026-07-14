var ExpenseCommand = {
  handle(chatId, parts) {
    const input = ExpenseParser.parse(parts);
    const result = ExpenseValidator.validate(input);

    if (!result.ok) {
      sendTelegram(MSG_ERRORS.ERRORES_PREFIX + result.errors.join("\n"));
      return;
    }

    ExpenseService.startCreateFlow(chatId, result.value);
  }
};