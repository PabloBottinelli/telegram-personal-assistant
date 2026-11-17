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

    startEditFlow(chatId) {
        if (ItemRepository.getAllFrom(SHEET_DEUDORES.name).length === 0) {
            sendTelegram("No hay deudores guardados");
            return;
        }

        saveState_(chatId, {
            flow: "EDIT_DEBTOR",
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
    },

    rename(oldName, newName) {
        const oldNameClean = String(oldName || "").trim();
        const newNameClean = String(newName || "").trim();

        if (!newNameClean) {
            return {
                ok: false,
                error: "El nuevo nombre no puede estar vacío."
            };
        }

        if (oldNameClean.toLowerCase() === newNameClean.toLowerCase()) {
            return {
                ok: false,
                error: "El nuevo nombre debe ser distinto al actual."
            };
        }

        const debtors = ItemRepository.getAllFrom(SHEET_DEUDORES.name);

        const alreadyExists = debtors.some(debtor =>
            String(debtor).trim().toLowerCase() === newNameClean.toLowerCase()
        );

        if (alreadyExists) {
            return {
                ok: false,
                error: MSG_ERRORS.ITEM_EXISTENTE_CANCELAR
            };
        }

        const renamed = ItemRepository.rename(
            oldNameClean,
            newNameClean,
            SHEET_DEUDORES.name
        );

        if (!renamed) {
            return {
                ok: false,
                error: `No encontré el deudor "${oldNameClean}".`
            };
        }

        DebtRepository.renameDebtor(oldNameClean, newNameClean);
        DebtPaymentRepository.renameDebtor(oldNameClean, newNameClean);

        return {
            ok: true,
            oldName: oldNameClean,
            newName: newNameClean
        };
    },
}
