function handleReminderDayOfMonthResponse(chatId, message, userState) {
  const raw = String(message || "").trim();

  if (raw.toUpperCase() === "CANCELAR") {
    statesReset();
    sendTelegram("Operación cancelada.");
    return;
  }

  const num = Number(raw);
  const isInt = Number.isInteger(num);

  if (!isInt || num < 1 || num > 31) {
    sendTelegram(
      "❌ Día inválido.\n\n" +
      "Decime el DÍA del mes como un número entero entre 1 y 31.\n" +
      "Ejemplos:\n" +
      "- 1   (primer día del mes)\n" +
      "- 15  (día 15 de cada mes)\n" +
      "- 31  (siempre que el mes tenga 31 días)\n\n" +
      "O escribí CANCELAR para abortar."
    );
    return;
  }

  if (!userState.datos) userState.datos = {};
  userState.datos.dayOfMonth = num;  

  userState.esperandoDiaMes = false;
  userState.esperandoHoraRecordatorio = true;
  userState.timestamp = Date.now();

  saveState_(chatId, userState);

  const msg =
    `✅ Perfecto, voy a crear un recordatorio el día ${num} de cada mes.\n\n` +
    "Ahora decime la HORA del recordatorio (formato HH:MM, por ejemplo 07:00).";

  sendTelegram(msg);
}
