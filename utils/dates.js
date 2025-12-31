function parseDayMonthForTransaction_(s) {
  return dayMonthStringToLocalNoonDate_(s, "CURRENT_YEAR");
}

function parseDayMonthForDueOrClose_(s) {
  return dayMonthStringToLocalNoonDate_(s, "NEXT_IF_PAST");
}

function dayMonthStringToLocalNoonDate_(s, yearMode) {
  const m = /^(\d{1,2})\/(\d{1,2})$/.exec(String(s || '').trim());
  if (!m) return null;

  const d  = +m[1];
  const mo = +m[2];
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;

  const now = new Date();
  const todayNoon = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);

  let y = now.getFullYear();
  let dt = new Date(y, mo - 1, d, 12, 0, 0, 0);

  if (yearMode === "NEXT_IF_PAST") {
    if (dt.getTime() < todayNoon.getTime()) {
      y += 1;
      dt = new Date(y, mo - 1, d, 12, 0, 0, 0);
    }
  } 

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

function noonTs_(d) {
  const x = new Date(d);
  x.setHours(12,0,0,0);
  return x.getTime();
}

function parseDDMMYYYY_(s) {
  const m = String(s).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const dd = Number(m[1]), mm = Number(m[2]), yy = Number(m[3]);
  const d = new Date(yy, mm - 1, dd, 12, 0, 0, 0);
  if (d.getFullYear() !== yy || d.getMonth() !== mm - 1 || d.getDate() !== dd) return null;
  return d;
}

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

function parseMonth_(input) {
  if (!input) return null;
  const raw = input.trim().toLowerCase();

  if (raw === '-') {
    const today = new Date();
    const monthNumber = today.getMonth();
    const monthText = MONTH_NAMES[monthNumber];
    return { monthNumber, monthText };
  }

  const num = Number(raw);
  if (!isNaN(num) && num >= 1 && num <= 12) {
    const monthNumber = num - 1;
    const monthText = MONTH_NAMES[monthNumber];
    return { monthNumber, monthText };
  }

  const meses = {
    "enero": 1, "febrero": 2, "marzo": 3, "abril": 4, "mayo": 5, "junio": 6, "julio": 7, 
    "agosto": 8, "septiembre": 9, "setiembre": 9, "octubre": 10, "noviembre": 11, "diciembre": 12,
  };

  if (raw in meses) {
    const numMonth = meses[raw];    // 1–12
    const monthNumber = numMonth - 1;    // 0–11
    const monthText = MONTH_NAMES[monthNumber];
    return { monthNumber, monthText };
  }

  return null;
}

function sameLocalDay_(a, b) {
  return a instanceof Date && b instanceof Date &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}