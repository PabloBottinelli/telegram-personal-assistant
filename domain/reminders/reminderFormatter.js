var ReminderFormatter = {
  typeMenu() {
    let message = "Elegí el TIPO de recordatorio escribiendo el NÚMERO:\n\n";

    REMINDER_TYPES.forEach((type, index) => {
      message += `${index + 1}. ${type.label}\n`;
    });

    return message + "\nO escribí CANCELAR para abortar.";
  },

  invalidType() {
    return "Número inválido.\n\n" + ReminderFormatter.typeMenu();
  },

  promptForType(type) {
    const prompts = {
      DAILY: "Tipo: Diario.\n\nDecime la HORA del recordatorio en formato HH:MM.",
      WEEKLY: "Tipo: Semanal.\n\nEscribí el DÍA de la semana.",
      WEEKLY_MULTI: "Tipo: Semanal, varios días.\n\nEscribí los días separados por comas.",
      EVERY_N_DAYS: "Tipo: Cada N días.\n\nDecime cada cuántos días querés el recordatorio.",
      MONTHLY: "Tipo: Mensual.\n\nDecime el día del mes entre 1 y 31.",
      ONCE: "Tipo: Fecha específica.\n\nDecime la fecha en formato dd/mm."
    };

    return prompts[type];
  },

  invalidWeekday() {
    return "Día inválido. Escribí un día entre lunes y domingo o un número del 1 al 7.";
  },

  invalidMultiWeekdays(value) {
    const detail = value ? ` Día inválido: "${value}".` : "";
    return `No pude interpretar los días.${detail} Escribilos separados por comas.`;
  },

  invalidEveryNDays() {
    return "Valor inválido. Escribí un número entero entre 1 y 365.";
  },

  invalidMonthDay() {
    return "Día inválido. Escribí un número entero entre 1 y 31.";
  },

  invalidOnceDate() {
    return "Fecha inválida. Usá el formato dd/mm.";
  },

  invalidTime(error) {
    if (error === "INVALID_TIME_RANGE") {
      return "Hora fuera de rango. La hora debe estar entre 00:00 y 23:59.";
    }

    return "Hora inválida. Usá el formato HH:MM o escribí '-' para usar 07:00.";
  },

  weekdaySelected(weekday) {
    return `Recordatorio semanal los ${weekday.label}.\n\nAhora decime la hora en formato HH:MM.`;
  },

  weekdaysSelected(weekdays) {
    const labels = weekdays.map(day => day.label).join(", ");
    return `Recordatorio los días: ${labels}.\n\nAhora decime la hora en formato HH:MM.`;
  },

  everyNDaysSelected(value) {
    return `Recordatorio cada ${value} días.\n\nAhora decime la hora en formato HH:MM.`;
  },

  monthDaySelected(value) {
    return `Recordatorio el día ${value} de cada mes.\n\nAhora decime la hora en formato HH:MM.`;
  },

  onceDateSelected(date) {
    return `Recordatorio para el ${dateToStringDM_(date)}.\n\nAhora decime la hora en formato HH:MM.`;
  },

  created(reminder) {
    return `Recordatorio creado.\n\nDetalle: ${reminder.description}\nFrecuencia: ${ReminderFormatter.frequency(reminder)}\nHora: ${String(reminder.hour).padStart(2, "0")}:${String(reminder.minute).padStart(2, "0")}`;
  },

  frequency(reminder) {
    switch (reminder.type) {
      case "DAILY":
        return "Todos los días";

      case "WEEKLY":
        return `Cada ${reminder.weekday.label}`;

      case "WEEKLY_MULTI":
        return reminder.weekdays.map(day => day.label).join(", ");

      case "EVERY_N_DAYS":
        return `Cada ${reminder.everyNDays} días`;

      case "MONTHLY":
        return `El día ${reminder.dayOfMonth} de cada mes`;

      case "ONCE":
        return `El ${dateToStringDM_(reminder.onceDate)}`;

      default:
        return "Desconocida";
    }
  },

  saveError() {
    return "Ocurrió un error al guardar el recordatorio.";
  },

  tickMessage(reminder) {
    return `Recordatorio:\n${reminder.description}`;
  }
};