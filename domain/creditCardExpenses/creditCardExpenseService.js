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
    let montoTotal = nOrZero_(expense.monto);
    const cuotas = Number(expense.cuotas) || 1;
    if(expense.tipo == 'D'){
      montoTotal = montoTotal - expense.ahorro;
    }

    CreditCardExpenseRepository.append({
        id: id,
        gastoId: expense.gastoId,
        fecha: expense.fecha,
        medio: expense.metodo,
        moneda: expense.moneda,
        monto: montoTotal,
        cuotas: cuotas,
        cuotasRestantes: cuotas,
        detalle: expense.detalle,
    });

    return id;
  }
};