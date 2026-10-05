function handleState_(chatId, message, state) {
  const flowHandlers = getStateHandlers_()[state.flow];

  if (!flowHandlers) {
    statesReset(chatId);
    sendTelegram("❌ Estado inválido. Volvé a empezar.");
    return;
  }

  const handler = flowHandlers[state.step];

  if (!handler) {
    statesReset(chatId);
    sendTelegram("❌ Paso inválido. Volvé a empezar.");
    return;
  }

  if (typeof handler !== "function") {
    statesReset(chatId);
    sendTelegram("❌ Handler inválido para " + state.flow + " / " + state.step);
    return;
  }

  handler(chatId, message, state);
}