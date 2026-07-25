var TotalsParser = {
    parseMonth(input, currentDate) {
        const parsed = parseMonth_(input);

        if (parsed === null) {
            return {
                ok: false,
                error: "INVALID_MONTH"
            };
        }

        const now = currentDate || new Date();

        return {
            ok: true,
            value: {
                year: now.getFullYear(),
                monthNumber: parsed.monthNumber,
                monthText: parsed.monthText
            }
        };
    }
};