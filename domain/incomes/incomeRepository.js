const IncomeRepository = {
  append(income) {
    const sh = getSheet_(SHEET_INGRESOS.name);
    const rowIndex = findNextRowInTable_(sh);
    income.id = income.id || generateId_("ING");
    const row = IncomeMapper.toRow(income);
    
    sh.getRange(rowIndex, START_COL, 1, row.length).setValues([row]);

    sortTableByDate_(sh, sh.getLastColumn());

    return income.id;
  },

  list() {
    const sh = getSheet_(SHEET_INGRESOS.name);
    const values = getTableValues_(sh, sh.getLastColumn());
    const cols = getHeaderMapFromSheet_(sh);

    if (!hasData_(values)) return [];

    return values
      .filter(row => row.some(value => String(value).trim() !== ""))
      .map(row => IncomeMapper.fromRow(row, cols));
  },

  renameCategory(oldName, newName) {
    const sh = getSheet_(SHEET_INGRESOS.name);
    const values = getTableValues_(sh, sh.getLastColumn());
    const cols = getHeaderMapFromSheet_(sh);

    const categoryIdx = getRequiredHeaderIndex_(cols, "Categoría", SHEET_INGRESOS.name);
    const oldNameNorm = String(oldName || "").trim().toLowerCase();

    for (let i = 0; i < values.length; i++) {
      const currentCategory = String(values[i][categoryIdx] || "").trim().toLowerCase();

      if (currentCategory !== oldNameNorm) continue;

      sh.getRange(START_ROW + i, START_COL + categoryIdx).setValue(newName);
    }
  },

  usesCategory(categoryName) {
    const target = String(categoryName || "").trim().toLowerCase();

    return IncomeRepository.list().some(income =>
      String(income.categoria || "").trim().toLowerCase() === target
    );
  },
};