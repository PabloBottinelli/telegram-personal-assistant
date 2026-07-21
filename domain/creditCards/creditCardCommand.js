var CreditCardCommand = {
  handleChangeDate(chatId, parts, type) {
    const input = CreditCardParser.parse(parts);
    const result = CreditCardValidator.validate(input);

    if (!result.ok) {
      sendTelegram(result.errors.join("\n") + `\n\nEj:\n${type}\n31/10`);
      return;
    }

    CreditCardService.startChangeDateFlow(chatId, result.value, type);
  },

  list() {
    const items = ItemRepository.list(SHEET_TARJETAS.name);
    const msg = ItemFormatter.formatPlainList(items, "Estas son las tarjetas:\n");
    sendTelegram(msg);
  },

  createNewCard(parts) {
    const nombre = (parts[1] || "").trim();
    if (!nombre) { 
      sendTelegram(MSG_ERRORS.MSG_FORMAT_ERROR_BASE + COMMANDS["NUEVA TARJETA"].format_indication); 
    }else {
      saveItem_(nombre, SHEET_TARJETAS.name);
      sendTelegram(`✅ Tarjeta agregada: "${nombre}".`);
    }
  },

  sendSelectionList() {
    const items = ItemRepository.list(SHEET_TARJETAS.name);
    const msg = ItemFormatter.formatNumberedList(
      items,
      "Seleccioná una tarjeta escribiendo el NÚMERO:\n\n",
      "\nEscribí NUEVA seguido del nombre para agregar una tarjeta nueva o CANCELAR para cancelar la operación."
    );
    sendTelegram(msg);
  }
};