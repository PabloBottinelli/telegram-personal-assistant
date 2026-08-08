function handleEditCategory_(chatId, message, state) {
    const result = ItemService.parseSelection(message, SHEET_CATEGORIAS.name);

    if (!result.ok) {
        sendTelegram(result.error);
        CategoryCommand.sendEditSelectionList();
        return;
    }

    state.data.categoria = result.value;

    state.step = "WAITING_NEW_NAME";
    saveState_(chatId, state);

    sendTelegram(`✅ Categoría "${result.value}" seleccionada. Ahora ingresá el nuevo nombre.`);
}

function handleNewCategoryName_(chatId, message, state){
    
}