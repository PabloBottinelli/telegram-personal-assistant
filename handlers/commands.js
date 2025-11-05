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

const ROUTES = {
  "COMANDOS": (chatId, lineas) => sendCommandMenu(),
  "CATEGORIAS": (chatId, lineas) => listCategories(),
  "TARJETAS": (chatId, lineas) => listCards(),
  "TOTALES": (chatId, lineas) => sendTotals(),
  "REINTEGROS": (chatId, lineas) => sendRefunds(),
  "MARCAR REINTEGRADO": (chatId, lineas) => initMarkAsRefunded(chatId),
  "FECHAS": (chatId, lineas) => sendCardDates(),
  "GASTO": (chatId, lineas) => { if (lineas.length !== 8) { sendTelegram(MSG_FORMAT_ERROR_BASE + FORMATS["GASTO"]); return; } processSpent(chatId, lineas);},
  "INGRESO": (chatId, lineas) => { if (lineas.length !== 5) { sendTelegram(MSG_FORMAT_ERROR_BASE + FORMATS["INGRESO"]); return; } processIncome(chatId, lineas);},
  "TC": (chatId, lineas) => { if (lineas.length !== 8) { sendTelegram(MSG_FORMAT_ERROR_BASE + FORMATS["TC"]); return; } processTC(chatId, lineas);},  
  "NUEVA TARJETA": (chatId, lineas) => { createNewCard(lineas);},
  "ULTIMO CIERRE": (chatId, lineas) => setCardDate(chatId, lineas, "ULTIMO CIERRE"),
  "ULTIMO VENCIMIENTO": (chatId, lineas) => setCardDate(chatId, lineas, "ULTIMO VENCIMIENTO"),
  "PROXIMO CIERRE": (chatId, lineas) => setCardDate(chatId, lineas, "PROXIMO CIERRE"),
  "PROXIMO VENCIMIENTO": (chatId, lineas) => setCardDate(chatId, lineas, "PROXIMO VENCIMIENTO")
};

const FORMATS = {
  "COMANDOS": "Escribí y esperá: \nCOMANDOS",
  "CATEGORIAS": "Escribí y esperá: \nCATEGORIAS",
  "TARJETAS": "Escribí y esperá: \nTARJETAS",
  "TOTALES": "Escribí y esperá: \nTOTALES",
  "REINTEGROS": "Escribí y esperá: \nREINTEGROS",
  "MARCAR REINTEGRADO": "Escribí y esperá a que se solicite más información: \nMARCAR REINTEGRADO",
  "FECHAS": "Escribí: \nFECHAS",
  "GASTO": "Escribí: \nFecha (dd/mm o -) \nMonto \Moneda (USD, USDT o ARS) \nMedio de pago \nAhorro (% o monto) \nDetalle \nReintegro Pagado?(Si/No/-)",
  "INGRESO": "Escribí: \nFecha (dd/mm o -) \nMonto \nMoneda (USD, USDT o ARS) \nDescripcion",
  "TC": "Escribí: \nFecha (dd/mm o -) \nMonto \nMoneda (USD, USDT o ARS) \nAhorro \n#Cuotas \nDetalle \nReintegro Pagado?(Si/No/-)",
  "NUEVA TARJETA": "Escribí: \nNUEVA TARJETA \nNombre",
  "ULTIMO CIERRE": "Escribí: \nULTIMO CIERRE \nFecha (dd/mm)",
  "ULTIMO VENCIMIENTO": "Escribí: \nULTIMO VENCIMIENTO \nFecha (dd/mm)",
  "PROXIMO CIERRE": "Escribí: \nPROXIMO CIERRE \nFecha (dd/mm)",
  "PROXIMO VENCIMIENTO": "Escribí: \nPROXIMO VENCIMIENTO \nFecha (dd/mm)"
}

const MSG_FORMAT_ERROR_BASE = "Usá el formato correcto para ese comando\n";