function handleExpenseCategoryStep_(chatId, message, state) {
  const result = ItemService.parseSelection(message, SHEET_CATEGORIAS.name);

  if (!result.ok) {
    sendTelegram(result.message);
    CategoryCommand.sendSelectionList();
    return;
  }

  state.data.categoria = result.value;

  ExpenseService.create(state.data);

  sendTelegram(`✅ Gasto registrado en ${result.value}.`);
  statesReset();
}