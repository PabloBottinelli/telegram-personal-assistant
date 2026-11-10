var ItemCommand = {
    list(sheetName, noItemsMsg, header) {
        const items = ItemRepository.getAllFrom(sheetName);
        if (items.length == 0) {
            sendTelegram(noItemsMsg)
        } else {
            const msg = ItemFormatter.formatPlainList(items, header);
            sendTelegram(msg);
        }
    },

    sendSelectionList(sheetName, header, footer = "") {
        const items = ItemRepository.getAllFrom(sheetName);
        sendTelegram(ItemFormatter.formatNumberedList(items, header, footer));
    },

    createItem(parts, sheetName, commandName, resultMsg) {
        const name = parts[1].trim();
        if (!name) {
            sendTelegram(MSG_ERRORS.MSG_FORMAT_ERROR_BASE + COMMANDS[commandName].format_indication);
        } else {
            const result = ItemRepository.saveIfMissing(name, sheetName);

            if (result?.exist) {
                sendTelegram(MSG_ERRORS.ITEM_EXISTENTE)
            } else {
                sendTelegram(`${resultMsg} "${name}".`);
            }
        }
    },
}