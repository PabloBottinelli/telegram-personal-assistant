const REMINDER_TYPES = [
    { code: 'DAILY', label: 'Diario' },
    { code: 'WEEKLY', label: 'Semanal (un día)' },
    { code: 'WEEKLY_MULTI', label: 'Semanal (varios días)' },
    { code: 'EVERY_N_DAYS', label: 'Cada N días' },
    { code: 'MONTHLY', label: 'Mensual (día del mes)' },
    { code: 'ONCE', label: 'Fecha específica' },
];

function createReminder(chatId, lines) {
    const errores = [];
    const detalleNorm = processDetailInput(lines[1], errores);

    if (errores.length > 0) { sendTelegram(MSG_ERRORS.ERRORES_PREFIX + errores.join("\n")); return; }

    const userState = {
        esperandoTipoDeRecordatorio: true,
        datos: {
            detalle: detalleNorm,
            reminderTypes: REMINDER_TYPES,  
        },
        timestamp: Date.now()
    };

    saveState_(chatId, userState);

    let msg = "Elegí el TIPO de recordatorio escribiendo el NÚMERO:\n\n";
    REMINDER_TYPES.forEach((t, idx) => {
        msg += `${idx + 1}. ${t.label}\n`;
    });

    sendTelegram(msg);
}

function handleReminderTypeResponse(chatId, message, userState) {

}