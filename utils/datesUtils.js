// Acepta exactamente YYYY-MM-DD. Devuelve {y,m,d} o null.
function parseFechaYyyymmdd_(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || '').trim());
  if (!m) return null;
  const y = +m[1], mo = +m[2], d = +m[3];
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null; 
  return { y, m: mo, d };
}

// Devuelve string YYYY-MM-DD
function formatYmd_(y, m, d) {
  return Utilities.formatString('%04d-%02d-%02d', y, m, d);
}

// YYYY-MM-DD -> Date local 12:00 (evita desfases)
function ymdStringToLocalNoonDate_(s) {
  const m = parseFechaYyyymmdd_(s);
  if (!m) return null;
  const d = new Date(m.y, m.m - 1, m.d);
  d.setHours(12, 0, 0, 0);
  return d;
}

function fmtFechaYMD_(d) {
  const tz = Session.getScriptTimeZone();
  return d instanceof Date ? Utilities.formatDate(d, tz, "yyyy-MM-dd") : String(d || "");
}

function todayNoon_() {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  return d;
}

// Setea una fecha (como Date local 12:00) en el campo de la tarjeta
function setFechaTarjeta_(tarjetaNombre, campoClave, fechaTexto) {
  const sh = getSheet_(SHEET_LISTAS);
  const row = findItemRow_(tarjetaNombre, TABLA_TARJETAS);
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
