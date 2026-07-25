var ReminderFlow = {
  handleType(chatId, message, state) {
    const type = ReminderParser.parseType(message);
    const validation = ReminderValidator.validateType(type);

    if (!validation.ok) {
      sendTelegram(ReminderFormatter.invalidType());
      return;
    }

    state.data.type = type.code;
    state.step = ReminderFlow.nextStepForType(type.code);
    state.timestamp = Date.now();

    saveState_(chatId, state);
    sendTelegram(ReminderFormatter.promptForType(type.code));
  },

  handleWeekday(chatId, message, state) {
    const weekday = ReminderParser.parseWeekday(message);
    const validation = ReminderValidator.validateWeekday(weekday);

    if (!validation.ok) {
      sendTelegram(ReminderFormatter.invalidWeekday());
      return;
    }

    state.data.weekday = weekday;
    state.step = "WAITING_TIME";
    state.timestamp = Date.now();

    saveState_(chatId, state);
    sendTelegram(ReminderFormatter.weekdaySelected(weekday));
  },

  handleMultiWeekdays(chatId, message, state) {
    const parsed = ReminderParser.parseWeekdays(message);

    if (!parsed || !parsed.ok) {
      sendTelegram(ReminderFormatter.invalidMultiWeekdays(parsed?.invalidValue));
      return;
    }

    state.data.weekdays = parsed.value;
    state.step = "WAITING_TIME";
    state.timestamp = Date.now();

    saveState_(chatId, state);
    sendTelegram(ReminderFormatter.weekdaysSelected(parsed.value));
  },

  handleEveryNDays(chatId, message, state) {
    const value = ReminderParser.parseEveryNDays(message);
    const validation = ReminderValidator.validateEveryNDays(value);

    if (!validation.ok) {
      sendTelegram(ReminderFormatter.invalidEveryNDays());
      return;
    }

    state.data.everyNDays = value;
    state.data.baseDate = todayNoon_();
    state.step = "WAITING_TIME";
    state.timestamp = Date.now();

    saveState_(chatId, state);
    sendTelegram(ReminderFormatter.everyNDaysSelected(value));
  },

  handleMonthDay(chatId, message, state) {
    const value = ReminderParser.parseMonthDay(message);
    const validation = ReminderValidator.validateMonthDay(value);

    if (!validation.ok) {
      sendTelegram(ReminderFormatter.invalidMonthDay());
      return;
    }

    state.data.dayOfMonth = value;
    state.step = "WAITING_TIME";
    state.timestamp = Date.now();

    saveState_(chatId, state);
    sendTelegram(ReminderFormatter.monthDaySelected(value));
  },

  handleOnceDate(chatId, message, state) {
    const date = ReminderParser.parseOnceDate(message);
    const validation = ReminderValidator.validateOnceDate(date);

    if (!validation.ok) {
      sendTelegram(ReminderFormatter.invalidOnceDate());
      return;
    }

    state.data.onceDate = date;
    state.step = "WAITING_TIME";
    state.timestamp = Date.now();

    saveState_(chatId, state);
    sendTelegram(ReminderFormatter.onceDateSelected(date));
  },

  handleTime(chatId, message, state) {
    const time = ReminderParser.parseTime(message);
    const validation = ReminderValidator.validateTime(time);

    if (!validation.ok) {
      sendTelegram(ReminderFormatter.invalidTime(validation.error));
      return;
    }

    state.data.hour = time.hour;
    state.data.minute = time.minute;
    state.data.timeText = time.text;

    try {
      const reminder = ReminderService.create(state.data);
      statesReset();
      sendTelegram(ReminderFormatter.created(reminder));
    } catch (error) {
      statesReset();
      sendTelegram(ReminderFormatter.saveError());
    }
  },

  nextStepForType(type) {
    const steps = {
      DAILY: "WAITING_TIME",
      WEEKLY: "WAITING_WEEKDAY",
      WEEKLY_MULTI: "WAITING_MULTI_WEEKDAYS",
      EVERY_N_DAYS: "WAITING_EVERY_N_DAYS",
      MONTHLY: "WAITING_MONTH_DAY",
      ONCE: "WAITING_ONCE_DATE"
    };

    return steps[type];
  }
};