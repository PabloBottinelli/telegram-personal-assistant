function handleReminderOnceDateResponse(chatId, message, userState) {
  const raw = String(message || "").trim();

  if (raw.toUpperCase() === "CANCELAR") {
    statesReset();
    sendTelegram("Operación cancelada.");
    return;
  }

  const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) {
    sendTelegram(
      "❌ Fecha inválida.\n\n" +
      "Usá el formato *dd/mm/aaaa*.\n" +
      "Ejemplos:\n" +
      "- 05/12/2025\n" +
      "- 1/7/2025\n\n" +
      "O escribí CANCELAR."
    );
    return;
  }

  const d = Number(m[1]);
  const mo = Number(m[2]);
  const y = Number(m[3]);

  if (d < 1 || d > 31 || mo < 1 || mo > 12 || y < 1900 || y > 3000) {
    sendTelegram("❌ Fecha fuera de rango. Revisá día, mes o año.\n\nO escribí CANCELAR.");
    return;
  }

  const date = new Date(y, mo - 1, d);

  if (
    date.getFullYear() !== y ||
    date.getMonth() !== mo - 1 ||
    date.getDate() !== d
  ) {
    sendTelegram(
      "❌ La fecha no es válida (ejemplo: 31/02 no existe).\n" +
      "Probá de nuevo.\n\n" +
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

  const dateTxt = `${String(d).padStart(2, "0")}/${String(mo).padStart(2, "0")}/${y}`;
  sendTelegram(
    `✅ Perfecto, el recordatorio será para el *${dateTxt}*.\n\n` +
    "Ahora decime la *HORA* del recordatorio (formato HH:MM, ej: 07:00)."
  );
}
