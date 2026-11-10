const DebtRepository = {
  list() {
    return listSheetValues_(SHEET_DEUDAS.name, DebtMapper);
  },

  findById(id) {
    return findEntityById_(this.list(), id);
  },

  listPending() {
    return this.list().filter(d => {
      const estado = String(d.estado || "").trim().toUpperCase();
      const pendiente = nOrZero_(d.montoPendiente);
      return estado !== "SALDADA" && pendiente > 0;
    });
  },

  append(debt) {
    return appendSheetEntity_(SHEET_DEUDAS.name, DebtMapper, debt, true);
  },

  listPendingByDebtor(deudor) {
    const deudorNorm = String(deudor || "").trim().toLowerCase();

    return this.listPending().filter(d => {
      return String(d.deudor || "").trim().toLowerCase() === deudorNorm;
    });
  },

  updatePendingAmount(id, newPendingAmount) {
    const sh = getSheet_(SHEET_DEUDAS.name);
    const values = getTableValues_(sh, sh.getLastColumn());
    const cols = getHeaderMapFromSheet_(sh);

    if (!hasData_(values)) return false;

    const idxId = getRequiredHeaderIndex_(cols, "ID", SHEET_DEUDAS.name);
    const idxPendiente = getRequiredHeaderIndex_(cols, "Monto Pendiente", SHEET_DEUDAS.name);
    const idxEstado = getRequiredHeaderIndex_(cols, "Estado", SHEET_DEUDAS.name);

    const idNorm = String(id || "").trim();

    for (let i = 0; i < values.length; i++) {
      if (String(values[i][idxId] || "").trim() !== idNorm) continue;
      const pending = Math.max(0, Number(newPendingAmount) || 0);
      const estado = pending <= 0 ? "Saldada" : "Pendiente";

      const start = Math.min(idxPendiente, idxEstado);
      const end = Math.max(idxPendiente, idxEstado);

      const row = values[i].slice(start, end + 1);
      row[idxPendiente - start] = pending;
      row[idxEstado - start] = estado;

      sh.getRange(START_ROW + i, START_COL + start, 1, row.length).setValues([row]);

      return true;
    }

    return false;
  }
};