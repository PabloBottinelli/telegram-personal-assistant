const ExpenseRepository = {
  list() {
    const sh = getSheet_(SHEET_GASTOS.name);
    const values = getTableValues_(sh, sh.getLastColumn());
    const cols = getHeaderMapFromSheet_(sh);

    if (!hasData_(values)) return [];

    return values
      .filter(row => row.some(v => String(v).trim() !== ""))
      .map(row => ExpenseMapper.fromRow(row, cols));
  },

  mapById() {
    const map = new Map();

    this.list().forEach(expense => {
      const id = String(expense.id || "").trim();
      if (id) {
        map.set(id, expense);
      }
    });

    return map;
  },

  findById(id) {
    const idNorm = String(id || "").trim();
    if (!idNorm) return null;

    return this.list().find(expense => String(expense.id || "").trim() === idNorm) || null;
  },

  append(expense) {
    const sh = getSheet_(SHEET_GASTOS.name);
    const rowIndex = findNextRowInTable_(sh);
    expense.id = expense.id || generateId_("GAS");
    const row = ExpenseMapper.toRow(expense);

    sh.getRange(rowIndex, START_COL, 1, row.length).setValues([row]);

    sortTableByDate_(sh, sh.getLastColumn());

    return expense.id;
  },

  markAsRefundedById(id) {
    const sh = getSheet_(SHEET_GASTOS.name);
    const values = getTableValues_(sh, sh.getLastColumn());
    const cols = getHeaderMapFromSheet_(sh);

    const idIdx = getRequiredHeaderIndex_(cols, "ID", SHEET_GASTOS.name);
    const refundedIdx = getRequiredHeaderIndex_(cols, "Reintegrado?", SHEET_GASTOS.name);

    const normalizedId = String(id || "").trim();

    for (let i = 0; i < values.length; i++) {
      if (String(values[i][idIdx] || "").trim() !== normalizedId) continue;

      sh.getRange(START_ROW + i, START_COL + refundedIdx).setValue(true);

      return true;
    }

    return false;
  },

  renameCategory(oldName, newName) {
    const sh = getSheet_(SHEET_GASTOS.name);
    const values = getTableValues_(sh, sh.getLastColumn());
    const cols = getHeaderMapFromSheet_(sh);

    const categoryIdx = getRequiredHeaderIndex_(cols, "Categoría", SHEET_GASTOS.name);
    const oldNameNorm = String(oldName || "").trim().toLowerCase();

    for (let i = 0; i < values.length; i++) {
      const currentCategory = String(values[i][categoryIdx] || "").trim().toLowerCase();

      if (currentCategory !== oldNameNorm) continue;

      sh.getRange(START_ROW + i, START_COL + categoryIdx).setValue(newName);
    }
  },

  usesCategory(categoryName) {
    const target = String(categoryName || "").trim().toLowerCase();

    return ExpenseRepository.list().some(expense =>
      String(expense.categoria || "").trim().toLowerCase() === target
    );
  },
};