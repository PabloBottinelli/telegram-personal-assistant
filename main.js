function doPost(e) {
  try {
    const contents = JSON.parse(e.postData.contents);
    const message = contents.message?.text?.trim();
    const chatId = String(contents.message?.chat?.id);
    if (chatId !== TELEGRAM_CHAT_ID) return;

    let userState = loadState_(chatId);

    if (userState && userState.esperandoReintegroIdx) { handleMarcarReintegroResponse_(chatId, message, userState); return; }
    if (userState && userState.esperandoCategoria)   { handleItemResponse(chatId, TABLA_CATEGORIAS, message, userState); return; }
    if (userState && (userState.esperandoMetodo || userState.esperandoMetodoFecha)) { handleItemResponse(chatId, TABLA_TARJETAS, message, userState); return; }

    const lineas = message.split("\n").map(s => s.trim());
    const tipo = (lineas[0] || '').toUpperCase();

    const handler = ROUTES[tipo];
    if (handler) {
      handler(chatId, lineas);
      return;
    }

    if (routeTarjetaFechas_(chatId, lineas, tipo)) return;

    sendTelegram(MSG_COMMANDS.ELEGIR_COMANDO);
  } catch (err) {
    sendTelegram(MSG_ERRORS.ERROR_GENERIC + (err.stack || err.message));
  }
}

const ROUTES = {
  "COMANDOS": (chatId, lineas) => sendCommandMenu(),
  "TOTALES": (chatId, lineas) => sendTotals(),
  "REINTEGROS": (chatId, lineas) => sendRefunds(),
  "MARCAR REINTEGRADO": (chatId, lineas) => iniciarMarcarReintegrado(chatId),
  "FECHAS": (chatId, lineas) => sendCardDates_(),
  "GASTO": (chatId, lineas) => { if (lineas.length !== 8) { sendTelegram(MSG_COMMANDS.FORMATO_GASTO); return; } processSpent(chatId, lineas);},
  "INGRESO": (chatId, lineas) => { if (lineas.length !== 5) { sendTelegram(MSG_COMMANDS.FORMATO_INGRESO); return; } processIncome(chatId, lineas);},
  "TC": (chatId, lineas) => { if (lineas.length !== 8) { sendTelegram(MSG_COMMANDS.FORMATO_TC); return; } processTC(chatId, lineas);},  
  "NUEVA TARJETA": (chatId, lineas) => { createNewCard(lineas);}
};

function routeTarjetaFechas_(chatId, lineas, tipo) {
  if (CMD_TO_FIELD && CMD_TO_FIELD[tipo]) {
    setCardDate_(chatId, lineas, tipo);
    return true;
  }
  return false;
}
