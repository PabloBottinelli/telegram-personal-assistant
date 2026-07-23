function debtFromRow_(row, cols) {
  return {
    fecha: row[getRequiredHeaderIndex_(cols, "Fecha", SHEET_DEUDAS.name)],
    deudor: row[getRequiredHeaderIndex_(cols, "Deudor", SHEET_DEUDAS.name)],
    moneda: row[getRequiredHeaderIndex_(cols, "Moneda", SHEET_DEUDAS.name)],
    monto: row[getRequiredHeaderIndex_(cols, "Monto", SHEET_DEUDAS.name)],
    montoPendiente: row[getRequiredHeaderIndex_(cols, "Monto Pendiente", SHEET_DEUDAS.name)],
    detalle: row[getRequiredHeaderIndex_(cols, "Detalle", SHEET_DEUDAS.name)],
    estado: row[getRequiredHeaderIndex_(cols, "Estado", SHEET_DEUDAS.name)],
    id: row[getRequiredHeaderIndex_(cols, "ID", SHEET_DEUDAS.name)],
    gastoId: row[getRequiredHeaderIndex_(cols, "Gasto ID", SHEET_DEUDAS.name)]
  };
}