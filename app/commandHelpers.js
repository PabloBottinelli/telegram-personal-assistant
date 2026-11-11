function handleValidatedCommand_(chatId, parts, parser, validator, onValid) {
  const result = validator.validate(parser.parse(parts));

  if (!result.ok) {
    sendTelegram(MSG_ERRORS.ERRORES_PREFIX + result.errors.join("\n"));
    return;
  }

  onValid(chatId, result.value);
}