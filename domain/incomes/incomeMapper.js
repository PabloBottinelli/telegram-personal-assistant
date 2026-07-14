function incomeFromRow_(row, cols) {
  return {
    fecha: row[getRequiredHeaderIndex_(cols, "Fecha", SHEET_INGRESOS.name)],
    monto: row[getRequiredHeaderIndex_(cols, "Monto", SHEET_INGRESOS.name)],
    moneda: row[getRequiredHeaderIndex_(cols, "Moneda", SHEET_INGRESOS.name)],
    categoria: row[getRequiredHeaderIndex_(cols, "Categoría", SHEET_INGRESOS.name)],
    descripcion: row[getRequiredHeaderIndex_(cols, "Descripción", SHEET_INGRESOS.name)],
    id: row[getRequiredHeaderIndex_(cols, "ID", SHEET_INGRESOS.name)]
  };
}