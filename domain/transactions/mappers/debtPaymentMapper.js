function debtPaymentFromRow_(row, cols) {
  return {
    fecha: row[getRequiredHeaderIndex_(cols, "Fecha", SHEET_PAGOS_DEUDAS.name)],
    persona: row[getRequiredHeaderIndex_(cols, "Persona/Entidad", SHEET_PAGOS_DEUDAS.name)],
    moneda: row[getRequiredHeaderIndex_(cols, "Moneda", SHEET_PAGOS_DEUDAS.name)],
    monto: row[getRequiredHeaderIndex_(cols, "Monto", SHEET_PAGOS_DEUDAS.name)],
    deudaId: row[getRequiredHeaderIndex_(cols, "Deuda ID", SHEET_PAGOS_DEUDAS.name)],
    id: row[getRequiredHeaderIndex_(cols, "Pago ID", SHEET_PAGOS_DEUDAS.name)]
  };
}