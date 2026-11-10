const IncomeRepository = {
  append(income) {
    income.id = income.id || generateId_("ING");
    return appendSheetEntity_(SHEET_INGRESOS.name, IncomeMapper, income, true);
  },

  list() {
    return listSheetValues_(SHEET_INGRESOS.name, IncomeMapper);
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