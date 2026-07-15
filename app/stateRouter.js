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

  const handlerName = flowHandlers[state.step];

  if (!handlerName) {
    statesReset()
    sendTelegram("❌ Paso inválido. Volvé a empezar.");
    return;
  }

  const handler = globalThis[handlerName];

  if (typeof handler !== "function") {
    statesReset();
    sendTelegram("❌ Handler no implementado: " + handlerName);
    return;
  }

  handler(chatId, message, state);
}