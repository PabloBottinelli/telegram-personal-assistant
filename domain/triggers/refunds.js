function RefundsTrigger() {
  const sh = getSheet_(SHEET_INGRESOS.name);
  const values = getTableValues_(sh, sh.getLastColumn());
  const cols = getHeaderMapFromSheet_(sh);

  if (!hasData_(values)) return;

  const lines = [];
  for (let i = 0; i < values.length; i++) {
    const gasto = expenseFromRow_(values[i], cols);

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
  }

  if (lines.length === 0) {
    sendTelegram("No hay reintegros pendientes 🎉");
  } else {
    sendTelegram(lines.join("\n\n"));
  }
}
