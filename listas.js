function leerColumnaComoLista_(sheet, startCol) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const values = sheet.getRange(2, startCol, lastRow - 1, 1).getValues();
  return values.map(r => String(r[0] || '').trim()).filter(v => v !== '');
}

// Categorías
function obtenerCategorias() {
  const sh = getSheet_(SHEET_LISTAS);
  const categorias = leerColumnaComoLista_(sh, TABLA_CATEGORIAS.startCol);
  if (categorias.length === 0) {
    const defaults = ['Otros'];
    defaults.forEach(appendCategoria_);
    return defaults;
  }
  return categorias;
}

function guardarCategoria(nuevaCategoria) {
  const nombre = String(nuevaCategoria || '').trim();
  if (!nombre) return;
  const existentes = obtenerCategorias();
  const yaExiste = existentes.some(x => x.toLowerCase() === nombre.toLowerCase());
  if (yaExiste) return;
  appendCategoria_(nombre);
}

function appendCategoria_(nombre) {
  const sh = getSheet_(SHEET_LISTAS);
  const rowIndex = findNextRowInTable_(sh, SHEET_LISTAS);
  sh.getRange(rowIndex, TABLA_CATEGORIAS.startCol, 1, 1).setValues([[nombre]]);
}

// Tarjetas (métodos)
function methodList() {
  const sh = getSheet_(SHEET_LISTAS);
  return leerColumnaComoLista_(sh, TABLA_TARJETAS.startCol);
}

function guardarMetodo(nuevoMetodo) {
  const nombre = String(nuevoMetodo || '').trim();
  if (!nombre) return;
  const existentes = methodList();
  const yaExiste = existentes.some(x => x.toLowerCase() === nombre.toLowerCase());
  if (yaExiste) return;
  appendTarjeta_(nombre);
}

function appendTarjeta_(nombre) {
  const sh = getSheet_(SHEET_LISTAS);
  const rowIndex = findNextRowInTable_(sh, SHEET_LISTAS);
  sh.getRange(rowIndex, TABLA_TARJETAS.startCol, 1, 1).setValues([[nombre]]);
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
