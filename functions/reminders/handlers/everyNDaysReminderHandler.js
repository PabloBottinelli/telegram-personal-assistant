function handleReminderEveryNDaysResponse(chatId, message, userState) {
  const raw = String(message || "").trim();

  if (raw.toUpperCase() === "CANCELAR") {
    statesReset();
    sendTelegram("Operación cancelada.");
    return;
  }

  const num = Number(raw);
  const isInt = Number.isInteger(num);

  if (!isInt || num < 1 || num > 365) {
    sendTelegram(
      "❌ Valor inválido.\n\n" +
      "Decime cada cuántos días querés el recordatorio, como un número entero entre 1 y 365.\n" +
      "Ejemplos:\n" +
      "- 1  (todos los días)\n" +
      "- 3  (cada 3 días)\n" +
      "- 7  (cada una semana)\n\n" +
      "O escribí CANCELAR para abortar."
    );
    return;
  }

  if (!userState.datos) userState.datos = {};
  userState.datos.everyNDays = num;

  userState.datos.baseDate = new Date(); 

  userState.esperandoCadaNDias = false;
  userState.esperandoHoraRecordatorio = true;
  userState.timestamp = Date.now();

  saveState_(chatId, userState);

  const msg =
    `✅ Perfecto, voy a crear un recordatorio cada ${num} día(s).\n\n` +
    "Ahora decime la HORA del recordatorio (formato HH:MM, por ejemplo 07:00).";

  sendTelegram(msg);
}
