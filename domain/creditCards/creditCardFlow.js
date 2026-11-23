var CreditCardFlow = {
  handleCardStep(chatId, message, state) {
    const result = ItemFlow.resolveItemSelection(message, SHEET_TARJETAS.name, CreditCardCommand.sendSelectionList, true)

    if (!result) return;

    state.data.metodo = result.value;

    CreditCardService.changeDate(state.data);

    if (result.exist) {
      sendTelegram(`${result.value} ya existe, no se guardará nuevamente.\n ✅ Fecha actualizada para la tarjeta ${result.value}.`);
    } else {
      sendTelegram(`✅ Fecha actualizada para la tarjeta ${result.value}.`);
    }

    statesReset(chatId);
  }
}