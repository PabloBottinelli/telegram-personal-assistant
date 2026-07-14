function handleBotError_(err) {
  sendTelegram(MSG_ERRORS.ERROR_GENERIC + (err.stack || err.message));
  statesReset();
}