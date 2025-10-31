function ymdStringToLocalNoonDate_(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || '').trim());
  if (!m) return null;

  const y  = +m[1];
  const mo = +m[2];
  const d  = +m[3];

  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;

  const dt = new Date(y, mo - 1, d);
  dt.setHours(12, 0, 0, 0);

  return dt;
}


function fmtDateYMD_(d) {
  const tz = Session.getScriptTimeZone();
  return d instanceof Date ? Utilities.formatDate(d, tz, "yyyy-MM-dd") : String(d || "");
}

function todayNoon_() {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  return d;
}


