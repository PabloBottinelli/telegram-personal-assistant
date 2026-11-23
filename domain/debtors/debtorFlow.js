var DebtorFlow = {
    handleDeleteDebtorStep(chatId, message, state) {
        const result = ItemFlow.resolveItemSelection(message, SHEET_DEUDORES.name, DebtorCommand.sendExistingSelectionList, false)

        if (!result) return;

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

    handleEditDebtorStep(chatId, message, state) {
        const result = ItemFlow.resolveItemSelection(message, SHEET_DEUDORES.name, DebtorCommand.sendExistingSelectionList, false)

        if (!result) return;

        state.data.debtor = result.value;

        state.step = "WAITING_NEW_NAME";
        saveState_(chatId, state);

        sendTelegram(`✅ Deudor "${result.value}" seleccionado. Ahora ingresá el nuevo nombre.`);
    },


    handleNameStep(chatId, message, state) {
        const oldName = state.data.debtor;
        const newName = String(message || "").trim();

        const result = DebtorService.rename(oldName, newName);

        if (!result.ok) {
            sendTelegram(result.error);
            return;
        }

        statesReset(chatId);

        sendTelegram(`✅ Deudor "${result.oldName}" renombrado como "${result.newName}".`);
    },
}