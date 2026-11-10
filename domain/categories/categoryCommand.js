var CategoryCommand = {
  list() {
    ItemCommand.list(SHEET_CATEGORIAS.name, "No hay categorías guardadas", "Estas son las categorías:\n")
  },

  sendSelectionListWithCreateOption() {
    ItemCommand.sendSelectionList(SHEET_CATEGORIAS.name, "Seleccioná una categoría escribiendo el NÚMERO:\n\n", "\nEscribí NUEVA seguido del nombre para agregar una categoría nueva o CANCELAR para cancelar la operación.")
  },

  sendExistingSelectionList() {
    ItemCommand.sendSelectionList(SHEET_CATEGORIAS.name, "Seleccioná una categoría escribiendo el NÚMERO:\n\n")
  },

  create(parts) {
    ItemCommand.createItem(parts, SHEET_CATEGORIAS.name, "NUEVA CATEGORIA", "✅ Categoría agregada:")
  },

  edit(chatId) {
    CategoryService.startEditFlow(chatId);
  },

  delete(chatId) {
    CategoryService.startDeleteFlow(chatId);
  },
};