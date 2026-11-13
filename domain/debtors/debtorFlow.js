var DebtorFlow = {
    handleDeleteDebtorStep(chatId, message, state) {
        const result = ItemService.parseExistingSelection(message, SHEET_DEUDORES.name);

        if (!result.ok) {
            sendTelegram(result.error);
            DebtorCommand.sendExistingSelectionList();
            return;
        }

        const debtorName = result.value;

        const deleteResult = DebtorService.delete(debtorName);

        if (!deleteResult.ok) {
            sendTelegram(deleteResult.error);
            return;
        }

        statesReset(chatId);
        sendTelegram(`✅ Deudor "${debtorName}" eliminado.`);
        return;
    },
}