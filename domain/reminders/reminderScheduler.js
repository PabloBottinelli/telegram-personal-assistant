var ReminderScheduler = {
    run() {
        const lock = LockService.getScriptLock();

        if (!lock.tryLock(20000)) return;

        try {
            const reminders = ReminderRepository.list();
            const now = new Date();

            for (const reminder of reminders) {
                ReminderScheduler.process(reminder, now);
            }
        } finally {
            lock.releaseLock();
        }
    },

    process(reminder, now) {
        if (!reminder.active) return;
        if (!reminder.description || !reminder.type) return;
        if (!(reminder.time instanceof Date)) return;
        if (!ReminderScheduler.isDue(reminder, now)) return;

        sendTelegram(ReminderFormatter.tickMessage(reminder));
        ReminderRepository.updateLastExecution(reminder.id, now);

        if (reminder.type === "ONCE") {
            ReminderRepository.deactivate(reminder.id);
        }
    },

    isDue(reminder, now) {
        const target = new Date(now);

        target.setHours(reminder.time.getHours(), reminder.time.getMinutes(), 0, 0);

        if (now < target) return false;
        if (reminder.lastExecution instanceof Date && reminder.lastExecution >= target) return false;

        return ReminderScheduler.matchesSchedule(reminder, now);
    },

    matchesSchedule(reminder, now) {
        const campo = String(reminder.keyField || "").trim();
        const labels = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
        const today = labels[now.getDay()].toLowerCase();

        switch (reminder.type) {
            case "DAILY":
                return true;

            case "WEEKLY":
                return campo.toLowerCase() === today;

            case "WEEKLY_MULTI": {
                const days = campo.split(",").map(value => value.trim().toLowerCase()).filter(Boolean);
                return days.includes(today);
            }

            case "MONTHLY": {
                const day = Number(campo);
                return Number.isInteger(day) && now.getDate() === day;
            }

            case "ONCE": {
                const date = parseDDMMYYYY_(campo);
                return date instanceof Date && sameLocalDay_(date, now);
            }

            case "EVERY_N_DAYS": {
                const parts = campo.split(",").map(value => value.trim());
                const everyNDays = Number(parts[0]);
                const baseDate = parts[1] ? parseDDMMYYYY_(parts[1]) : null;

                if (!Number.isInteger(everyNDays) || everyNDays < 1) return false;
                if (!(baseDate instanceof Date)) return false;

                const difference = Math.floor((noonTs_(now) - noonTs_(baseDate)) / (24 * 3600 * 1000));

                return difference >= 0 && difference % everyNDays === 0;
            }

            default:
                return false;
        }
    }
};