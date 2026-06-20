function doPost(e) {
  try {
    const contents = JSON.parse(e.postData.contents);
    const message = contents.message?.text?.trim();
    const chatId = String(contents.message?.chat?.id);
    
    if (!message) return;
    if (chatId !== TELEGRAM_CHAT_ID) return;

    let userState = loadState_(chatId);

    if (message.trim().toUpperCase() === "CANCELAR") {
      statesReset();
      sendTelegram("Operación cancelada.");
      return;
    }

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
      if (userState.esperandoDeudaParaPagar) { handleDebtToPayResponse(chatId, message, userState); return; }
      if (userState.esperandoDeudor) { handleDebtorResponse(chatId, message, userState); return; }
    }

    const parts = parseTelegramMessage_(message);

    const tipo = (parts[0] || "").toUpperCase();

    const handler = ROUTES[tipo];
    if (handler) {
      handler(chatId, parts);
      return;
    }

    sendTelegram(MSG_ERRORS.INVALID_COMMAND);
  } catch (err) {
    sendTelegram(MSG_ERRORS.ERROR_GENERIC + (err.stack || err.message));
    statesReset();
  }
}


