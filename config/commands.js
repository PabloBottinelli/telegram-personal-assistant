const COMMANDS = {
  "COMANDOS": {
    validLengths: [1],
    format_indication: "Para obtener la lista de comandos escribí COMANDOS",
    handler: (chatId, parts) => sendCommandMenu()
  },

  "CATEGORIAS": {
    validLengths: [1],
    format_indication: "Para obtener la lista de categorías escribí CATEGORIAS",
    handler: (chatId, parts) => CategoryCommand.list()
  },

  "TARJETAS": {
    validLengths: [1],
    format_indication: "Para obtener la lista de tarjetas escribí TARJETAS",
    handler: (chatId, parts) => CreditCardCommand.list()
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
    handler: (chatId, parts) => CreditCardRepository.sendCardDates()
  },

  "GASTO": {
    validLengths: [4, 9],
    format_indication: "Para registrar un gasto escribí: \n GASTO \nFecha (dd/mm o -) \nMonto \nMoneda (USD, USDT o ARS) \nMedio de pago \nAhorro (% o monto) \nDetalle \nDescuento o reintegro? (D o R o -) \nReintegro/Descuento Pagado?(Si/No/-) \n\nModo Rápido: GASTO, Monto, Medio, Detalle",
    handler: (chatId, parts) => ExpenseCommand.handle(chatId, parts)
  },

  "INGRESO": {
    validLengths: [3, 5],
    format_indication: "Para registrar un ingreso escribí: \n INGRESO \nFecha (dd/mm o -) \nMonto \nMoneda (USD, USDT o ARS) \nDescripcion \n\nModo Rápido: INGRESO, Monto, Detalle",
    handler: (chatId, parts) => IncomeCommand.handle(chatId, parts)
  },

  "TC": {
    validLengths: [3, 9],
    format_indication: "Para registrar un gasto con tarjeta de crédito escribí: \n TC \nFecha (dd/mm o -) \nMonto \nMoneda (USD, USDT o ARS) \nAhorro \n#Cuotas \nDetalle \nDescuento o reintegro? (D o R o -) \nReintegro Pagado?(Si/No/-) \n\nModo Rápido: TC, Monto, Detalle",
    handler: (chatId, parts) => CreditCardExpenseCommand.handle(chatId, parts)
  },

  "RESUMEN": {
    validLengths: [1],
    format_indication: "Para obtener los resúmenes de tus tarjetas escribí RESUMEN",
    handler: (chatId, parts) => sendStatements()
  },

  "DEUDA": {
    validLengths: [4],
    format_indication: "Para registrar una deuda escribí: \nDEUDA\nMonto\nMoneda\nDetalle",
    handler: (chatId, parts) => DebtCommand.handle(chatId, parts)
  },

  "DEUDAS": {
    validLengths: [1],
    format_indication: "Para obtener la lista de deudas activas escribí DEUDAS",
    handler: (chatId, parts) => DebtCommand.sendDebts()
  },

  "DEUDORES": {
    validLengths: [1],
    format_indication: "Para obtener la lista de deudores activas escribí DEUDORES",
    handler: (chatId, parts) => DebtorCommand.list()
  },

  "PAGO DEUDA": {
    validLengths: [2],
    format_indication: "Para registrar un pago de deuda escribí:\nPAGO DEUDA\nMonto",
    handler: (chatId, parts) => DebtPaymentCommand.handle(chatId, parts)
  },

  "NUEVA TARJETA": {
    validLengths: [2],
    format_indication: "Para guardar una nueva tarjeta escribí: \nNUEVA TARJETA \nNombre",
    handler: (chatId, parts) => CreditCardCommand.createNewCard(parts)
  },

  "ULTIMO CIERRE": {
    validLengths: [2],
    format_indication: "Para guardar la fecha de último cierre de una tarjeta escribí: \nULTIMO CIERRE \nFecha (dd/mm)",
    handler: (chatId, parts) => CreditCardCommand.handleChangeDate(chatId, parts, "ULTIMO CIERRE")
  },

  "ULTIMO VENCIMIENTO": {
    validLengths: [2],
    format_indication: "Para guardar la fecha de último vencimiento de una tarjeta escribí: \nULTIMO VENCIMIENTO \nFecha (dd/mm)",
    handler: (chatId, parts) => CreditCardCommand.handleChangeDate(chatId, parts, "ULTIMO VENCIMIENTO")
  },

  "PROXIMO CIERRE": {
    validLengths: [2],
    format_indication: "Para guardar la fecha de próximo cierre de una tarjeta escribí: \nPROXIMO CIERRE \nFecha (dd/mm)",
    handler: (chatId, parts) => CreditCardCommand.handleChangeDate(chatId, parts, "PROXIMO CIERRE")
  },

  "PROXIMO VENCIMIENTO": {
    validLengths: [2],
    format_indication: "Para guardar la fecha de próximo vencimiento de una tarjeta escribí: \nPROXIMO VENCIMIENTO \nFecha (dd/mm)",
    handler: (chatId, parts) => CreditCardCommand.handleChangeDate(chatId, parts, "PROXIMO VENCIMIENTO")
  },

  "RECORDATORIO": {
    validLengths: [2],
    format_indication: "Para crear un recordatorio escribí: \nRECORDATORIO \nDescripción",
    handler: (chatId, parts) => createReminder(chatId, parts)
  }
};

