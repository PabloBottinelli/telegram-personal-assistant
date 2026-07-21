 var CreditCardValidator = {
  validate(input) {
    const errors = [];

    const date = parseDayMonthForDueOrClose_(input.fecha)

    if (!date) {
      errors.push(MSG_ERRORS.FECHA_INVALIDA_STRICT);
    }

    if (errors.length > 0) {
      return {
        ok: false,
        errors
      };
    }

    return {
      ok: true,
      value: date
    };
  }
};