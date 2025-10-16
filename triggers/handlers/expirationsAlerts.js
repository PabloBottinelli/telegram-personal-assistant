function ExpirationsAlertTrigger_() {
  const sh = getSheet_(SHEET_LISTAS);
  const values = getTableValues_(sh, TABLA_TARJETAS);

  if (!hasData_(values)) return;

  const TODAY = todayNoon_();
  const THREE_DAYS = new Date(TODAY.getTime()); THREE_DAYS.setDate(THREE_DAYS.getDate() + 3);

  const avisos = [];

  for (const row of values) {
    const nombre = row[0].trim();
    const fechas = [
      row[TARJETA_FIELD_TO_OFFSET['ULTIMO_VENCIMIENTO']],
      row[TARJETA_FIELD_TO_OFFSET['PROXIMO_VENCIMIENTO']]
    ];

    const vencimiento = fechas.find(f => f && f >= TODAY && f <= THREE_DAYS);
    if (vencimiento) avisos.push(`${nombre}: vence el ${_fmtFechaYMD_(vencimiento)}`);
  }

  if (avisos.length === 0) return;
  sendTelegram("⏰ Vencimientos próximos (≤ 3 días):\n" + avisos.join("\n"));
}
