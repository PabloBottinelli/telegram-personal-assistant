function sendTelegram(text) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  const payload = { method: "post", payload: { chat_id: TELEGRAM_CHAT_ID, text: text } };
  UrlFetchApp.fetch(url, payload);
}

function sendMenuComandos() {
  sendTelegram(MSG.COMANDOS);
}
