function handleCardResponse(chatId, message, state) {
  const result = ItemService.parseSelection(message, SHEET_TARJETAS.name);

  if (!result.ok) {
    sendTelegram(result.error);
    CreditCardCommand.sendSelectionList();
    return;
  }

  state.data.metodo = result.value;

  CreditCardService.changeDate(state.data);

  sendTelegram(`✅ Fecha actualizada para la tarjeta ${result.value}.`);
  statesReset();
}