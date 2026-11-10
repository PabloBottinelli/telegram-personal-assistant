var DebtorCommand = {
  list() {
    ItemRepository.list(SHEET_DEUDORES.name, "No hay deudores guardados", "Estos son los deudores:\n")
  },

  sendSelectionListWithCreateOption() {
    ItemRepository.sendSelectionList(SHEET_DEUDORES.name, "Seleccioná un deudor escribiendo el NÚMERO:\n\n", "\nEscribí NUEVO Nombre para crear uno nuevo o CANCELAR para cancelar la operación.")
  },

  sendExistingSelectionList() {
    ItemRepository.sendSelectionList(SHEET_DEUDORES.name, "Seleccioná un deudor escribiendo el NÚMERO:\n\n")
  },

  create(parts) {
    ItemRepository.createItem(parts, SHEET_DEUDORES.name, "NUEVO DEUDOR", "✅ Deudor agregado:")
  }
};