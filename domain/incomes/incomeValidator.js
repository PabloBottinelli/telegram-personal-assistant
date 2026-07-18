var IncomeValidator = {
  validate(input) {
    const errors = [];

    const income = {
      fecha: processDateInput(input.fecha, errors),
      monto: processAmountInput(input.monto, errors),
      moneda: processCoinInput(input.moneda, errors),
      detalle: processDetailInput(input.detalle, errors),
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