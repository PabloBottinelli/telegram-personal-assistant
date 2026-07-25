function ExpirationsAlertTrigger() {
  const sh = getSheet_(SHEET_TARJETAS.name);
  const values = getTableValues_(sh, sh.getLastColumn());
  const cols = getHeaderMapFromSheet_(sh);

  if (!hasData_(values)) return;

  const TODAY = todayNoon_();
  const THREE_DAYS = new Date(TODAY.getTime()); THREE_DAYS.setDate(THREE_DAYS.getDate() + 3);

  const avisos = [];

  for (const row of values) {
    const card = creditCardFromRow_(row, cols);

    const nombre = String(card.nombre || "").trim();
    if (!nombre) continue;

    const fechas = [
      card.ultimoVencimiento,
      card.proximoVencimiento
    ];

    const vencimiento = fechas.find(f => f && f >= TODAY && f <= THREE_DAYS);

    if (vencimiento && sameLocalDay_(vencimiento, TODAY)) {
      avisos.push(`${nombre}: vence hoy!`);

      CardStatementService.updateRemainingInstallments(nombre, card.ultimoCierre);

      avisos.push(`${nombre}: se actualizaron las cuotas`);
    }

    if (vencimiento && !sameLocalDay_(vencimiento, TODAY)) {
      avisos.push(`${nombre}: vence el ${dateToStringDM_(vencimiento)}`);
    }
  }

  if (avisos.length === 0) return;
  sendTelegram("⏰ Vencimientos próximos (≤ 3 días):\n" + avisos.join("\n") + "\n\nAcordate de pagar los consumos en USD por adelantado.");
}
