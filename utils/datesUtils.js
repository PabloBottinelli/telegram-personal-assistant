function dmStringToLocalNoonDate_(s) {
  const m = /^(\d{1,2})\/(\d{1,2})$/.exec(String(s || '').trim());
  if (!m) return null;

  const d  = +m[1];
  const mo = +m[2];
  const y  = new Date().getFullYear();

  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;

  const dt = new Date(y, mo - 1, d);
  dt.setHours(12, 0, 0, 0);

  return dt;
}


function dateToStringDM_(d) {
  const tz = Session.getScriptTimeZone();
  return d instanceof Date ? Utilities.formatDate(d, tz, "dd/MM/yyyy") : String(d || "");
}

function todayNoon_() {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  return d;
}


