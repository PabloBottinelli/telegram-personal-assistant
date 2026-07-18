var CreditCardExpenseService = {
  startCreateFlow(chatId, expense) {
    saveState_(chatId, {
      flow: "CREATE_CREDIT_EXPENSE",
      step: "WAITING_CATEGORY",
      data: expense,
      timestamp: Date.now()
    });

    CategoryCommand.sendSelectionList();
  },

  create(expense) {
    const id = generateId_("DT");

    CreditCardExpenseRepository.append({
        id: id,
        gastoId: expense.gastoId,
        fecha: expense.fecha,
        categoria: expense.categoria,
        monto: expense.monto,
        moneda: expense.moneda,
        cuotas: expense.cuotas,
        ahorro: expense.ahorro,
        detalle: expense.detalle,
        tipo: expense.tipo,
        reintegrado: expense.reintegrado === true,
    });

    return id;
  }
};