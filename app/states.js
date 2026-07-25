const USER_STATES = {
  ESPERANDO_CATEGORIA: 'esperandoCategoria',
  ESPERANDO_METODO: 'esperandoMetodo',
  ESPERANDO_METODO_FECHA: 'esperandoMetodoFecha',
  ESPERANDO_REINTEGRO_IDX: 'esperandoReintegroIdx'
};

function loadState_(chatId) {
  const props = PropertiesService.getScriptProperties();
  const raw = props.getProperty(chatId);
  if (!raw) return null;

  const isoRe = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
  return JSON.parse(raw, (k, v) => (typeof v === "string" && isoRe.test(v)) ? new Date(v) : v);
}

function saveState_(chatId, st) {
  PropertiesService.getScriptProperties().setProperty(chatId, JSON.stringify(st));
}

function statesReset() {
  PropertiesService.getScriptProperties().deleteAllProperties();
}

function cancelCurrentState_(chatId) {
  statesReset();
  sendTelegram("Operación cancelada.");
}



var STATE_HANDLERS = {
  CREATE_EXPENSE: {
    WAITING_CATEGORY: handleExpenseCategoryStep_,
    WAITING_DEBTOR: handleExpenseDebtorStep_,
  },

  CREATE_INCOME: {
    WAITING_CATEGORY: handleIncomeCategoryStep_,
  },

  CREATE_CREDIT_EXPENSE: {
    WAITING_CATEGORY: handleCreditExpenseCategoryStep_,
    WAITING_METHOD: handleCreditExpenseMethodStep_,
    WAITING_DEBTOR: handleCreditExpenseDebtorStep_
  },

  CREATE_REMINDER: {
    WAITING_TYPE: ReminderFlow.handleType,
    WAITING_WEEKDAY: ReminderFlow.handleWeekday,
    WAITING_MULTI_WEEKDAYS: ReminderFlow.handleMultiWeekdays,
    WAITING_EVERY_N_DAYS: ReminderFlow.handleEveryNDays,
    WAITING_MONTH_DAY: ReminderFlow.handleMonthDay,
    WAITING_ONCE_DATE: ReminderFlow.handleOnceDate,
    WAITING_TIME: ReminderFlow.handleTime
  },

  CREATE_DEBT: {
    WAITING_DEBTOR: handleDebtorResponse
  },

  MARK_REFUND: {
    WAITING_INDEX: handleIndexResponse_
  },

  PAY_DEBT: {
    WAITING_DEBTOR: handleDebtPaymentDebtorStep_,
    WAITING_DEBT_TO_PAY: handleDebtToPayStep_
  },

  CHANGE_CARD_DATE: {
    WAITING_CARD: handleCardResponse
  },
};