var IncomeFlow = {
  handleCategoryStep(chatId, message, state) {
    const result = ItemFlow.resolveItemSelection(message, SHEET_CATEGORIAS.name, CategoryCommand.sendSelectionListWithCreateOption, true)

    if (!result) return;

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