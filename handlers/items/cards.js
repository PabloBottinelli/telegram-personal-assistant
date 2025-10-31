function itemListCardsMsg(){
    itemListMsg(TABLA_TARJETAS, MSG_ERRORS.METODO_TARJETA_LISTA_HEADER, MSG_ERRORS.METODO_TARJETA_LISTA_FOOTER);
}

function setCardDate(chatId, lines, type) {
  const fechaBruta = (lines[1] || "").trim();
  const d = ymdStringToLocalNoonDate_(fechaBruta);
  if (!d) { 
    sendTelegram(MSG_ERRORS.FECHA_INVALIDA_STRICT + `\n\nEj:\n${type}\n2025-09-27`); 
    return;
  }
  const newState = { 
    esperandoMetodoFecha: true, 
    campoFecha: CMD_TO_FIELD[type], 
    fecha: d, 
    timestamp: Date.now() 
  };
  saveState_(chatId, newState);
  itemListCardsMsg();
}

function updateCardDate_(tarjetaNombre, campoClave, fecha) {
  const sh = getSheet_(SHEET_LISTAS);
  const row = findItemRow_(tarjetaNombre, TABLA_TARJETAS);
  if (!row) throw new Error("Tarjeta no encontrada: " + tarjetaNombre);

  const offset = TARJETA_FIELD_TO_OFFSET[campoClave];
  if (typeof offset !== 'number') throw new Error("Campo de tarjeta inválido: " + campoClave);

  const cell = sh.getRange(row, TABLA_TARJETAS.startCol + offset);
  cell.setValue(fecha);
}