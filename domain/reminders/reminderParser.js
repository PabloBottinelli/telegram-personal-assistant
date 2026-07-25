var ReminderParser = {
  parseType(message) {
    const choice = Number(String(message || "").trim());

    if (!Number.isInteger(choice)) return null;
    if (choice < 1 || choice > REMINDER_TYPES.length) return null;

    return REMINDER_TYPES[choice - 1];
  },

  parseWeekday(message) {
    const normalized = String(message || "").trim().toLowerCase();
    return WEEKDAYS[normalized] || null;
  },

  parseWeekdays(message) {
    const parts = String(message || "")
      .trim()
      .toLowerCase()
      .split(",")
      .map(part => part.trim())
      .filter(Boolean);

    if (parts.length === 0) return null;

    const selected = [];
    const seen = {};

    for (const part of parts) {
      const weekday = WEEKDAYS[part];

      if (!weekday) {
        return {
          ok: false,
          invalidValue: part
        };
      }

      if (!seen[weekday.code]) {
        seen[weekday.code] = true;
        selected.push(weekday);
      }
    }

    return {
      ok: true,
      value: selected
    };
  },

  parseEveryNDays(message) {
    return Number(String(message || "").trim());
  },

  parseMonthDay(message) {
    return Number(String(message || "").trim());
  },

  parseOnceDate(message) {
    return parseDayMonthForDueOrClose_(String(message || "").trim());
  },

  parseTime(message) {
    const raw = String(message || "").trim();

    if (raw === "-") {
      return {
        hour: 7,
        minute: 0,
        text: "07:00"
      };
    }

    const match = raw.match(/^(\d{1,2}):(\d{2})$/);

    if (!match) return null;

    const hour = Number(match[1]);
    const minute = Number(match[2]);

    return {
      hour,
      minute,
      text: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
    };
  }
};