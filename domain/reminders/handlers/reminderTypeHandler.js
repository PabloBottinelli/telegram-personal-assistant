function handleReminderTypeResponse(chatId, message, userState) {
  const txt = String(message || "").trim().toUpperCase();

  if (txt === "CANCELAR") {
    statesReset();                     
    sendTelegram("Operación cancelada.");
    return;
  }

  const choice = Number(txt);

  if (isNaN(choice) || choice < 1 || choice > REMINDER_TYPES.length) {
    let msg = "❌ Número inválido. Elegí un número de la lista:\n\n";
    REMINDER_TYPES.forEach((t, idx) => {
      msg += `${idx + 1}. ${t.label}\n`;
    });
    msg += "\nO escribí CANCELAR para abortar.";
    sendTelegram(msg);
    return;
  }

  const chosen = REMINDER_TYPES[choice - 1]; 

  userState.esperandoTipoDeRecordatorio = false;
  userState.datos.tipo = chosen.code; 

  userState.esperandoDiasSemana = false;
  userState.esperandoDiasSemanaMultiples = false;
  userState.esperandoCadaNDias = false;
  userState.esperandoDiaMes = false;
  userState.esperandoFechaUnica = false;
  userState.esperandoHoraRecordatorio = false;

  let msg;

  switch (chosen.code) {
    case 'DAILY':
      userState.esperandoHoraRecordatorio = true;
      msg = "📅 Tipo: Diario.\n\nDecime la HORA del recordatorio (formato HH:MM, ej: 07:00).";
      break;

    case 'WEEKLY':
      userState.esperandoDiasSemana = true;
      msg = "📅 Tipo: Semanal.\n\nEscribí el DÍA de la semana (ej: Lunes, Martes...).";
      break;

    case 'WEEKLY_MULTI':
      userState.esperandoDiasSemanaMultiples = true;
      msg = "📅 Tipo: Semanal (varios días).\n\nEscribí los DÍAS de la semana separados por comas (ej: Lunes, Jueves, Sábado).";
      break;

    case 'EVERY_N_DAYS':
      userState.esperandoCadaNDias = true;
      msg = "📅 Tipo: Cada N días.\n\nDecime cada cuántos días querés el recordatorio (ej: 3).";
      break;

    case 'MONTHLY':
      userState.esperandoDiaMes = true;
      msg = "📅 Tipo: Mensual.\n\nDecime el DÍA del mes (1–31) en que querés el recordatorio.";
      break;

    case 'ONCE':
      userState.esperandoFechaUnica = true;
      msg = "📅 Tipo: Fecha específica.\n\nDecime la FECHA del recordatorio en formato dd/mm.";
      break;

    default:
      sendTelegram("⚠️ Tipo de recordatorio no soportado por ahora.");
      statesReset();
      return;
  }

  userState.timestamp = Date.now();
  saveState_(chatId, userState);
  sendTelegram(msg);
}
