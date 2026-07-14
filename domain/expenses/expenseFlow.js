function handleExpenseCategoryStep_(chatId, message, state) {
  const result = ItemService.parseSelection(message, SHEET_CATEGORIAS.name);

  if (!result.ok) {
    TelegramService.send(result.message);
    itemListCategoriesMsg();
    return;
  }

  state.data.categoria = result.value;

  ExpenseService.create(state.data);

  TelegramService.send(`✅ Gasto registrado en ${result.value}.`);
  StateService.clear(chatId);
}