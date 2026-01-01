function handleReminderTimeResponse(chatId, message, userState) {
  if (handleCancel_(message)) return;
  
  const raw = String(message || "").trim();
  if (!userState.datos) userState.datos = {};

  let hour, minute;

  if (raw === "-") {
    hour = 7;
    minute = 0;
  } else {
    const m = raw.match(/^(\d{1,2}):(\d{2})$/);
    if (!m) {
      sendTelegram(
        "❌ Hora inválida.\n\n" +
        "Usá el formato *HH:MM* en 24 hs.\n" +
        "Ejemplos:\n" +
        "- 07:00\n" +
        "- 13:30\n\n" +
        "O escribí '-' para usar 07:00 por defecto, o CANCELAR."
      );
      return;
    }

    hour = Number(m[1]);
    minute = Number(m[2]);

    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      sendTelegram(
        "❌ Hora fuera de rango.\n\n" +
        "La hora tiene que estar entre 00:00 y 23:59.\n\n" +
        "O escribí '-' para usar 07:00 por defecto, o CANCELAR."
      );
      return;
    }
  }

  userState.datos.hour = hour;
  userState.datos.minute = minute;
  userState.datos.timeText = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

  userState.esperandoHoraRecordatorio = false;
  userState.timestamp = Date.now();

  try {
    createReminderFromState_(userState.datos);
  } catch (err) {
    statesReset();
    sendTelegram("❌ Ocurrió un error al guardar el recordatorio.");
    return;
  }

  const tipo    = userState.datos.tipo    || "DESCONOCIDO";
  const detalle = userState.datos.detalle || "(sin detalle)";
  const horaTxt = userState.datos.timeText;

  let extra = "";
  switch (tipo) {
    case 'DAILY':
      extra = "Todos los días";
      break;
    case 'WEEKLY':
      extra = `Cada ${userState.datos.weekday?.label || "semana"}`;
      break;
    case 'WEEKLY_MULTI':
      if (Array.isArray(userState.datos.weekdays)) {
        extra = "Días: " + userState.datos.weekdays.map(d => d.label).join(", ");
      }
      break;
    case 'EVERY_N_DAYS':
      extra = `Cada ${userState.datos.everyNDays} día(s)`;
      break;
    case 'MONTHLY':
      extra = `El día ${userState.datos.dayOfMonth} de cada mes`;
      break;
    case 'ONCE':
      if (userState.datos.onceDate instanceof Date) {
        const d = userState.datos.onceDate.getDate();
        const m = userState.datos.onceDate.getMonth() + 1;
        const y = userState.datos.onceDate.getFullYear();
        extra = `El ${dateToStringDM_(userState.datos.onceDate)}`;
      }
      break;
  }

  statesReset();

  const resumen =
    `✅ Recordatorio creado.\n\n` +
    `📝 Detalle: ${detalle}\n` +
    (extra ? `📅 Frecuencia: ${extra}\n` : '') +
    `⏰ Hora: ${horaTxt}`;

  sendTelegram(resumen);
}
