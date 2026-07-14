var ExpenseParser = {
  parse(parts) {
    if (parts.length === 4) {
      return {
        fecha: "-",
        monto: parts[1],
        moneda: "ARS",
        metodo: parts[2],
        ahorro: "0",
        detalle: parts[3],
        tipo: "-",
        reintegrado: "-"
      };
    }

    return {
      fecha: parts[1],
      monto: parts[2],
      moneda: parts[3],
      metodo: parts[4],
      ahorro: parts[5],
      detalle: parts[6],
      tipo: parts[7],
      reintegrado: parts[8]
    };
  }
};