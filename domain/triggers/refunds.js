function RefundsTrigger() {
  const sh = getSheet_(SHEET_GASTOS.name);
  const values = getTableValues_(sh, SHEET_GASTOS.headers.length);

  if (!hasData_(values)) return;

  const lines = [];
  for (let i = 0; i < values.length; i++) {
    const [fecha, categoria, medio, monto, moneda, ahorro, detalle, tipo, reintegrado, devuelto] = values[i];

    const fechaStr = dateToStringDM_(fecha);

    if (isPendingRefund_(values[i])) {
      lines.push(
        `${medio} te debe ${fmtMoney_(moneda, ahorro)} por compra del ${fechaStr}\n` +
        `Descripcion: ${detalle}`
      );
    }
    if (isPendingExternalDebt_(values[i])) {
      const total = nOrZero_(monto) - nOrZero_(ahorro);
      lines.push(
        `No te devolvieron la compra del ${fechaStr}\n` +
        `Descripcion: ${detalle}\n` +
        `Monto: ${fmtMoney_(moneda, monto)}  Ahorro: ${fmtMoney_(moneda, ahorro)}  Total: ${fmtMoney_(moneda, total)}`
      );
    }
  }

  if (lines.length === 0) {
    sendTelegram("No hay reintegros pendientes 🎉");
  } else {
    sendTelegram(lines.join("\n\n"));
  }
}
