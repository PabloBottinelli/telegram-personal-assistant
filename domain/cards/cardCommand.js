var CardCommand = {
  list() {
    const items = ItemService.list(SHEET_TARJETAS.name);
    const msg = ItemFormatter.formatPlainList(items, "Estas son las tarjetas:\n");
    sendTelegram(msg);
  },

  sendSelectionList() {
    const items = ItemService.list(SHEET_TARJETAS.name);
    const msg = ItemFormatter.formatNumberedList(
      items,
      "Seleccioná una tarjeta escribiendo el NÚMERO:\n\n",
      "\nEscribí NUEVA seguido del nombre para agregar una tarjeta nueva o CANCELAR para cancelar la operación."
    );
    sendTelegram(msg);
  }
};