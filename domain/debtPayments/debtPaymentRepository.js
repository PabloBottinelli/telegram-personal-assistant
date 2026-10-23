const DebtPaymentRepository = {
  list() {
    const sh = getSheet_(SHEET_PAGOS_DEUDAS.name);
    const values = getTableValues_(sh, sh.getLastColumn());
    const cols = getHeaderMapFromSheet_(sh);

    if (!hasData_(values)) return [];

    return values
      .filter(row => row.some(v => String(v).trim() !== ""))
      .map(row => DebtPaymentMapper.fromRow(row, cols));
  },

  append(payment) {
    const sh = getSheet_(SHEET_PAGOS_DEUDAS.name);
    payment.id = payment.id || generateId_("PDEU");
    const row = DebtPaymentMapper.toRow(payment);
    const rowIndex = findNextRowInTable_(sh);

    sh.getRange(rowIndex, START_COL, 1, row.length).setValues([row]);

    sortTableByDate_(sh, sh.getLastColumn());

    return payment.id;
  },

  listByDebtId(deudaId) {
    const deudaIdNorm = String(deudaId || "").trim();

    return this.list().filter(p => {
      return String(p.deudaId || "").trim() === deudaIdNorm;
    });
  }
};