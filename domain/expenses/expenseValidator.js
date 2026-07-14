var ExpenseValidator = {
  validate(input) {
    const errors = [];

    const expense = {
      fecha: processDateInput(input.fecha, errors),
      monto: processAmountInput(input.monto, errors),
      moneda: processCoinInput(input.moneda, errors),
      metodo: processMethodInput(input.metodo, errors),
      detalle: processDetailInput(input.detalle, errors),
      tipo: processTypeInput(input.tipo, errors)
    };

    expense.ahorro = processSavingInput(expense.monto, input.ahorro, errors);
    expense.reintegrado = processRefundInput(input.reintegrado, expense.tipo, expense.ahorro, errors);

    if (errors.length > 0) {
      return {
        ok: false,
        errors
      };
    }

    return {
      ok: true,
      value: expense
    };
  }
};