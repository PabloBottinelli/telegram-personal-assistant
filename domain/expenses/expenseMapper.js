const ExpenseMapper = {
  toRow(expense) {
    const sh = getSheet_(SHEET_GASTOS.name);
    const cols = getHeaderMapFromSheet_(sh);
    const row = new Array(sh.getLastColumn()).fill("");

    row[getRequiredHeaderIndex_(cols, "ID", SHEET_GASTOS.name)] = expense.id;
    row[getRequiredHeaderIndex_(cols, "Fecha", SHEET_GASTOS.name)] = expense.fecha;
    row[getRequiredHeaderIndex_(cols, "Categoría", SHEET_GASTOS.name)] = expense.categoria;
    row[getRequiredHeaderIndex_(cols, "Medio de pago", SHEET_GASTOS.name)] = expense.medio;
    row[getRequiredHeaderIndex_(cols, "Monto", SHEET_GASTOS.name)] = expense.monto;
    row[getRequiredHeaderIndex_(cols, "Moneda", SHEET_GASTOS.name)] = expense.moneda;
    row[getRequiredHeaderIndex_(cols, "Ahorro", SHEET_GASTOS.name)] = expense.ahorro;
    row[getRequiredHeaderIndex_(cols, "Detalle", SHEET_GASTOS.name)] = expense.detalle;
    row[getRequiredHeaderIndex_(cols, "Tipo", SHEET_GASTOS.name)] = expense.tipo;
    row[getRequiredHeaderIndex_(cols, "Reintegrado?", SHEET_GASTOS.name)] = expense.reintegrado;

    return row;
  },

  fromRow(row, cols) {
    return {
      fecha: row[getRequiredHeaderIndex_(cols, "Fecha", SHEET_GASTOS.name)],
      categoria: row[getRequiredHeaderIndex_(cols, "Categoría", SHEET_GASTOS.name)],
      medio: row[getRequiredHeaderIndex_(cols, "Medio de pago", SHEET_GASTOS.name)],
      monto: row[getRequiredHeaderIndex_(cols, "Monto", SHEET_GASTOS.name)],
      moneda: row[getRequiredHeaderIndex_(cols, "Moneda", SHEET_GASTOS.name)],
      ahorro: row[getRequiredHeaderIndex_(cols, "Ahorro", SHEET_GASTOS.name)],
      detalle: row[getRequiredHeaderIndex_(cols, "Detalle", SHEET_GASTOS.name)],
      tipo: row[getRequiredHeaderIndex_(cols, "Tipo", SHEET_GASTOS.name)],
      reintegrado: row[getRequiredHeaderIndex_(cols, "Reintegrado?", SHEET_GASTOS.name)],
      id: row[getRequiredHeaderIndex_(cols, "ID", SHEET_GASTOS.name)]
    };
  }
}
