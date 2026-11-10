var CategoryCommand = {
  list() {
    ItemRepository.list(SHEET_CATEGORIAS.name, "No hay categorías guardadas", "Estas son las categorías:\n")
  },

  sendSelectionListWithCreateOption() {
    ItemRepository.sendSelectionList(SHEET_CATEGORIAS.name, "Seleccioná una categoría escribiendo el NÚMERO:\n\n", "\nEscribí NUEVA seguido del nombre para agregar una categoría nueva o CANCELAR para cancelar la operación.")
  },

  sendExistingSelectionList() {
    ItemRepository.sendSelectionList(SHEET_CATEGORIAS.name, "Seleccioná una categoría escribiendo el NÚMERO:\n\n")
  },

  create(parts) {
    ItemRepository.createItem(parts, SHEET_CATEGORIAS.name, "NUEVA CATEGORIA", "✅ Categoría agregada:")
  },

  edit(chatId) {
    CategoryService.startEditFlow(chatId);
  },

  delete(chatId) {
    CategoryService.startDeleteFlow(chatId);
  },
};