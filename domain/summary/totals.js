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
  const values = getTableValues_(sheet, SHEET_GASTOS.headers.length);
  if (!hasData_(values)) return { ars: 0, usd: 0 };

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
    if (!(date instanceof Date)) continue;
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
  const values = getTableValues_(sheet, SHEET_INGRESOS.headers.length);
  if (!hasData_(values)) return { ars: 0, usd: 0 };

  const h = SHEET_INGRESOS.headers;
  const idxFecha = h.indexOf('Fecha');
  const idxMonto = h.indexOf('Monto');
  const idxMoneda = h.indexOf('Moneda');

  let ars = 0;
  let usd = 0;

  for (const row of values) {
    const date = row[idxFecha];
    if (!(date instanceof Date)) continue;
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

