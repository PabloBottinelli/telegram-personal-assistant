var ReminderValidator = {
    validateDescription(description) {
        const errors = [];
        const value = validateDetailInput(description, errors);

        if (errors.length > 0) {
            return {
                ok: false,
                errors
            };
        }

        return {
            ok: true,
            value
        };
    },

    validateType(type) {
        if (!type) {
            return {
                ok: false,
                error: "INVALID_TYPE"
            };
        }

        return {
            ok: true
        };
    },

    validateWeekday(weekday) {
        if (!weekday) {
            return {
                ok: false,
                error: "INVALID_WEEKDAY"
            };
        }

        return {
            ok: true
        };
    },

    validateEveryNDays(value) {
        if (!Number.isInteger(value) || value < 1 || value > 365) {
            return {
                ok: false,
                error: "INVALID_EVERY_N_DAYS"
            };
        }

        return {
            ok: true
        };
    },

    validateMonthDay(value) {
        if (!Number.isInteger(value) || value < 1 || value > 31) {
            return {
                ok: false,
                error: "INVALID_MONTH_DAY"
            };
        }

        return {
            ok: true
        };
    },

    validateOnceDate(date) {
        if (!(date instanceof Date)) {
            return {
                ok: false,
                error: "INVALID_ONCE_DATE"
            };
        }

        return {
            ok: true
        };
    },

    validateTime(time) {
        if (!time) {
            return {
                ok: false,
                error: "INVALID_TIME_FORMAT"
            };
        }

        if (time.hour < 0 || time.hour > 23 || time.minute < 0 || time.minute > 59) {
            return {
                ok: false,
                error: "INVALID_TIME_RANGE"
            };
        }

        return {
            ok: true
        };
    }
};