var IncomeParser = {
  parse(parts) {
    if (parts.length === 3) {
      return {
        fecha: "-",
        monto: parts[1],
        moneda: "ARS",
        detalle: parts[2],
      };
    }

    return {
      fecha: parts[1],
      monto: parts[2],
      moneda: parts[3],
      detalle: parts[4],
    };
  }
};