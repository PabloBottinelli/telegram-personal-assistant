function sendTotals(lines) {
  const todayYear = new Date().getFullYear();
  const month = parseMonth_(lines[1]);
  if (month === null) {
    sendTelegram(MSG_ERRORS.INVALID_MONTH);
    return;
  }

  const sheetExpenses = getSheet_(SHEET_INGRESOS.name);
  const sheetIncomes = getSheet_(SHEET_INGRESOS.name);

  const expenseTotals = computeExpenseTotals_(sheetExpenses,  todayYear, month.monthNumber);
  const incomeTotals = computeIncomeTotals_(sheetIncomes, todayYear, month.monthNumber);

  const msg =
    `Totales de ${month.monthText}:\n` +
    `Gastos del mes en pesos: ${fmtARS_(expenseTotals.ars)}\n` +
    `Gastos del mes en USD: ${fmtUSDplain_(expenseTotals.usd)} USD\n` +
    `Ingresos del mes en pesos: ${fmtARS_(incomeTotals.ars)}\n` +
    `Ingresos del mes en USD: ${fmtUSDplain_(incomeTotals.usd)} USD`;

  sendTelegram(msg);
}

function computeExpenseTotals_(sheet, year, monthNumber) {
  const values = getTableValues_(sheet, sheet.getLastColumn());
  const cols = getHeaderMapFromSheet_(sheet);

  if (!hasData_(values)) return { ars: 0, usd: 0 };

  let ars = 0;
  let usd = 0;

  for (const row of values) {
    const gasto = expenseFromRow_(row, cols);

    const date = gasto.fecha;
    if (!(date instanceof Date)) continue;
    if (date.getFullYear() !== year || date.getMonth() !== monthNumber) continue;

    const category = String(gasto.categoria || "").trim();
    if (category.toLowerCase() === "ajeno") continue;

    const amount = nOrZero_(gasto.monto);
    const saving = nOrZero_(gasto.ahorro);
    const currency = String(gasto.moneda || "").trim().toUpperCase();

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
  const values = getTableValues_(sheet, sheet.getLastColumn());
  const cols = getHeaderMapFromSheet_(sheet);

  if (!hasData_(values)) return { ars: 0, usd: 0 };

  let ars = 0;
  let usd = 0;

  for (const row of values) {
    const income = incomeFromRow_(row, cols);
    
    const date = income.fecha;
    if (!(date instanceof Date)) continue;
    if (date.getFullYear() !== year || date.getMonth() !== monthNumber) continue;

    const amount = nOrZero_(income.monto);
    const currency = String(income.moneda || "").trim().toUpperCase();


    if (currency === 'ARS') {
      ars += amount;
    } else if (currency === 'USD' || currency === 'USDT') {
      usd += amount;
    }
  }

  return { ars, usd };
}

