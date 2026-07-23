var DebtCommand = {
  handle(chatId, parts) {
    const input = DebtParser.parse(parts);
    const result = DebtValidator.validate(input);

    if (!result.ok) {
      sendTelegram(MSG_ERRORS.ERRORES_PREFIX + result.errors.join("\n"));
      return;
    }

    DebtService.startCreateFlow(chatId, result.value);
  }
};