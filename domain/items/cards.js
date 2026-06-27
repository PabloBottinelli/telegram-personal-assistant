const METODO_TARJETA_LISTA_FOOTER = "\nO escribí NUEVA seguido del nombre para agregar un método nuevo (ej: NUEVA BBVA VISA)";
const METODO_TARJETA_LISTA_HEADER = "Seleccioná una tarjeta escribiendo el NÚMERO:\n\n";

const TARJETA_FIELD_TO_OFFSET = {
  'ULTIMO CIERRE': 1,
  'ULTIMO VENCIMIENTO': 2,
  'PROXIMO CIERRE': 3,
  'PROXIMO VENCIMIENTO': 4
};

function itemListCardsMsg(){
  itemListMsg(SHEET_TARJETAS.name, METODO_TARJETA_LISTA_HEADER, METODO_TARJETA_LISTA_FOOTER);
}

function listCards(){
  listItems(SHEET_TARJETAS.name, 'Estas son las tarjetas:\n')
}

function createNewCard(lines) {
  const nombre = (lines[1] || "").trim();
  if (!nombre) { 
    sendTelegram(MSG_FORMAT_ERROR_BASE + FORMATS["NUEVA TARJETA"]); 
  }else {
    saveItem_(nombre, SHEET_TARJETAS.name);
    sendTelegram(`✅ Tarjeta agregada: "${nombre}".`);
  }
}

function setCardDate(chatId, lines, type) {
  const fechaBruta = (lines[1] || "").trim();
  const d = parseDayMonthForDueOrClose_(fechaBruta);
  if (!d) { 
    sendTelegram(MSG_ERRORS.FECHA_INVALIDA_STRICT + `\n\nEj:\n${type}\n31/10`); 
    return;
  }
  const newState = { 
    esperandoMetodoFecha: true, 
    campoFecha: type, 
    fecha: d, 
    datos: {}, 
    timestamp: Date.now() 
  };
  saveState_(chatId, newState);
  itemListCardsMsg();
}

function updateCardDate_(tarjetaNombre, campoClave, fecha) {
  const sh = getSheet_(SHEET_TARJETAS.name);
  const row = findItemRow_(tarjetaNombre, SHEET_TARJETAS.name, sh.getLastColumn());

  if (!row) throw new Error("Tarjeta no encontrada: " + tarjetaNombre);
  
  const cols = getHeaderMapFromSheet_(sh);

  const campoToHeader = {
    "ULTIMO CIERRE": "Último cierre",
    "ULTIMO VENCIMIENTO": "Último vencimiento",
    "PROXIMO CIERRE": "Próximo Cierre",
    "PROXIMO VENCIMIENTO": "Próximo Vencimiento"
  };
  
  const header = campoToHeader[campoClave];

  if (!header) {
    throw new Error("Campo de tarjeta inválido: " + campoClave);
  }

  const idx = getRequiredHeaderIndex_(cols, header, SHEET_TARJETAS.name);

  sh.getRange(row, START_COL + idx).setValue(fecha);
}

function sendCardDates() {
  const sh = getSheet_(SHEET_TARJETAS.name);
  const values = getTableValues_(sh, sh.getLastColumn());
  const cols = getHeaderMapFromSheet_(sh);

  if (!hasData_(values)) {
    sendTelegram("Fechas de Tarjetas\n(no hay tarjetas cargadas)");
    return;
  }

  const fmtDate = (v) => v instanceof Date
    ? dateToStringDM_(v)
    : "-";

  const bloques = [];

  for (let i = 0; i < values.length; i++) {
    const card = cardFromRow_(values[i], cols);

    const nombreStr = String(card.nombre || "").trim();
    if (!nombreStr) continue;

    const line1 = nombreStr;
    const line2 =
      `FUC: ${fmtDate(card.ultimoCierre)} | ` +
      `FUV: ${fmtDate(card.ultimoVencimiento)} | ` +
      `FPC: ${fmtDate(card.proximoCierre)} | ` +
      `FPV: ${fmtDate(card.proximoVencimiento)}`;

    bloques.push(line1 + "\n" + line2);
  }

  if (bloques.length === 0) {
    sendTelegram("Fechas de Tarjetas\n(no hay tarjetas cargadas)");
  } else {
    sendTelegram("Fechas de Tarjetas\n\n" + bloques.join("\n\n"));
  }
}




