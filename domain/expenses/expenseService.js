var ExpenseService = {
  startCreateFlow(chatId, expense) {
    saveState_(chatId, {
      flow: "CREATE_EXPENSE",
      step: "WAITING_CATEGORY",
      data: expense,
      timestamp: Date.now()
    });

    CategoryCommand.sendSelectionList();
  },

  create(expense) {
    const id = generateId_("GAS");

    ExpenseRepository.append({
      ...expense,
      id
    });

    return id;
  }
};