var CreditCardCommand = {
  list() {
    ItemCommand.list(SHEET_TARJETAS.name, "No hay tarjetas guardadas", "Estas son las tarjetas:\n")
  },

  sendSelectionList() {
    ItemCommand.sendSelectionList(SHEET_TARJETAS.name, "Seleccioná una tarjeta escribiendo el NÚMERO:\n\n", "\nEscribí NUEVA seguido del nombre para agregar una tarjeta nueva o CANCELAR para cancelar la operación.")
  },

  handleChangeDate(chatId, parts, type) {
    const input = CreditCardParser.parse(parts);
    const result = CreditCardValidator.validate(input, type);

    if (!result.ok) {
      sendTelegram(result.errors.join("\n") + `\n\nEj:\n${type}\n31/10`);
      return;
    }

    CreditCardService.startChangeDateFlow(chatId, result.value, type);
  },

  create(parts) {
    ItemCommand.createItem(parts, SHEET_TARJETAS.name, "NUEVA TARJETA", "✅ Tarjeta agregada:")
  },

  listDates() {
    const cards = CreditCardRepository.list()
    const msg = CreditCardFormatter.formatDates(cards)
    sendTelegram(msg);
  }
};