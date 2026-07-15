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



const STATE_HANDLERS = {
  CREATE_EXPENSE: {
    WAITING_CATEGORY: "handleExpenseCategoryStep_",
    // WAITING_METHOD: "handleExpenseMethodStep_",
    // WAITING_DEBTOR: "handleExpenseDebtorStep_"
  },

  // CREATE_INCOME: {
  //   WAITING_CATEGORY: "handleIncomeCategoryStep_"
  // },

  // CREATE_CREDIT_EXPENSE: {
  //   WAITING_CATEGORY: "handleCreditExpenseCategoryStep_",
  //   WAITING_METHOD: "handleCreditExpenseMethodStep_",
  //   WAITING_DEBTOR: "handleCreditExpenseDebtorStep_"
  // },

  CREATE_REMINDER: {
    WAITING_TYPE: "handleReminderTypeResponse",
    WAITING_WEEKDAY: "handleReminderWeekdayResponse",
    WAITING_MULTI_WEEKDAYS: "handleReminderMultiWeekdaysResponse",
    WAITING_EVERY_N_DAYS: "handleReminderEveryNDaysResponse",
    WAITING_MONTH_DAY: "handleReminderDayOfMonthResponse",
    WAITING_ONCE_DATE: "handleReminderOnceDateResponse",
    WAITING_TIME: "handleReminderTimeResponse"
  },

  MARK_REFUND: {
    WAITING_INDEX: "handleMarkAsRefundedResponse_"
  },

  PAY_DEBT: {
    WAITING_DEBTOR: "handleDebtorResponse",
    WAITING_DEBT_TO_PAY: "handleDebtToPayResponse"
  },

  // SET_CARD_DATE: {
  //   WAITING_CARD: handleCardDateCardStep_
  // }
};