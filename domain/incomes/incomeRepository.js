const IncomeRepository = {
  append(income) {
    income.id = income.id || generateId_("ING");
    return appendSheetEntity_(SHEET_INGRESOS.name, IncomeMapper, income, true);
  },

  list() {
    return listSheetValues_(SHEET_INGRESOS.name, IncomeMapper);
  },

  renameCategory(oldName, newName) {
    return replaceSheetColumnValue_(SHEET_INGRESOS.name, "Categoría", oldName, newName);
  },

  usesCategory(categoryName) {
    const target = String(categoryName || "").trim().toLowerCase();

    return IncomeRepository.list().some(income =>
      String(income.categoria || "").trim().toLowerCase() === target
    );
  },
};