var CreditCardValidator = {
  validate(input, type) {
    const errors = [];

    const modes = {
      "ULTIMO CIERRE": "PREV_IF_FUTURE",
      "ULTIMO VENCIMIENTO": "PREV_IF_FUTURE",
      "PROXIMO CIERRE": "NEXT_IF_PAST",
      "PROXIMO VENCIMIENTO": "NEXT_IF_PAST"
    };

    const mode = modes[type];

    const date = mode ? dayMonthStringToLocalNoonDate_(input.fecha, mode) : null;

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