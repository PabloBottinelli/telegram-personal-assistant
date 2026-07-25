var TotalsCommand = {
    execute(chatId, parts) {
        const parsed = TotalsParser.parseMonth(parts[1]);

        if (!parsed.ok) {
            sendTelegram(TotalsFormatter.invalidMonth());
            return;
        }

        const result = TotalsService.getMonthlyTotals(parsed.value);
        sendTelegram(TotalsFormatter.monthlySummary(result));
    }
};