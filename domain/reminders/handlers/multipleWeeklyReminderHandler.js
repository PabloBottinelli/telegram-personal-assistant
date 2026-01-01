function handleReminderMultiWeekdaysResponse(chatId, message, userState) {
  if (handleCancel_(message)) return;

  const txtRaw = String(message || "").trim().toLowerCase();
  const parts = txtRaw.split(",").map(p => p.trim()).filter(Boolean);

  if (parts.length === 0) {
    sendTelegram(
      "❌ No entendí los días.\n\n" +
      "Escribí varios días de la semana separados por comas, por ejemplo:\n" +
      "- Lunes, Miércoles, Viernes\n" +
      "- lun, mie, vie\n" +
      "- 1,3,5\n\n" +
      "O escribí CANCELAR para abortar."
    );
    return;
  }

  const selected = [];
  const seenCodes = {};

  for (const p of parts) {
    const match = weekdayMap[p];

    if (!match) {
      sendTelegram(
        `❌ Día inválido: "${p}".\n\n` +
        "Ejemplos válidos:\n" +
        "- Lunes, Jueves, Sábado\n" +
        "- lun, jue, sab\n" +
        "- 1,4,6 (1=Lunes, 7=Domingo)\n\n" +
        "O escribí CANCELAR para abortar."
      );
      return;
    }

    if (!seenCodes[match.code]) {
      seenCodes[match.code] = true;
      selected.push(match);  
    }
  }

  if (selected.length === 0) {
    sendTelegram(
      "❌ No se pudo interpretar ningún día válido.\n" +
      "Probá de nuevo con algo como: Lunes, Miércoles, Viernes."
    );
    return;
  }

  if (!userState.datos) userState.datos = {};
  userState.datos.weekdays = selected;  

  userState.esperandoDiasSemanaMultiples = false;
  userState.esperandoHoraRecordatorio = true;
  userState.timestamp = Date.now();

  saveState_(chatId, userState);

  const diasTexto = selected.map(d => d.label).join(", ");
  const msg =
    `✅ Perfecto, recordatorio los días: ${diasTexto}.\n\n` +
    "Ahora decime la HORA del recordatorio (formato HH:MM, por ej. 07:00).";

  sendTelegram(msg);
}
