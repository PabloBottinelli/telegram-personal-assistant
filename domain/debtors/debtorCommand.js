var DebtorCommand = {
  list() {
    const items = ItemRepository.list(SHEET_DEUDORES.name);
    if (items.length == 0) {
      sendTelegram("No hay deudores guardados")
    } else {
      const msg = ItemFormatter.formatPlainList(items, "Estos son los deudores:\n");
      sendTelegram(msg);
    }
  },

  sendSelectionListWithCreateOption() {
    const items = ItemRepository.list(SHEET_DEUDORES.name);
    const msg = ItemFormatter.formatNumberedList(
      items,
      "Seleccioná un deudor escribiendo el NÚMERO:\n\n",
      "\nEscribí NUEVO Nombre para crear uno nuevo o CANCELAR para cancelar la operación."
    );
    sendTelegram(msg);
  },

  sendExistingSelectionList() {
    const items = ItemRepository.list(SHEET_DEUDORES.name);
    const msg = ItemFormatter.formatNumberedList(
      items,
      "Seleccioná un deudor escribiendo el NÚMERO:\n\n",
    );
    sendTelegram(msg);
  },

  create(parts) {
    const name = parts[1].trim();
    if (!name) {
      sendTelegram(MSG_ERRORS.MSG_FORMAT_ERROR_BASE + COMMANDS["NUEVO DEUDOR"].format_indication);
    } else {
      const result = ItemRepository.saveIfMissing(name, SHEET_DEUDORES.name);

      if (result?.exist) {
        sendTelegram(MSG_ERRORS.ITEM_EXISTENTE)
      } else {
        sendTelegram(`✅ Deudor agregado: "${name}".`);
      }
    }
  }
};