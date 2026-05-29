function RefundsTrigger() {
  const sh = getSheet_(SHEET_GASTOS.name);
  const values = getTableValues_(sh, sh.getLastColumn());
  const cols = getHeaderMapFromSheet_(sh);

  if (!hasData_(values)) return;

  const idxFecha = getRequiredHeaderIndex_(cols, "Fecha", SHEET_GASTOS.name);
  const idxMedio = getRequiredHeaderIndex_(cols, "Medio de pago", SHEET_GASTOS.name);
  const idxMonto = getRequiredHeaderIndex_(cols, "Monto", SHEET_GASTOS.name);
  const idxMoneda = getRequiredHeaderIndex_(cols, "Moneda", SHEET_GASTOS.name);
  const idxAhorro = getRequiredHeaderIndex_(cols, "Ahorro", SHEET_GASTOS.name);
  const idxDetalle = getRequiredHeaderIndex_(cols, "Detalle", SHEET_GASTOS.name);

  const lines = [];
  for (let i = 0; i < values.length; i++) {
    const row = values[i];

    const fecha = row[idxFecha];
    const medio = row[idxMedio];
    const monto = row[idxMonto];
    const moneda = row[idxMoneda];
    const ahorro = row[idxAhorro];
    const detalle = row[idxDetalle];

    if (!(fecha instanceof Date)) continue;

    const fechaStr = dateToStringDM_(fecha);
    const det = String(detalle || "-");

    if (isPendingRefund_(values[i], cols)) {
      lines.push(
        `${medio} te debe ${fmtMoney_(moneda, ahorro)} por compra del ${fechaStr}\n` +
        `Descripcion: ${det}`
      );
    }
    if (isPendingExternalDebt_(values[i], cols)) {
      const total = nOrZero_(monto) - nOrZero_(ahorro);
      lines.push(
        `No te devolvieron la compra del ${fechaStr}\n` +
        `Descripcion: ${det}\n` +
        `Monto: ${fmtMoney_(moneda, monto)}  Ahorro: ${fmtMoney_(moneda, ahorro)}  Total: ${fmtMoney_(moneda, total)}`
      );
    }
  }

  if (lines.length === 0) {
    sendTelegram("No hay reintegros ni devoluciones pendientes 🎉");
  } else {
    sendTelegram(lines.join("\n\n"));
  }
}
