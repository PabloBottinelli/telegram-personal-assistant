var TotalsCommand = {
    execute(chatId, parts) {
        const parsed = TotalsParser.parseDate(parts[1], parts[2]);

        if (!parsed.ok) {
            if (parsed.error === "INVALID_MONTH") {
                sendTelegram(TotalsFormatter.invalidMonth());
            } else {
                sendTelegram(TotalsFormatter.invalidYear());
            }
            return;
        }

        const result = TotalsService.getMonthlyTotals(parsed.value);
        sendTelegram(TotalsFormatter.monthlySummary(result));
    }
};
