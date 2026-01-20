const ROUTES = {
  "COMANDOS": (chatId, lineas) => sendCommandMenu(),
  "CATEGORIAS": (chatId, lineas) => listCategories(),
  "TARJETAS": (chatId, lineas) => listCards(),
  "TOTALES": (chatId, lineas) => { if(lineas.length !== 2) { sendTelegram(MSG_FORMAT_ERROR_BASE + FORMATS["TOTALES"]); return; } sendTotals(lineas); },
  "REINTEGROS": (chatId, lineas) => sendRefunds(),
  "MARCAR REINTEGRADO": (chatId, lineas) => initMarkAsRefunded(chatId),
  "FECHAS": (chatId, lineas) => sendCardDates(),
  "GASTO": (chatId, lineas) => { if (lineas.length !== 9 || lineas.length !== 4) { sendTelegram(MSG_FORMAT_ERROR_BASE + FORMATS["GASTO"]); return; } processSpent(chatId, lineas);},
  "INGRESO": (chatId, lineas) => { if (lineas.length !== 5 || lineas.length !== 3) { sendTelegram(MSG_FORMAT_ERROR_BASE + FORMATS["INGRESO"]); return; } processIncome(chatId, lineas);},
  "TC": (chatId, lineas) => { if (lineas.length !== 9 || lineas.length !== 3) { sendTelegram(MSG_FORMAT_ERROR_BASE + FORMATS["TC"]); return; } processTC(chatId, lineas);},  
  "NUEVA TARJETA": (chatId, lineas) => { createNewCard(lineas);},
  "ULTIMO CIERRE": (chatId, lineas) => setCardDate(chatId, lineas, "ULTIMO CIERRE"),
  "ULTIMO VENCIMIENTO": (chatId, lineas) => setCardDate(chatId, lineas, "ULTIMO VENCIMIENTO"),
  "PROXIMO CIERRE": (chatId, lineas) => setCardDate(chatId, lineas, "PROXIMO CIERRE"),
  "PROXIMO VENCIMIENTO": (chatId, lineas) => setCardDate(chatId, lineas, "PROXIMO VENCIMIENTO"),
  "RECORDATORIO": (chatId, lineas) => { if (lineas.length < 2) { sendTelegram(MSG_FORMAT_ERROR_BASE + FORMATS["RECORDATORIO"]); return; } createReminder(chatId, lineas);},
  "RESUMEN":  (chatId, lineas) => { if (lineas.length != 1) { sendTelegram(MSG_FORMAT_ERROR_BASE + FORMATS["RESUMEN"]); return; } sendStatements();},
};

function sendCommandMenu() {
  const lines = [];

  for (const name of Object.keys(ROUTES)) {
    const fmt = FORMATS[name];
    if (!fmt) continue;
    lines.push(`*${name}*\n${fmt}`);
  }

  const msg = lines.join("\n\n");
  sendTelegram(msg);
}
