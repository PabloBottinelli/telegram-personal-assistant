 var ExpenseValidator = {
  validate(input) {
    const errors = [];

    const expense = {
      fecha: validateDateInput(input.fecha, errors),
      monto: validateAmountInput(input.monto, errors),
      moneda: validateCoinInput(input.moneda, errors),
      metodo: validateMethodInput(input.metodo, errors),
      detalle: validateDetailInput(input.detalle, errors),
      tipo: validateTypeInput(input.tipo, errors)
    };

    expense.ahorro = validateSavingInput(expense.monto, input.ahorro, errors);
    expense.reintegrado = validateRefundInput(input.reintegrado, expense.tipo, expense.ahorro, errors);

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