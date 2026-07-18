function handleIncomeCategoryStep_(chatId, message, state) {
  const result = ItemService.parseSelection(message, SHEET_CATEGORIAS.name);

  if (!result.ok) {
    sendTelegram(result.message || result.error);
    CategoryCommand.sendSelectionList();
    return;
  }

  state.data.categoria = result.value;

  IncomeService.create(state.data);

  sendTelegram(`✅ Registro completado con categoría "${result.value}".`);
  statesReset();
}