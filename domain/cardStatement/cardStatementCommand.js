var CardStatementCommand = {
    execute() {
        const results = CardStatementService.buildAll();

        if (results.length === 0) {
            sendTelegram("No hay tarjetas cargadas.");
            return;
        }

        for (const result of results) {
            const cardName = String(result.card.nombre || "").trim();

            if (result.error === "CLOSE_DATE_NOT_FOUND") {
                sendTelegram(CardStatementFormatter.closeDateError(cardName));
                continue;
            }

            try {
                for (const warning of result.warnings) {
                    sendTelegram(CardStatementFormatter.warning(warning));
                }

                sendTelegram(CardStatementFormatter.format(result));
            } catch (error) {
                sendTelegram(CardStatementFormatter.generationError(cardName, error));
            }
        }
    }
};