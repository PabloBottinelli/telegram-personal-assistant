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

    if (!COMMANDS.includes(tipo)) {
      sendTelegram(MSG_COMMANDS.ELEGIR_COMANDO);
      return;
    }

    routeCommand_(tipo, lineas, chatId);
  } catch (err) {
    sendTelegram(MSG_ERRORS.ERROR_GENERIC + (err.stack || err.message));
  }
}

function routeCommand_(tipo, lineas, chatId) {
  if (tipo === "FECHAS") { sendCardDates_(); return; }

  if (tipo === "MARCAR REINTEGRADO") { iniciarMarcarReintegrado(chatId); return; }
  
  if (tipo === "REINTEGROS") { sendRefunds(); return; }

  if (tipo === "TOTALES") { sendTotals(); return; }

  if (tipo === "COMANDOS") { sendCommandMenu(); return; }

  if (tipo === "NUEVA TARJETA") { createNewCard(lineas); return; }

  if (CMD_TO_FIELD[tipo]) { setCardDate_(chatId, lineas, tipo); return; }

  if (tipo === "GASTO")   { if (lineas.length !== 8) { sendTelegram(MSG_COMMANDS.FORMATO_GASTO);   return; } processSpent(chatId, lineas);   return; }
  
  if (tipo === "INGRESO") { if (lineas.length !== 5) { sendTelegram(MSG_COMMANDS.FORMATO_INGRESO); return; } processIncome(chatId, lineas); return; }
  
  if (tipo === "TC")      { if (lineas.length !== 8) { sendTelegram(MSG_COMMANDS.FORMATO_TC);      return; } processTC(chatId, lineas);      return; }
}

// const ROUTES = {
//   "COMANDOS": (chatId, lineas) => sendCommandMenu(),
//   "TOTALES": (chatId, lineas) => sendTotals(),
//   "REINTEGROS": (chatId, lineas) => sendRefunds(),
//   "MARCAR REINTEGRADO": (chatId, lineas) => iniciarMarcarReintegrado(chatId),
//   "FECHAS": (chatId, lineas) => sendCardDates_(),
//   "GASTO": (chatId, lineas) => { if (lineas.length !== 8) { sendTelegram(MSG_COMMANDS.FORMATO_GASTO); return; } processSpent(chatId, lineas);},
//   "INGRESO": (chatId, lineas) => { if (lineas.length !== 5) { sendTelegram(MSG_COMMANDS.FORMATO_INGRESO); return; } processIncome(chatId, lineas);},
//   "TC": (chatId, lineas) => { if (lineas.length !== 8) { sendTelegram(MSG_COMMANDS.FORMATO_TC); return; } processTC(chatId, lineas);},  
//   "NUEVA TARJETA": (chatId, lineas) => { createNewCard(lineas);}
// };

// // Setters de fechas de tarjeta (mapeados por config)
// // Ej.: "ULTIMO CIERRE", "ULTIMO VENCIMIENTO", "PROXIMO CIERRE", "PROXIMO VENCIMIENTO"
// function routeTarjetaFechas_(chatId, lineas, tipo) {
//   if (CMD_TO_FIELD && CMD_TO_FIELD[tipo]) {
//     setCardDate_(chatId, lineas, tipo);
//     return true;
//   }
//   return false;
// }
