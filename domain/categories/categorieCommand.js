var CategoryCommand = {
  list() {
    const items = ItemRepository.list(SHEET_CATEGORIAS.name);
    const msg = ItemFormatter.formatPlainList(items, "Estas son las categorías:\n");
    sendTelegram(msg);
  },

  sendSelectionList() {
    const items = ItemRepository.list(SHEET_CATEGORIAS.name);
    const msg = ItemFormatter.formatNumberedList(
      items,
      "Seleccioná una categoría escribiendo el NÚMERO:\n\n",
      "\nEscribí NUEVA seguido del nombre para agregar una categoría nueva o CANCELAR para cancelar la operación."
    );
    sendTelegram(msg);
  }
};