function doPost(e) {
  try {
    const contents = JSON.parse(e.postData.contents);
    const message = contents.message?.text?.trim();
    const chatId = String(contents.message?.chat?.id);
    if (chatId !== TELEGRAM_CHAT_ID) return;

    let userState = loadState_(chatId);

    if (userState && userState.esperandoReintegroIdx) { handleMarkAsRefundedResponse_(chatId, message, userState); return; }
    if (userState && userState.esperandoCategoria)   { handleItemResponse(chatId, TABLA_CATEGORIAS, message, userState); return; }
    if (userState && (userState.esperandoMetodo || userState.esperandoMetodoFecha)) { handleItemResponse(chatId, TABLA_TARJETAS, message, userState); return; }

    const lineas = message.split("\n").map(s => s.trim());
    const tipo = (lineas[0] || '').toUpperCase();

    const handler = ROUTES[tipo];
    if (handler) {
      handler(chatId, lineas);
      return;
    }

    sendTelegram(MSG_ERRORS.INVALID_COMMAND);
  } catch (err) {
    sendTelegram(MSG_ERRORS.ERROR_GENERIC + (err.stack || err.message));
  }
}


