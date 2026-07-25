var ReminderCommand = {
    create(chatId, parts) {
        const result = ReminderService.start(parts[1]);

        if (!result.ok) {
            sendTelegram(MSG_ERRORS.ERRORES_PREFIX + result.errors.join("\n"));
            return;
        }

        saveState_(chatId, result.state);
        sendTelegram(ReminderFormatter.typeMenu());
    }
};