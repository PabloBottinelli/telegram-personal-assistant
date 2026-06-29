const DebtPaymentRepository = {
  list() {
    const sh = getSheet_(SHEET_PAGOS_DEUDAS.name);
    const values = getTableValues_(sh, sh.getLastColumn());
    const cols = getHeaderMapFromSheet_(sh);

    if (!hasData_(values)) return [];

    return values
      .filter(row => row.some(v => String(v).trim() !== ""))
      .map(row => debtPaymentFromRow_(row, cols));
  },

  append(payment) {
    const sh = getSheet_(SHEET_PAGOS_DEUDAS.name);
    const rowIndex = findNextRowInTable_(sh);
    const cols = getHeaderMapFromSheet_(sh);

    const id = payment.id || generateId_("PDEU");

    const row = new Array(sh.getLastColumn()).fill("");

    row[getRequiredHeaderIndex_(cols, "Fecha", SHEET_PAGOS_DEUDAS.name)] = payment.fecha;
    row[getRequiredHeaderIndex_(cols, "Persona/Entidad", SHEET_PAGOS_DEUDAS.name)] = payment.persona;
    row[getRequiredHeaderIndex_(cols, "Moneda", SHEET_PAGOS_DEUDAS.name)] = payment.moneda;
    row[getRequiredHeaderIndex_(cols, "Monto", SHEET_PAGOS_DEUDAS.name)] = payment.monto;
    row[getRequiredHeaderIndex_(cols, "Deuda ID", SHEET_PAGOS_DEUDAS.name)] = payment.deudaId;
    row[getRequiredHeaderIndex_(cols, "ID", SHEET_PAGOS_DEUDAS.name)] = id;

    sh.getRange(rowIndex, START_COL, 1, row.length).setValues([row]);

    sortTableByDate_(sh, sh.getLastColumn());

    return id;
  },

  listByDebtId(deudaId) {
    const deudaIdNorm = String(deudaId || "").trim();

    return this.list().filter(p => {
      return String(p.deudaId || "").trim() === deudaIdNorm;
    });
  }
};