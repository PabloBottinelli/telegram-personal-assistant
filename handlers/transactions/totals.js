function enviarTotales_() {
  const sh = getSheet_(SHEET_MOVIMIENTOS);
  const values = sh.getRange(3, 19, 4, 1).getValues();
  const spentArs = _nOrZero_(values[0][0]); 
  const spentUSD = _nOrZero_(values[1][0]); 
  const incomeArs = _nOrZero_(values[2][0]); 
  const incomeUSD = _nOrZero_(values[3][0]); 

  const msg =
    `Gastos del mes en pesos: ${_fmtARS_(spentArs)}\n` +
    `Gastos del mes en USD: ${_fmtUSDplain_(spentUSD)} USD\n` +
    `Ingresos del mes en pesos: ${_fmtARS_(incomeArs)}\n` +
    `Ingresos del mes en USD: ${_fmtUSDplain_(incomeUSD)} USD`;

  sendTelegram(msg);
}