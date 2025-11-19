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

function sendTotals(lines) {
  const todayYear = new Date().getFullYear();
  const month = parseMonth_(lines[1]);
  if (month === null) {
    sendTelegram(MSG_ERRORS.INVALID_MONTH);
    return;
  }

  const sheetSpents = getSheet_(SHEET_GASTOS.name);
  const sheetIncomes = getSheet_(SHEET_INGRESOS.name);

  const spentTotals = computeSpentTotals_(sheetSpents,  todayYear, month.monthNumber);
  const incomeTotals = computeIncomeTotals_(sheetIncomes, todayYear, month.monthNumber);

  const msg =
    `Totales de ${month.monthText}:\n` +
    `Gastos del mes en pesos: ${fmtARS_(spentTotals.ars)}\n` +
    `Gastos del mes en USD: ${fmtUSDplain_(spentTotals.usd)} USD\n` +
    `Ingresos del mes en pesos: ${fmtARS_(incomeTotals.ars)}\n` +
    `Ingresos del mes en USD: ${fmtUSDplain_(incomeTotals.usd)} USD`;

  sendTelegram(msg);
}

function computeSpentTotals_(sheet, year, monthNumber) {
  const lastRow = sheet.getLastRow();
  const values = sheet.getRange(START_ROW, START_COL, lastRow - 1, SHEET_GASTOS.headers.length).getValues();

  const h = SHEET_GASTOS.headers;
  const idxFecha = h.indexOf('Fecha');
  const idxCategoria = h.indexOf('Categoría');
  const idxMonto = h.indexOf('Monto');
  const idxMoneda = h.indexOf('Moneda');
  const idxAhorro = h.indexOf('Ahorro');
  let ars = 0;
  let usd = 0;

  for (const row of values) {
    const date = row[idxFecha];
    if(date.getFullYear() !== year || date.getMonth() !== monthNumber){ continue; }

    const category = row[idxCategoria];
    if (category === 'Ajeno') continue;

    const amount   = Number(row[idxMonto]);
    const saving   = Number(row[idxAhorro]);
    const currency = row[idxMoneda];

    const effectiveAmount = amount - saving;

    if (currency === 'ARS') {
      ars += effectiveAmount;
    } else if (currency === 'USD' || currency === 'USDT') {
      usd += effectiveAmount;
    }
  }

  return { ars, usd };
}

function computeIncomeTotals_(sheet, year, monthNumber) {
  const lastRow = sheet.getLastRow();
  const values = sheet.getRange(START_ROW, START_COL, lastRow - 1, SHEET_INGRESOS.headers.length).getValues();

  const h = SHEET_INGRESOS.headers;
  const idxFecha = h.indexOf('Fecha');
  const idxMonto = h.indexOf('Monto');
  const idxMoneda = h.indexOf('Moneda');

  let ars = 0;
  let usd = 0;

  for (const row of values) {
    const date = row[idxFecha];
    if(date.getFullYear() !== year || date.getMonth() !== monthNumber){ continue; }

    const amount   = Number(row[idxMonto]);
    const currency = row[idxMoneda];

    if (currency === 'ARS') {
      ars += amount;
    } else if (currency === 'USD' || currency === 'USDT') {
      usd += amount;
    }
  }

  return { ars, usd };
}

