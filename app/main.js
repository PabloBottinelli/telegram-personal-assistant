function doPost(e) {
  try {
    const update = parseTelegramUpdate_(e);
    
    if (!update) return;
    if (!isAuthorized_(update)) return;

    handleIncomingUpdate_(update);
    
  } catch (err) {
    handleBotError_(err)
  }
}

function isAuthorized_(update) {
  return update.chatId === TELEGRAM_CHAT_ID;
}

function handleIncomingUpdate_(update) {
  if (isCancelMessage_(update.text)) {
    cancelCurrentState_(update.chatId);
    return;
  }

  const state = loadState_(update.chatId);

  if (state) {
    handleState_(update.chatId, update.text, state);
    return;
  }

  handleCommand_(update);
}

function isCancelMessage_(text) {
  return String(text || "").toUpperCase() === "CANCELAR";
}

function handleLegacyState_(chatId, message, userState) {
  if (userState.esperandoReintegroIdx) {
    handleMarkAsRefundedResponse_(chatId, message, userState);
    return;
  }

  if (userState.esperandoCategoria) {
    handleItemResponse(chatId, SHEET_CATEGORIAS.name, message, userState);
    return;
  }

  if (userState.esperandoMetodo || userState.esperandoMetodoFecha) {
    handleItemResponse(chatId, SHEET_TARJETAS.name, message, userState);
    return;
  }

  if (userState.esperandoTipoDeRecordatorio) {
    handleReminderTypeResponse(chatId, message, userState);
    return;
  }

  if (userState.esperandoDiasSemana) {
    handleReminderWeekdayResponse(chatId, message, userState);
    return;
  }

  if (userState.esperandoDiasSemanaMultiples) {
    handleReminderMultiWeekdaysResponse(chatId, message, userState);
    return;
  }

  if (userState.esperandoCadaNDias) {
    handleReminderEveryNDaysResponse(chatId, message, userState);
    return;
  }

  if (userState.esperandoDiaMes) {
    handleReminderDayOfMonthResponse(chatId, message, userState);
    return;
  }

  if (userState.esperandoFechaUnica) {
    handleReminderOnceDateResponse(chatId, message, userState);
    return;
  }

  if (userState.esperandoHoraRecordatorio) {
    handleReminderTimeResponse(chatId, message, userState);
    return;
  }

  if (userState.esperandoDeudaParaPagar) {
    handleDebtToPayResponse(chatId, message, userState);
    return;
  }

  if (userState.esperandoDeudor) {
    handleDebtorResponse(chatId, message, userState);
    return;
  }

  sendTelegram("❌ Estado no reconocido. Volvé a empezar.");
  statesReset();
}