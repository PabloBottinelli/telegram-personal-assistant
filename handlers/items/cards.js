function itemListCardsMsg(){
    itemListMsg(TABLA_TARJETAS, MSG_ERRORS.METODO_TARJETA_LISTA_HEADER, MSG_ERRORS.METODO_TARJETA_LISTA_FOOTER);
}

function setCardDate_(chatId, lines, type) {
  const fechaBruta = (lines[1] || "").trim();
  const ymd = parseDateYyyymmdd_(fechaBruta);
  if (!ymd) { 
    sendTelegram(MSG_ERRORS.FECHA_INVALIDA_STRICT + `\n\nEj:\n${type}\n2025-09-27`); 
  }else {
    const newState = { esperandoMetodoFecha: true, campoFecha: CMD_TO_FIELD[type], fechaBruta, timestamp: Date.now() };
    saveState_(chatId, newState);
    itemListCardsMsg();
  }
}

function setFechaTarjetaRenombrarChe_(tarjetaNombre, campoClave, fechaTexto) {
  const sh = getSheet_(SHEET_LISTAS);
  const row = findItemRow_(tarjetaNombre, TABLA_TARJETAS);
  if (!row) throw new Error("Tarjeta no encontrada: " + tarjetaNombre);

  const offset = TARJETA_FIELD_TO_OFFSET[campoClave];
  if (typeof offset !== 'number') throw new Error("Campo de tarjeta inválido: " + campoClave);

  const localNoon = ymdStringToLocalNoonDate_(fechaTexto);

  const cell = sh.getRange(row, TABLA_TARJETAS.startCol + offset);
  cell.setValue(localNoon);
}