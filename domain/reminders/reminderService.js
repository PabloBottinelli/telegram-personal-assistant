var ReminderService = {
    start(description) {
        const validation = ReminderValidator.validateDescription(description);

        if (!validation.ok) {
            return {
                ok: false,
                errors: validation.errors
            };
        }

        return {
            ok: true,
            state: {
                flow: "CREATE_REMINDER",
                step: "WAITING_TYPE",
                data: {
                    description: validation.value
                },
                timestamp: Date.now()
            }
        };
    },

    create(data) {
        const reminder = {
            id: generateId_("REC"),
            description: data.description,
            type: data.type,
            weekday: data.weekday || null,
            weekdays: data.weekdays || [],
            everyNDays: data.everyNDays || null,
            baseDate: data.baseDate || null,
            dayOfMonth: data.dayOfMonth || null,
            onceDate: data.onceDate || null,
            hour: data.hour,
            minute: data.minute,
            active: true,
            lastExecution: ""
        };

        ReminderRepository.append(reminder);

        return reminder;
    }
};