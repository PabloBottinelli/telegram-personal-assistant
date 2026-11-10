const CreditCardExpenseRepository = {
  list() {
    return listSheetValues_(SHEET_CUOTAS.name, CreditCardExpenseMapper);
  },

  findByGastoId(gastoId) {
    const gastoIdNorm = String(gastoId || "").trim();
    if (!gastoIdNorm) return [];

    return this.list().filter(debt => String(debt.gastoId || "").trim() === gastoIdNorm);
  },

  append(debt) {
    debt.id = debt.id || generateId_("DT");
    return appendSheetEntity_(SHEET_CUOTAS.name, CreditCardExpenseMapper, debt, true);
  },

  updateRemainingInstallments(id, cuotasRestantes) {
    return updateSheetFieldById_(SHEET_CUOTAS.name, id, "#CuotasRestantes", cuotasRestantes)
  }
};