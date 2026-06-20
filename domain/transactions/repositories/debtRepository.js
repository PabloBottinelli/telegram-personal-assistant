const DebtRepository = {
  list() {
    const sh = getSheet_(SHEET_DEUDAS.name);
    const values = getTableValues_(sh, sh.getLastColumn());
    const cols = getHeaderMapFromSheet_(sh);

    if (!hasData_(values)) return [];

    return values
      .filter(row => row.some(v => String(v).trim() !== ""))
      .map(row => debtFromRow_(row, cols));
  },

  findById(id) {
    const idNorm = String(id || "").trim();
    if (!idNorm) return null;

    return this.list().find(d => String(d.id || "").trim() === idNorm) || null;
  },

  listPending() {
    return this.list().filter(d => {
      const estado = String(d.estado || "").trim().toUpperCase();
      const pendiente = nOrZero_(d.montoPendiente);
      return estado !== "SALDADA" && pendiente > 0;
    });
  },

  append(debt) {
    const sh = getSheet_(SHEET_DEUDAS.name);
    const rowIndex = findNextRowInTable_(sh);
    const cols = getHeaderMapFromSheet_(sh);

    const id = debt.id || generateId_("DEU");

    const row = new Array(sh.getLastColumn()).fill("");

    row[getRequiredHeaderIndex_(cols, "Fecha", SHEET_DEUDAS.name)] = debt.fecha;
    row[getRequiredHeaderIndex_(cols, "Persona/Entidad", SHEET_DEUDAS.name)] = debt.persona;
    row[getRequiredHeaderIndex_(cols, "Moneda", SHEET_DEUDAS.name)] = debt.moneda;
    row[getRequiredHeaderIndex_(cols, "Monto", SHEET_DEUDAS.name)] = debt.monto;
    row[getRequiredHeaderIndex_(cols, "Monto Pendiente", SHEET_DEUDAS.name)] = debt.montoPendiente;
    row[getRequiredHeaderIndex_(cols, "Detalle", SHEET_DEUDAS.name)] = debt.detalle;
    row[getRequiredHeaderIndex_(cols, "Estado", SHEET_DEUDAS.name)] = debt.estado || "Pendiente";
    row[getRequiredHeaderIndex_(cols, "Deuda ID", SHEET_DEUDAS.name)] = id;
    row[getRequiredHeaderIndex_(cols, "Gasto ID", SHEET_DEUDAS.name)] = debt.gastoId || "";

    sh.getRange(rowIndex, START_COL, 1, row.length).setValues([row]);

    sortTableByDate_(sh, sh.getLastColumn());

    return id;
  },

  listPendingByPerson(persona) {
    const personaNorm = String(persona || "").trim().toLowerCase();

    return this.listPending().filter(d => {
      return String(d.persona || "").trim().toLowerCase() === personaNorm;
    });
  },

  updatePendingAmount(id, newPendingAmount) {
    const sh = getSheet_(SHEET_DEUDAS.name);
    const values = getTableValues_(sh, sh.getLastColumn());
    const cols = getHeaderMapFromSheet_(sh);

    if (!hasData_(values)) return false;

    const idxId = getRequiredHeaderIndex_(cols, "Deuda ID", SHEET_DEUDAS.name);
    const idxPendiente = getRequiredHeaderIndex_(cols, "Monto Pendiente", SHEET_DEUDAS.name);
    const idxEstado = getRequiredHeaderIndex_(cols, "Estado", SHEET_DEUDAS.name);

    const idNorm = String(id || "").trim();

    for (let i = 0; i < values.length; i++) {
      const rowId = String(values[i][idxId] || "").trim();

      if (rowId === idNorm) {
        const sheetRow = START_ROW + i;
        const pending = Math.max(0, Number(newPendingAmount) || 0);
        const estado = pending <= 0 ? "Saldada" : "Pendiente";

        sh.getRange(sheetRow, START_COL + idxPendiente).setValue(pending);
        sh.getRange(sheetRow, START_COL + idxEstado).setValue(estado);

        return true;
      }
    }

    return false;
  }
};