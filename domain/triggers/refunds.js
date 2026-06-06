function RefundsTrigger() {
  const sh = getSheet_(SHEET_GASTOS.name);
  const values = getTableValues_(sh, sh.getLastColumn());
  const cols = getHeaderMapFromSheet_(sh);

  if (!hasData_(values)) return;

  const lines = [];
  for (let i = 0; i < values.length; i++) {
    const gasto = spentFromRow_(values[i], cols);

    if (!(gasto.fecha instanceof Date)) continue;

    const fechaStr = dateToStringDM_(gasto.fecha);
    const det = String(gasto.detalle || "-");

    if (isPendingRefund_(gasto)) {
      const med = String(gasto.medio || "").trim();

      lines.push(
        `${med || "Medio"} te debe ${fmtMoney_(gasto.moneda, gasto.ahorro)} por compra del ${fechaStr}\n` +
        `Descripcion: ${det}`
      );
    }
    if (isPendingExternalDebt_(gasto)) {
      const total = nOrZero_(gasto.monto) - nOrZero_(gasto.ahorro);
      
      lines.push(
        `No te devolvieron la compra del ${fechaStr}\n` +
        `Descripcion: ${det}\n` +
        `Monto: ${fmtMoney_(gasto.moneda, gasto.monto)}  Ahorro: ${fmtMoney_(gasto.moneda, gasto.ahorro)}  Total: ${fmtMoney_(gasto.moneda, total)}`
      );
    }
  }

  if (lines.length === 0) {
    sendTelegram("No hay reintegros ni devoluciones pendientes 🎉");
  } else {
    sendTelegram(lines.join("\n\n"));
  }
}
