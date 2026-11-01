var TotalsParser = {
    parseDate(month, year) {
        const parsedMonth = parseMonth_(month);

        if (parsedMonth === null) {
            return {
                ok: false,
                error: "INVALID_MONTH"
            };
        }

        const parsedYear = parseYear_(year);

        if (year !== undefined && year !== null && parsedYear === null) {
            return {
                ok: false,
                error: "INVALID_YEAR"
            };
        }

        const now = new Date();

        return {
            ok: true,
            value: {
                year: parsedYear ?? now.getFullYear(),
                monthNumber: parsedMonth.monthNumber,
                monthText: parsedMonth.monthText
            }
        };
    }
};
