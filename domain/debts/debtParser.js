var DebtParser = {
  parse(parts) {
    return {
        monto: parts[1],
        moneda: parts[2],
        detalle: parts[3]
    };
  }
};