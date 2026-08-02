var IncomeValidator = {
  validate(input) {
    const errors = [];

    const income = {
      fecha: validateDateInput(input.fecha, errors),
      monto: validateAmountInput(input.monto, errors),
      moneda: validateCoinInput(input.moneda, errors),
      detalle: validateDetailInput(input.detalle, errors),
    };

    if (errors.length > 0) {
      return {
        ok: false,
        errors
      };
    }

    return {
      ok: true,
      value: income
    };
  }
};