var DebtorCommand = {
  list() {
    ItemCommand.list(SHEET_DEUDORES.name, "No hay deudores guardados", "Estos son los deudores:\n")
  },

  sendSelectionListWithCreateOption() {
    ItemCommand.sendSelectionList(SHEET_DEUDORES.name, "Seleccioná un deudor escribiendo el NÚMERO:\n\n", "\nEscribí NUEVO Nombre para crear uno nuevo o CANCELAR para cancelar la operación.")
  },

  sendExistingSelectionList() {
    ItemCommand.sendSelectionList(SHEET_DEUDORES.name, "Seleccioná un deudor escribiendo el NÚMERO:\n\n")
  },

  create(parts) {
    ItemCommand.createItem(parts, SHEET_DEUDORES.name, "NUEVO DEUDOR", "✅ Deudor agregado:")
  },

  delete(chatId) {
    DebtorService.startDeleteFlow(chatId);
  }
};