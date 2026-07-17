function expenseFromRow_(row, cols) {
  return {
    fecha: row[getRequiredHeaderIndex_(cols, "Fecha", SHEET_INGRESOS.name)],
    categoria: row[getRequiredHeaderIndex_(cols, "Categoría", SHEET_INGRESOS.name)],
    medio: row[getRequiredHeaderIndex_(cols, "Medio de pago", SHEET_INGRESOS.name)],
    monto: row[getRequiredHeaderIndex_(cols, "Monto", SHEET_INGRESOS.name)],
    moneda: row[getRequiredHeaderIndex_(cols, "Moneda", SHEET_INGRESOS.name)],
    ahorro: row[getRequiredHeaderIndex_(cols, "Ahorro", SHEET_INGRESOS.name)],
    detalle: row[getRequiredHeaderIndex_(cols, "Detalle", SHEET_INGRESOS.name)],
    tipo: row[getRequiredHeaderIndex_(cols, "Tipo", SHEET_INGRESOS.name)],
    reintegrado: row[getRequiredHeaderIndex_(cols, "Reintegrado?", SHEET_INGRESOS.name)],
    id: row[getRequiredHeaderIndex_(cols, "ID", SHEET_INGRESOS.name)]
  };
}