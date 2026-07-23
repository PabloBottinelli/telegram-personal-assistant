var DebtPaymentParser = {
  parse(parts) {
    return {
        monto: parts[1],
    };
  }
};