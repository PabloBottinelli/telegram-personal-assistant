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
      id: id,
      fecha: expense.fecha,
      categoria: expense.categoria,
      medio: expense.metodo,
      monto: expense.monto,
      moneda: expense.moneda,
      ahorro: expense.ahorro,
      detalle: expense.detalle,
      tipo: expense.tipo,
      reintegrado: expense.reintegrado === true,
    });

    return id;
  }
};