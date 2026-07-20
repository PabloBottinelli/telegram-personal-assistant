var CreditCardExpenseParser = {
  parse(parts) {
    if (parts.length === 3) {
      return {
        fecha: "-",
        monto: parts[1],
        moneda: "ARS",
        ahorro: "0",
        cuotas: "1",
        detalle: parts[2],
        tipo: "-",
        reintegrado: "-",
      };
    }

    return {
      fecha: parts[1],
      monto: parts[2],
      moneda: parts[3],
      ahorro: parts[4],
      cuotas: parts[5],
      detalle: parts[6],
      tipo: parts[7],
      reintegrado: parts[8]
    };
  }
};