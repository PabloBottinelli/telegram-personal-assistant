var DebtorService = {
    startDeleteFlow(chatId) {
        if (ItemRepository.getAllFrom(SHEET_DEUDORES.name).length === 0) {
            sendTelegram("No hay deudores guardados");
            return;
        }

        saveState_(chatId, {
            flow: "DELETE_DEBTOR",
            step: "WAITING_DEBTOR",
            data: {},
            timestamp: Date.now()
        });

        DebtorCommand.sendExistingSelectionList();
    },

    delete(debtorName) {
        const name = String(debtorName || "").trim();

        const deleted = ItemRepository.delete(name, SHEET_DEUDORES.name);

        if (!deleted) {
            return {
                ok: false,
                error: `No encontré el deudor "${name}".`
            };
        }

        DebtRepository.listPendingByDebtor(name).forEach(debt => {
            DebtRepository.updatePendingAmount(debt.id, 0);
        });

        return {
            ok: true,
            deleted: name
        };
    }
}
