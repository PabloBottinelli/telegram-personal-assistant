 var CreditCardValidator = {
  validate(input) {
    const errors = [];

    const date = parseDayMonthForDueOrClose_(input)

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