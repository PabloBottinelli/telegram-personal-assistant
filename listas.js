function leerColumnaComoLista_(sheet, startCol) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const values = sheet.getRange(2, startCol, lastRow - 1, 1).getValues();
  return values.map(r => String(r[0] || '').trim()).filter(v => v !== '');
}

// Row de tarjeta por nombre
function _findTarjetaRow_(nombre) {
  const sh = getSheet_(SHEET_LISTAS);
  const values = getTableValues_(sh, TABLA_TARJETAS);

  if (!hasData_(values)) return null;

  const needle = _norm_(nombre);
  for (let i = 0; i < values.length; i++) {
    if (_norm_(values[i][0]) === needle) return 2 + i;
  }
  return null;
}

// Setea una fecha (como Date local 12:00) en el campo de la tarjeta
function setFechaTarjeta_(tarjetaNombre, campoClave, fechaTexto) {
  const sh = getSheet_(SHEET_LISTAS);
  const row = _findTarjetaRow_(tarjetaNombre);
  if (!row) throw new Error("Tarjeta no encontrada: " + tarjetaNombre);

  const offset = TARJETA_FIELD_TO_OFFSET[campoClave];
  if (typeof offset !== 'number') throw new Error("Campo de tarjeta inválido: " + campoClave);

  const ymd = parseFechaYyyymmdd_(fechaTexto);
  if (!ymd) throw new Error("Fecha inválida (usar YYYY-MM-DD).");

  const localNoon = new Date(ymd.y, ymd.m - 1, ymd.d);
  localNoon.setHours(12, 0, 0, 0);

  const cell = sh.getRange(row, TABLA_TARJETAS.startCol + offset);
  cell.setValue(localNoon);
}
