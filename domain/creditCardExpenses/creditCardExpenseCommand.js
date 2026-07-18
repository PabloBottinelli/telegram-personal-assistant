var CreditCardExpenseCommand = {
  handle(chatId, parts) {
    const input = CreditCardExpenseParser.parse(parts);
    const result = CreditCardExpenseValidator.validate(input);

    if (!result.ok) {
      sendTelegram(MSG_ERRORS.ERRORES_PREFIX + result.errors.join("\n"));
      return;
    }

    CreditCardExpenseService.startCreateFlow(chatId, result.value);
  }
};