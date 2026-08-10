function handleEditCategory_(chatId, message, state) {
    const result = ItemService.parseExistingSelection(message, SHEET_CATEGORIAS.name);

    if (!result.ok) {
        sendTelegram(result.error);
        CategoryCommand.sendSelectionList();
        return;
    }

    state.data.categoria = result.value;

    state.step = "WAITING_NEW_NAME";
    saveState_(chatId, state);

    sendTelegram(`✅ Categoría "${result.value}" seleccionada. Ahora ingresá el nuevo nombre.`);
}

function handleNewCategoryName_(chatId, message, state) {
    const oldName = state.data.categoria;
    const newName = String(message || "").trim();

    const result = CategorieService.rename(oldName, newName);

    if (!result.ok) {
        sendTelegram(result.error);
        return;
    }

    statesReset();

    sendTelegram(`✅ Categoría "${result.oldName}" renombrada como "${result.newName}".`);
}

function handleDeleteCategory_(chatId, message, state) {
  const result = ItemService.parseExistingSelection(message, SHEET_CATEGORIAS.name);

  if (!result.ok) {
    sendTelegram(result.error);
    CategoryCommand.sendSelectionList();
    return;
  }

  const categoryName = result.value;

  if (String(categoryName).trim().toLowerCase() === "ajeno") {
    sendTelegram('La categoría "Ajeno" no se puede eliminar.');
    statesReset();
    return;
  }

  const isUsed = CategorieService.isCategoryUsed(categoryName);

  if (!isUsed) {
    const deleteResult = CategorieService.delete(categoryName);

    if (!deleteResult.ok) {
      sendTelegram(deleteResult.error);
      return;
    }

    statesReset();
    sendTelegram(`✅ Categoría "${categoryName}" eliminada.`);
    return;
  }

  state.data.categoria = categoryName;
  state.step = "WAITING_REPLACE_CATEGORY";

  saveState_(chatId, state);

  sendTelegram(`La categoría "${categoryName}" está siendo utilizada en registros, elegí la categoría de reemplazo.`);
  CategoryCommand.sendSelectionList();
}

function handleReplaceCategory_(chatId, message, state) {
  const result = ItemService.parseExistingSelection(message, SHEET_CATEGORIAS.name);

  if (!result.ok) {
    sendTelegram(result.error);
    CategoryCommand.sendSelectionList();
    return;
  }

  const oldName = state.data.categoria;
  const replacementName = result.value;

  if (oldName.toLowerCase() === replacementName.toLowerCase()) {
    sendTelegram("La categoría de reemplazo debe ser distinta.");
    CategoryCommand.sendSelectionList();
    return;
  }

  const deleteResult = CategorieService.replaceAndDelete(oldName, replacementName);

  if (!deleteResult.ok) {
    sendTelegram(deleteResult.error);
    return;
  }

  statesReset();

  sendTelegram(`✅ Categoría "${oldName}" eliminada. Los registros fueron movidos a "${replacementName}".`);
}