var IncomeFlow = {
  handleCategoryStep(chatId, message, state) {
    const result = ItemService.parseSelection(message, SHEET_CATEGORIAS.name);

    if (!result.ok) {
      sendTelegram(result.message || result.error);
      CategoryCommand.sendSelectionListWithCreateOption();
      return;
    }

    state.data.categoria = result.value;

    IncomeService.create(state.data);

    if (result.exist) {
      sendTelegram(`${result.value} ya existe, no se guardará nuevamente.\n ✅ Registro completado con categoría "${result.value}".`);
    } else {
      sendTelegram(`✅ Registro completado con categoría "${result.value}".`);
    }

    statesReset(chatId);
  }
}