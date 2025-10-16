function RefundsTrigger_() {
  const sh = getSheet_(SHEET_MOVIMIENTOS);
  const values = getTableValues_(sh, TABLA_GASTOS);

  if (!hasData_(values)) return;

  const lines = [];
  for (let i = 0; i < values.length; i++) {
    const [fecha, categoria, medio, monto, moneda, ahorro, detalle, reintegrado, devuelto] = values[i];

    const fechaStr = _fmtFechaYMD_(fecha);

    if (!reintegrado) {
      lines.push(
        `${medio} te debe ${_fmtMoney_(moneda, ahorro)} por compra del ${fechaStr}\n` +
        `Descripcion: ${detalle}`
      );
    }
    if (!devuelto) {
      const total = _nOrZero_(monto) - _nOrZero_(ahorro);
      lines.push(
        `No te devolvieron la compra del ${fechaStr}\n` +
        `Descripcion: ${detalle}\n` +
        `Monto: ${_fmtMoney_(moneda, monto)}  Ahorro: ${_fmtMoney_(moneda, ahorro)}  Total: ${_fmtMoney_(moneda, total)}`
      );
    }
  }

  if (lines.length === 0) {
    sendTelegram("No hay reintegros pendientes 🎉");
  } else {
    sendTelegram(lines.join("\n\n"));
  }
}
