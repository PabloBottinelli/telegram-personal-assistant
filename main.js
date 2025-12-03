function doPost(e) {
  try {
    const contents = JSON.parse(e.postData.contents);
    const message = contents.message?.text?.trim();
    const chatId = String(contents.message?.chat?.id);
    if (chatId !== TELEGRAM_CHAT_ID) return;

    let userState = loadState_(chatId);

    if(userState){
      if (userState.esperandoReintegroIdx) { handleMarkAsRefundedResponse_(chatId, message, userState); return; }
      if (userState.esperandoCategoria)   { handleItemResponse(chatId, SHEET_CATEGORIAS.name, message, userState); return; }
      if (userState.esperandoMetodo || userState.esperandoMetodoFecha) { handleItemResponse(chatId, SHEET_TARJETAS.name, message, userState); return; }
      if (userState.esperandoTipoDeRecordatorio) { handleReminderTypeResponse(chatId, message, userState); return; }
      if (userState.esperandoDiasSemana) { handleReminderWeekdayResponse(chatId, message, userState); return; }
      if (userState.esperandoDiasSemanaMultiples) { handleReminderMultiWeekdaysResponse(chatId, message, userState); return;}
      if (userState.esperandoCadaNDias) { handleReminderEveryNDaysResponse(chatId, message, userState); return; }
      if (userState.esperandoDiaMes) { handleReminderDayOfMonthResponse(chatId, message, userState); return; }
      if (userState.esperandoFechaUnica) { handleReminderOnceDateResponse(chatId, message, userState); return; }
      if (userState.esperandoHoraRecordatorio) { handleReminderTimeResponse(chatId, message, userState); return; }
    }
    

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
    statesReset();
  }
}


