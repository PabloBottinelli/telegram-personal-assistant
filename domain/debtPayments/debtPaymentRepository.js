const DebtPaymentRepository = {
  list() {
    return listSheetValues_(SHEET_PAGOS_DEUDAS.name, DebtPaymentMapper);
  },

  append(payment) {
    payment.id = payment.id || generateId_("PDEU");
    return appendSheetEntity_(SHEET_PAGOS_DEUDAS.name, DebtPaymentMapper, payment);
  },

  listByDebtId(deudaId) {
    const deudaIdNorm = String(deudaId || "").trim();

    return this.list().filter(p => {
      return String(p.deudaId || "").trim() === deudaIdNorm;
    });
  }
};