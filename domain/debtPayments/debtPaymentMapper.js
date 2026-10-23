const DebtPaymentMapper = {
  toRow(payment) {
    const sh = getSheet_(SHEET_PAGOS_DEUDAS.name);
    const cols = getHeaderMapFromSheet_(sh);
    const row = new Array(sh.getLastColumn()).fill("");

    row[getRequiredHeaderIndex_(cols, "Fecha", SHEET_PAGOS_DEUDAS.name)] = payment.fecha;
    row[getRequiredHeaderIndex_(cols, "Deudor", SHEET_PAGOS_DEUDAS.name)] = payment.deudor;
    row[getRequiredHeaderIndex_(cols, "Moneda", SHEET_PAGOS_DEUDAS.name)] = payment.moneda;
    row[getRequiredHeaderIndex_(cols, "Monto", SHEET_PAGOS_DEUDAS.name)] = payment.monto;
    row[getRequiredHeaderIndex_(cols, "Deuda ID", SHEET_PAGOS_DEUDAS.name)] = payment.deudaId;
    row[getRequiredHeaderIndex_(cols, "ID", SHEET_PAGOS_DEUDAS.name)] = payment.id;

    return row;
  },

  fromRow(row, cols) {
    return {
      fecha: row[getRequiredHeaderIndex_(cols, "Fecha", SHEET_PAGOS_DEUDAS.name)],
      deudor: row[getRequiredHeaderIndex_(cols, "Deudor", SHEET_PAGOS_DEUDAS.name)],
      moneda: row[getRequiredHeaderIndex_(cols, "Moneda", SHEET_PAGOS_DEUDAS.name)],
      monto: row[getRequiredHeaderIndex_(cols, "Monto", SHEET_PAGOS_DEUDAS.name)],
      deudaId: row[getRequiredHeaderIndex_(cols, "Deuda ID", SHEET_PAGOS_DEUDAS.name)],
      id: row[getRequiredHeaderIndex_(cols, "ID", SHEET_PAGOS_DEUDAS.name)]
    };
  }
};


