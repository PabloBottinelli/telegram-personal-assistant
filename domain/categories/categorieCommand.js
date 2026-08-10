var CategoryCommand = {
  list() {
    const items = ItemRepository.list(SHEET_CATEGORIAS.name);
    if (items.length == 0) {
      sendTelegram("No hay categorías guardadas")
    } else {
      const msg = ItemFormatter.formatPlainList(items, "Estas son las categorías:\n");
      sendTelegram(msg);
    }
  },

  new(parts) {
    const nombre = (parts[1] || "").trim();
    if (!nombre) {
      sendTelegram(MSG_ERRORS.MSG_FORMAT_ERROR_BASE + COMMANDS["NUEVA CATEGORIA"].format_indication);
    } else {
      const result = ItemRepository.saveIfMissing(nombre, SHEET_CATEGORIAS.name);

      if (result?.exist) {
        sendTelegram(MSG_ERRORS.ITEM_EXISTENTE)
      } else {
        sendTelegram(`✅ Categoría agregada: "${nombre}".`);
      }
    }
  },

  edit(chatId) {
    CategorieService.startEditFlow(chatId);
  },

  delete(chatId) {
    CategorieService.startDeleteFlow(chatId);
  },

  sendSelectionListWithCreateOption() {
    const items = ItemRepository.list(SHEET_CATEGORIAS.name);
    const msg = ItemFormatter.formatNumberedList(
      items,
      "Seleccioná una categoría escribiendo el NÚMERO:\n\n",
      "\nEscribí NUEVA seguido del nombre para agregar una categoría nueva o CANCELAR para cancelar la operación."
    );
    sendTelegram(msg);
  },

  sendSelectionList() {
    const items = ItemRepository.list(SHEET_CATEGORIAS.name);
    const msg = ItemFormatter.formatNumberedList(
      items,
      "Seleccioná una categoría escribiendo el NÚMERO:\n\n",
    );
    sendTelegram(msg);
  },
};