var DebtorCommand = {
  list() {
    const items = ItemService.list(SHEET_DEUDORES.name);
    const msg = ItemFormatter.formatPlainList(items, "Estos son los deudores:\n");
    sendTelegram(msg);
  },

  sendSelectionList() {
    const items = ItemService.list(SHEET_DEUDORES.name);
    const msg = ItemFormatter.formatNumberedList(
      items,
      "Seleccioná un deudor escribiendo el NÚMERO:\n\n",
      "\nEscribí NUEVO Nombre para crear uno nuevo o CANCELAR para cancelar la operación."
    );
    sendTelegram(msg);
  }
};