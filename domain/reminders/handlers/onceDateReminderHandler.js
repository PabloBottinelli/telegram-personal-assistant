function handleReminderOnceDateResponse(chatId, message, userState) {
  const raw = String(message || "").trim();
  const date = parseDayMonthForDueOrClose_(raw); 
  if (!date) {
    sendTelegram(
      "❌ Fecha inválida.\n\n" +
      "Usá el formato *dd/mm*.\n" +
      "Ejemplos:\n" +
      "- 05/12\n" +
      "- 1/7\n\n" +
      "O escribí CANCELAR."
    );
    return;
  }

  if (!userState.datos) userState.datos = {};
  userState.datos.onceDate = date;

  userState.esperandoFechaUnica = false;
  userState.esperandoHoraRecordatorio = true;
  userState.timestamp = Date.now();

  saveState_(chatId, userState);

  const dateTxt = dateToStringDM_(date); 
  sendTelegram(
    `✅ Perfecto, el recordatorio será para el *${dateTxt}*.\n\n` +
    "Ahora decime la *HORA* del recordatorio (formato HH:MM, ej: 07:00)."
  );
}
