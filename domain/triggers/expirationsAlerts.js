function ExpirationsAlertTrigger() {
  const sh = getSheet_(SHEET_TARJETAS.name);
  const values = getTableValues_(sh, sh.getLastColumn());
  const cols = getHeaderMapFromSheet_(sh);

  if (!hasData_(values)) return;

  const TODAY = todayNoon_();
  const THREE_DAYS = new Date(TODAY.getTime());
  THREE_DAYS.setDate(THREE_DAYS.getDate() + 3);

  const avisos = [];

  for (const row of values) {
    const card = CreditCardMapper.fromRow(row, cols);

    const nombre = String(card.nombre || "").trim();
    if (!nombre) continue;

    const ciclos = [
      {
        cierre: card.ultimoCierre,
        vencimiento: card.ultimoVencimiento
      },
      {
        cierre: card.proximoCierre,
        vencimiento: card.proximoVencimiento
      }
    ];

    const ciclo = ciclos.find(({ vencimiento }) =>
      vencimiento instanceof Date &&
      vencimiento >= TODAY &&
      vencimiento <= THREE_DAYS
    );

    if (!ciclo) continue;

    const { cierre, vencimiento } = ciclo;

    if (sameLocalDay_(vencimiento, TODAY)) {
      avisos.push(`${nombre}: vence hoy!`);

      const changed = CardStatementService.updateRemainingInstallments(card, cierre);

      if (changed) {
        avisos.push(`${nombre}: se actualizaron las cuotas`);
      }
    } else {
      avisos.push(`${nombre}: vence el ${dateToStringDM_(vencimiento)}`);
    }
  }

  if (avisos.length === 0) return;

  sendTelegram(
    "⏰ Vencimientos próximos (≤ 3 días):\n" +
    avisos.join("\n") +
    "\n\nAcordate de pagar los consumos en USD por adelantado."
  );
}