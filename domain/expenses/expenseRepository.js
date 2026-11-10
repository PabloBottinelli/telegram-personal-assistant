const ExpenseRepository = {
  list() {
    return listSheetValues_(SHEET_GASTOS.name, ExpenseMapper);
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
    return findEntityById_(this.list(), id);
  },

  append(expense) {
    expense.id = expense.id || generateId_("GAS");
    return appendSheetEntity_(SHEET_GASTOS.name, ExpenseMapper, expense, true);
  },

  markAsRefundedById(id) {
    return updateSheetFieldById_(SHEET_GASTOS.name, id, "Reintegrado?", true)
  },

  renameCategory(oldName, newName) {
    return replaceSheetColumnValue_(SHEET_GASTOS.name, "Categoría", oldName, newName);
  },

  usesCategory(categoryName) {
    const target = String(categoryName || "").trim().toLowerCase();

    return ExpenseRepository.list().some(expense =>
      String(expense.categoria || "").trim().toLowerCase() === target
    );
  },
};