var IncomeCommand = {
  handle(chatId, parts) {
    const input = IncomeParser.parse(parts);
    const result = IncomeValidator.validate(input);

    if (!result.ok) {
      sendTelegram(MSG_ERRORS.ERRORES_PREFIX + result.errors.join("\n"));
      return;
    }

    IncomeService.startCreateFlow(chatId, result.value);
  }
};