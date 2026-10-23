const CreditCardExpenseMapper = {
  toRow(debt) {
    const sh = getSheet_(SHEET_CUOTAS.name);
    const cols = getHeaderMapFromSheet_(sh);
    const row = new Array(sh.getLastColumn()).fill("");

    row[getRequiredHeaderIndex_(cols, "ID", SHEET_CUOTAS.name)] = debt.id;
    row[getRequiredHeaderIndex_(cols, "Gasto ID", SHEET_CUOTAS.name)] = debt.gastoId;
    row[getRequiredHeaderIndex_(cols, "Fecha", SHEET_CUOTAS.name)] = debt.fecha;
    row[getRequiredHeaderIndex_(cols, "Medio de pago", SHEET_CUOTAS.name)] = debt.medio;
    row[getRequiredHeaderIndex_(cols, "Moneda", SHEET_CUOTAS.name)] = debt.moneda;
    row[getRequiredHeaderIndex_(cols, "Monto", SHEET_CUOTAS.name)] = debt.monto;
    row[getRequiredHeaderIndex_(cols, "#Cuotas", SHEET_CUOTAS.name)] = debt.cuotas;
    row[getRequiredHeaderIndex_(cols, "#CuotasRestantes", SHEET_CUOTAS.name)] = debt.cuotasRestantes;
    row[getRequiredHeaderIndex_(cols, "Detalle", SHEET_CUOTAS.name)] = debt.detalle;

    return row;
  },

  fromRow(row, cols) {
    return {
      fecha: row[getRequiredHeaderIndex_(cols, "Fecha", SHEET_CUOTAS.name)],
      medio: row[getRequiredHeaderIndex_(cols, "Medio de pago", SHEET_CUOTAS.name)],
      moneda: row[getRequiredHeaderIndex_(cols, "Moneda", SHEET_CUOTAS.name)],
      monto: row[getRequiredHeaderIndex_(cols, "Monto", SHEET_CUOTAS.name)],
      cuotas: row[getRequiredHeaderIndex_(cols, "#Cuotas", SHEET_CUOTAS.name)],
      cuotasRestantes: row[getRequiredHeaderIndex_(cols, "#CuotasRestantes", SHEET_CUOTAS.name)],
      detalle: row[getRequiredHeaderIndex_(cols, "Detalle", SHEET_CUOTAS.name)],
      id: row[getRequiredHeaderIndex_(cols, "ID", SHEET_CUOTAS.name)],
      gastoId: row[getRequiredHeaderIndex_(cols, "Gasto ID", SHEET_CUOTAS.name)]
    };
  }
}

