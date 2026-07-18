const CreditCardExpenseRepository = {
  list() {
    const sh = getSheet_(SHEET_CUOTAS.name);
    const values = getTableValues_(sh, sh.getLastColumn());
    const cols = getHeaderMapFromSheet_(sh);

    if (!hasData_(values)) return [];

    return values
      .filter(row => row.some(v => String(v).trim() !== ""))
      .map(row => creditCardExpenseFromRow_(row, cols));
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
    const rowIndex = findNextRowInTable_(sh);
    const cols = getHeaderMapFromSheet_(sh);

    const id = debt.id || generateId_("DT");

    const row = new Array(sh.getLastColumn()).fill("");

    row[getRequiredHeaderIndex_(cols, "ID", SHEET_CUOTAS.name)] = id;
    row[getRequiredHeaderIndex_(cols, "Gasto ID", SHEET_CUOTAS.name)] = debt.gastoId;
    row[getRequiredHeaderIndex_(cols, "Fecha", SHEET_CUOTAS.name)] = debt.fecha;
    row[getRequiredHeaderIndex_(cols, "Medio de pago", SHEET_CUOTAS.name)] = debt.medio;
    row[getRequiredHeaderIndex_(cols, "Moneda", SHEET_CUOTAS.name)] = debt.moneda;
    row[getRequiredHeaderIndex_(cols, "Monto", SHEET_CUOTAS.name)] = debt.monto;
    row[getRequiredHeaderIndex_(cols, "#Cuotas", SHEET_CUOTAS.name)] = debt.cuotas;
    row[getRequiredHeaderIndex_(cols, "#CuotasRestantes", SHEET_CUOTAS.name)] = debt.cuotasRestantes;
    row[getRequiredHeaderIndex_(cols, "Detalle", SHEET_CUOTAS.name)] = debt.detalle;

    sh.getRange(rowIndex, START_COL, 1, row.length).setValues([row]);

    sortTableByDate_(sh, sh.getLastColumn());

    return id;
  },

  updateRemainingQuotas(id, cuotasRestantes) {
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