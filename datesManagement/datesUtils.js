// Acepta exactamente YYYY-MM-DD. Devuelve {y,m,d} o null.
function _parseFechaYyyymmdd_(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || '').trim());
  if (!m) return null;
  const y = +m[1], mo = +m[2], d = +m[3];
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null; // simple
  return { y, m: mo, d };
}

function formatYmd_(y, m, d) {
  return Utilities.formatString('%04d-%02d-%02d', y, m, d);
}

// YYYY-MM-DD -> Date local 12:00 (evita desfases)
function ymdStringToLocalNoonDate_(s) {
  const m = _parseFechaYyyymmdd_(s);
  if (!m) return null;
  const d = new Date(m.y, m.m - 1, m.d);
  d.setHours(12, 0, 0, 0);
  return d;
}

function _fmtFechaYMD_(d) {
  const tz = Session.getScriptTimeZone();
  return d instanceof Date ? Utilities.formatDate(d, tz, "yyyy-MM-dd") : String(d || "");
}

function todayNoon_() {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  return d;
}
