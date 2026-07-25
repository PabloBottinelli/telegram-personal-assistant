var ReminderMapper = {
    toRow(reminder) {
        return [
            reminder.description,
            reminder.type,
            ReminderMapper.buildKeyField(reminder),
            ReminderMapper.buildTimeCell(reminder.hour, reminder.minute),
            reminder.active,
            reminder.lastExecution || "",
            reminder.id
        ];
    },

    fromRow(row, cols, sheetRow) {
        const detailIdx = getRequiredHeaderIndex_(cols, "Detalle", SHEET_RECORDATORIOS.name);
        const typeIdx = getRequiredHeaderIndex_(cols, "Tipo", SHEET_RECORDATORIOS.name);
        const keyFieldIdx = getRequiredHeaderIndex_(cols, "Campo Clave", SHEET_RECORDATORIOS.name);
        const timeIdx = getRequiredHeaderIndex_(cols, "Horario", SHEET_RECORDATORIOS.name);
        const activeIdx = getRequiredHeaderIndex_(cols, "Activo", SHEET_RECORDATORIOS.name);
        const lastExecutionIdx = getRequiredHeaderIndex_(cols, "Ultima Ejecucion", SHEET_RECORDATORIOS.name);
        const idIdx = getRequiredHeaderIndex_(cols, "ID", SHEET_RECORDATORIOS.name);

        return {
            description: row[detailIdx],
            type: row[typeIdx],
            keyField: row[keyFieldIdx],
            time: row[timeIdx],
            active: row[activeIdx],
            lastExecution: row[lastExecutionIdx],
            id: row[idIdx],
            sheetRow
        };
    },

    buildKeyField(reminder) {
        switch (reminder.type) {
            case "DAILY":
                return "-";

            case "WEEKLY":
                return reminder.weekday.label;

            case "WEEKLY_MULTI":
                return reminder.weekdays.map(day => day.label).join(", ");

            case "EVERY_N_DAYS":
                return `${reminder.everyNDays}, ${dateToStringDM_(reminder.baseDate)}`;

            case "MONTHLY":
                return String(reminder.dayOfMonth);

            case "ONCE":
                return dateToStringDM_(reminder.onceDate);

            default:
                throw new Error(`Tipo de recordatorio inválido: ${reminder.type}`);
        }
    },

    buildTimeCell(hour, minute) {
        const date = new Date();

        date.setHours(hour);
        date.setMinutes(minute);
        date.setSeconds(0);
        date.setMilliseconds(0);

        return date;
    }
};