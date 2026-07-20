var CreditCardCommand = {
  handleChangeDate(chatId, parts, type) {
    const input = CreditCardParser.parse(parts);
    const result = CreditCardValidator.validate(input);

    if (!result.ok) {
      sendTelegram(MSG_ERRORS.FECHA_INVALIDA_STRICT + `\n\nEj:\n${type}\n31/10`);
      return;
    }

    CreditCardService.startChangeDateFlow(chatId, result.value, type);
  },

  list() {
    const items = ItemRepository.list(SHEET_TARJETAS.name);
    const msg = ItemFormatter.formatPlainList(items, "Estas son las tarjetas:\n");
    sendTelegram(msg);
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