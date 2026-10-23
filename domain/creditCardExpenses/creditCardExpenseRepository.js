const CreditCardExpenseRepository = {
  list() {
    const sh = getSheet_(SHEET_CUOTAS.name);
    const values = getTableValues_(sh, sh.getLastColumn());
    const cols = getHeaderMapFromSheet_(sh);

    if (!hasData_(values)) return [];

    return values
      .filter(row => row.some(v => String(v).trim() !== ""))
      .map(row => CreditCardExpenseMapper.fromRow(row, cols));
  },

  findById(id) {
    const idNorm = String(id || "").trim();
    if (!idNorm) return null;

    return this.list().find(debt => String(debt.id || "").trim() === idNorm) || null;
  },

  findByGastoId(gastoId) {
    const gastoIdNorm = String(gastoId || "").trim();
    if (!gastoIdNorm) return [];

    return this.list().filter(debt => String(debt.gastoId || "").trim() === gastoIdNorm);
  },

  append(debt) {
    const sh = getSheet_(SHEET_CUOTAS.name);
    debt.id = debt.id || generateId_("DT");
    const row = CreditCardExpenseMapper.toRow(debt);
    const rowIndex = findNextRowInTable_(sh);

    sh.getRange(rowIndex, START_COL, 1, row.length).setValues([row]);

    sortTableByDate_(sh, sh.getLastColumn());

    return debt.id;
  },

  updateRemainingInstallments(id, cuotasRestantes) {
    const sh = getSheet_(SHEET_CUOTAS.name);
    const values = getTableValues_(sh, sh.getLastColumn());
    const cols = getHeaderMapFromSheet_(sh);

    if (!hasData_(values)) return false;

    const idxId = getRequiredHeaderIndex_(cols, "ID", SHEET_CUOTAS.name);
    const idxCuotasRestantes = getRequiredHeaderIndex_(cols, "#CuotasRestantes", SHEET_CUOTAS.name);

    const idNorm = String(id || "").trim();

    for (let i = 0; i < values.length; i++) {
      const rowId = String(values[i][idxId] || "").trim();

      if (rowId === idNorm) {
        const sheetRow = START_ROW + i;
        sh.getRange(sheetRow, START_COL + idxCuotasRestantes).setValue(cuotasRestantes);
        return true;
      }
    }

    return false;
  }
};