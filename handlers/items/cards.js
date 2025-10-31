const METODO_TARJETA_LISTA_FOOTER = "\nO escribí NUEVA seguido del nombre para agregar un método nuevo (ej: NUEVA BBVA VISA)";
const METODO_TARJETA_LISTA_HEADER = "Seleccioná un método escribiendo el NÚMERO:\n\n";

function itemListCardsMsg(){
    itemListMsg(TABLA_TARJETAS, METODO_TARJETA_LISTA_HEADER, METODO_TARJETA_LISTA_FOOTER);
}

function setCardDate(chatId, lines, type) {
  const fechaBruta = (lines[1] || "").trim();
  const d = dmStringToLocalNoonDate_(fechaBruta);
  if (!d) { 
    sendTelegram(MSG_ERRORS.FECHA_INVALIDA_STRICT + `\n\nEj:\n${type}\n31-10`); 
    return;
  }
  const newState = { 
    esperandoMetodoFecha: true, 
    campoFecha: type, 
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