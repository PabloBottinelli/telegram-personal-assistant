function handleBotError_(err, chatId) {
  sendTelegram(MSG_ERRORS.ERROR_GENERIC + (err.stack || err.message));

  if (chatId != null) {
    statesReset(chatId);
  }
}