function doPost(e) {
  let update = null;

  try {
    update = parseTelegramUpdate_(e);

    if (!update) return;
    if (!isAuthorized_(update)) return;

    handleIncomingUpdate_(update);

  } catch (err) {
    handleBotError_(err, update?.chatId);
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

