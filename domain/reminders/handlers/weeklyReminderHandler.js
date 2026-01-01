function handleReminderWeekdayResponse(chatId, message, userState) {
  if (handleCancel_(message)) return;

  const txtRaw = String(message || "").trim();
  const norm = txtRaw.trim().toLowerCase();

  const match = weekdayMap[norm];

  if (!match) {
    let msg = "❌ Día inválido.\n\nEscribí un día de la semana válido, por ejemplo:\n";
    msg += "- Lunes / Martes / Miércoles / Jueves / Viernes / Sábado / Domingo\n";
    msg += "O un número del 1 al 7 (1=Lunes, 7=Domingo).\n\n";
    msg += "O escribí CANCELAR para abortar.";
    sendTelegram(msg);
    return;
  }

  if (!userState.datos) userState.datos = {};
  userState.datos.weekday = match;  

  userState.esperandoDiasSemana = false;
  userState.esperandoHoraRecordatorio = true;
  userState.timestamp = Date.now();

  saveState_(chatId, userState);

  const msg = `✅ Perfecto, recordatorio semanal los *${match.label}*.\n\nAhora decime la HORA del recordatorio (formato HH:MM, por ej. 07:00).`;
  sendTelegram(msg);
}
