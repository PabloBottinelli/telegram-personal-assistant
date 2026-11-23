var ItemFlow = {
    resolveItemSelection(message, sheetName, onInvalid, allowCreate = true) {
        const result = allowCreate ? ItemService.parseSelection(message, sheetName) : ItemService.parseExistingSelection(message, sheetName);

        if (!result.ok) {
            sendTelegram(result.error);
            onInvalid();
            return null;
        }

        return result;
    }
}