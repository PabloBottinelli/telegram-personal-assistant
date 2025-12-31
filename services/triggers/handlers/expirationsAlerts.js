function ExpirationsAlertTrigger() {
  const sh = getSheet_(SHEET_TARJETAS.name);
  const values = getTableValues_(sh, SHEET_TARJETAS.headers.length);

  if (!hasData_(values)) return;

  const TODAY = todayNoon_();
  const THREE_DAYS = new Date(TODAY.getTime()); THREE_DAYS.setDate(THREE_DAYS.getDate() + 3);

  const avisos = [];

  for (const row of values) {
    const nombre = row[0].trim();
    const fechas = [
      row[TARJETA_FIELD_TO_OFFSET['ULTIMO VENCIMIENTO']],
      row[TARJETA_FIELD_TO_OFFSET['PROXIMO VENCIMIENTO']]
    ];

    const vencimiento = fechas.find(f => f && f >= TODAY && f <= THREE_DAYS);
    if (vencimiento) avisos.push(`${nombre}: vence el ${dateToStringDM_(vencimiento)}`);
  }

  if (avisos.length === 0) return;
  sendTelegram("⏰ Vencimientos próximos (≤ 3 días):\n" + avisos.join("\n") + "\n\nAcordate de pagar los consumos en USD por adelantado.");
}
