function handleCommand_(chatId, parts) {
  if (!parts || parts.length === 0) {
    sendTelegram(MSG_ERRORS.INVALID_COMMAND);
    return;
  }

  const commandName = parts[0].trim().toUpperCase()
  const command = COMMANDS[commandName];

  if (!command) {
    sendTelegram(MSG_ERRORS.INVALID_COMMAND);
    return;
  }

  if (command.validLengths && !command.validLengths.includes(parts.length)) {
    sendTelegram(MSG_FORMAT_ERROR_BASE + command.format_indication);
    return;
  }

  command.handler(chatId, parts);
}

function sendCommandMenu() {
  const lines = [];

  for (const commandKey of Object.keys(COMMANDS)) {
    const fmt = COMMANDS[commandKey].format_indication
    if (!fmt) {
      sendTelegram(`Falta el formato para la ruta: ${commandKey }`); 
      return;
    }
    lines.push(`*${commandKey }*\n${fmt}`);
  }

  const msg = lines.join("\n\n");
  sendTelegram(msg);
}


const COMMANDS = {
  "COMANDOS": {
    validLengths: [1],
    format_indication: "Para obtener la lista de comandos escribí COMANDOS",
    handler: (chatId, parts) => sendCommandMenu()
  },

  "CATEGORIAS": {
    validLengths: [1],
    format_indication: "Para obtener la lista de categorías escribí CATEGORIAS",
    handler: (chatId, parts) => listCategories()
  },

  "TARJETAS": {
    validLengths: [1],
    format_indication: "Para obtener la lista de tarjetas escribí TARJETAS",
    handler: (chatId, parts) => listCards()
  },

  "TOTALES": {
    validLengths: [2],
    format_indication: "Escribí: \nTOTALES \nMes (1-12 o el nombre del mes)",
    handler: (chatId, parts) => sendTotals(parts)
  },

  "REINTEGROS": {
    validLengths: [1],
    format_indication: "Para obtener la lista de reintegros pendientes escribí REINTEGROS",
    handler: (chatId, parts) => sendRefunds()
  },

  "MARCAR REINTEGRADO": {
    validLengths: [1],
    format_indication: "Para marcar un reintegro pendiente como reintegrado escribí MARCAR REINTEGRADO",
    handler: (chatId, parts) => initMarkAsRefunded(chatId)
  },

  "FECHAS": {
    validLengths: [1],
    format_indication: "Para ver las fechas de tus tarjetas escribí FECHAS",
    handler: (chatId, parts) => sendCardDates()
  },

  "GASTO": {
    validLengths: [4, 9],
    format_indication: "Para registrar un gasto escribí: \n GASTO \nFecha (dd/mm o -) \nMonto \nMoneda (USD, USDT o ARS) \nMedio de pago \nAhorro (% o monto) \nDetalle \nDescuento o reintegro? (D o R o -) \nReintegro/Descuento Pagado?(Si/No/-) \n\nModo Rápido: GASTO, Monto, Medio, Detalle",
    handler: (chatId, parts) => processSpent(chatId, parts)
  },

  "INGRESO": {
    validLengths: [3, 5],
    format_indication: "Para registrar un ingreso escribí: \n INGRESO \nFecha (dd/mm o -) \nMonto \nMoneda (USD, USDT o ARS) \nDescripcion \n\nModo Rápido: INGRESO, Monto, Detalle",
    handler: (chatId, parts) => processIncome(chatId, parts)
  },

  "TC": {
    validLengths: [3, 9],
    format_indication: "Para registrar un gasto con tarjeta de crédito escribí: \n TC \nFecha (dd/mm o -) \nMonto \nMoneda (USD, USDT o ARS) \nAhorro \n#Cuotas \nDetalle \nDescuento o reintegro? (D o R o -) \nReintegro Pagado?(Si/No/-) \n\nModo Rápido: TC, Monto, Detalle",
    handler: (chatId, parts) => processTC(chatId, parts)
  },

  "RESUMEN": {
    validLengths: [1],
    format_indication: "Para obtener los resúmenes de tus tarjetas escribí RESUMEN",
    handler: (chatId, parts) => sendStatements()
  },

  "DEUDA": {
    validLengths: [4],
    format_indication: "Para registrar una deuda escribí: \nDEUDA\nMonto\nMoneda\nDetalle",
    handler: (chatId, parts) => processDebt(chatId, parts)
  },

  "DEUDAS": {
    validLengths: [1],
    format_indication: "Para obtener la lista de deudas activas escribí DEUDAS",
    handler: (chatId, parts) => sendDebts()
  },

  "DEUDORES": {
    validLengths: [1],
    format_indication: "Para obtener la lista de deudores activas escribí DEUDORES",
    handler: (chatId, parts) => listDebtors()
  },

  "PAGO DEUDA": {
    validLengths: [2],
    format_indication: "Para registrar un pago de deuda escribí:\nPAGO DEUDA\nMonto",
    handler: (chatId, parts) => processDebtPaymentStart(chatId, parts)
  },

  "NUEVA TARJETA": {
    validLengths: [2],
    format_indication: "Para guardar una nueva tarjeta escribí: \nNUEVA TARJETA \nNombre",
    handler: (chatId, parts) => createNewCard(parts)
  },

  "ULTIMO CIERRE": {
    validLengths: [2],
    format_indication: "Para guardar la fecha de último cierre de una tarjeta escribí: \nULTIMO CIERRE \nFecha (dd/mm)",
    handler: (chatId, parts) => setCardDate(chatId, parts, "ULTIMO CIERRE")
  },

  "ULTIMO VENCIMIENTO": {
    validLengths: [2],
    format_indication: "Para guardar la fecha de último vencimiento de una tarjeta escribí: \nULTIMO VENCIMIENTO \nFecha (dd/mm)",
    handler: (chatId, parts) => setCardDate(chatId, parts, "ULTIMO VENCIMIENTO")
  },

  "PROXIMO CIERRE": {
    validLengths: [2],
    format_indication: "Para guardar la fecha de próximo cierre de una tarjeta escribí: \nPROXIMO CIERRE \nFecha (dd/mm)",
    handler: (chatId, parts) => setCardDate(chatId, parts, "PROXIMO CIERRE")
  },

  "PROXIMO VENCIMIENTO": {
    validLengths: [2],
    format_indication: "Para guardar la fecha de próximo vencimiento de una tarjeta escribí: \nPROXIMO VENCIMIENTO \nFecha (dd/mm)",
    handler: (chatId, parts) => setCardDate(chatId, parts, "PROXIMO VENCIMIENTO")
  },

  "RECORDATORIO": {
    minLength: 2,
    format_indication: "Para crear un recordatorio escribí: \nRECORDATORIO \nDescripción",
    handler: (chatId, parts) => createReminder(chatId, parts)
  }
};

