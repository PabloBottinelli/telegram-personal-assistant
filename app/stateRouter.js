function handleState_(chatId, message, state) {
  if (!state.flow || !state.step) {
    handleLegacyState_(chatId, message, state);
    return;
  }

  const flowHandlers = STATE_HANDLERS[state.flow];

  if (!flowHandlers) {
    statesReset()
    sendTelegram("❌ Estado inválido. Volvé a empezar.");
    return;
  }

  const handler = flowHandlers[state.step];

  if (!handler) {
    statesReset()
    sendTelegram("❌ Paso inválido. Volvé a empezar.");
    return;
  }

  handler(chatId, message, state);
}