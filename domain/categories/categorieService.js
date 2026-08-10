var CategorieService = {
    startEditFlow(chatId) {
        saveState_(chatId, {
            flow: "EDIT_CATEGORY",
            step: "WAITING_CATEGORY",
            data: {},
            timestamp: Date.now()
        });

        CategoryCommand.sendSelectionList();
    },

    startDeleteFlow(chatId) {
        saveState_(chatId, {
            flow: "DELETE_CATEGORY",
            step: "WAITING_CATEGORY",
            data: {},
            timestamp: Date.now()
        });

        CategoryCommand.sendSelectionList();
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

        if (oldNameClean.toLowerCase() === "ajeno") {
            return {
                ok: false,
                error: 'La categoría "Ajeno" no se puede modificar.'
            };
        }

        const categories = ItemRepository.list(SHEET_CATEGORIAS.name);

        const alreadyExists = categories.some(category =>
            String(category).trim().toLowerCase() === newNameClean.toLowerCase()
        );

        if (alreadyExists) {
            return {
                ok: false,
                error: MSG_ERRORS.ITEM_EXISTENTE
            };
        }

        const renamed = ItemRepository.rename(
            oldNameClean,
            newNameClean,
            SHEET_CATEGORIAS.name
        );

        if (!renamed) {
            return {
                ok: false,
                error: `No encontré la categoría "${oldNameClean}".`
            };
        }

        ExpenseRepository.renameCategory(oldNameClean, newNameClean);
        IncomeRepository.renameCategory(oldNameClean, newNameClean);

        return {
            ok: true,
            oldName: oldNameClean,
            newName: newNameClean
        };
    },

    replaceAndDelete(oldName, replacementName) {
        const oldNameClean = String(oldName || "").trim();
        const replacementNameClean = String(replacementName || "").trim();

        if (!oldNameClean || !replacementNameClean) {
            return {
                ok: false,
                error: "Las categorías no pueden estar vacías."
            };
        }

        if (oldNameClean.toLowerCase() === replacementNameClean.toLowerCase()) {
            return {
                ok: false,
                error: "La categoría de reemplazo debe ser distinta."
            };
        }

        if (oldNameClean.toLowerCase() === "ajeno") {
            return {
                ok: false,
                error: 'La categoría "Ajeno" no se puede modificar.'
            };
        }

        const categories = ItemRepository.list(SHEET_CATEGORIAS.name);

        const oldExists = categories.some(category =>
            String(category).trim().toLowerCase() === oldNameClean.toLowerCase()
        );

        const replacementExists = categories.some(category =>
            String(category).trim().toLowerCase() === replacementNameClean.toLowerCase()
        );

        if (!oldExists) {
            return {
                ok: false,
                error: `No encontré la categoría "${oldNameClean}".`
            };
        }

        if (!replacementExists) {
            return {
                ok: false,
                error: `No encontré la categoría de reemplazo "${replacementNameClean}".`
            };
        }

        ExpenseRepository.renameCategory(oldNameClean, replacementNameClean);
        IncomeRepository.renameCategory(oldNameClean, replacementNameClean);

        const deleted = ItemRepository.delete(
            oldNameClean,
            SHEET_CATEGORIAS.name
        );

        if (!deleted) {
            return {
                ok: false,
                error: `No pude eliminar la categoría "${oldNameClean}".`
            };
        }

        return {
            ok: true,
            deleted: oldNameClean,
            replacement: replacementNameClean
        };
    },

    isCategoryUsed(categoryName) {
        return ExpenseRepository.usesCategory(categoryName) ||
            IncomeRepository.usesCategory(categoryName);
    },

    delete(categoryName) {
        const name = String(categoryName || "").trim();

        if (name.toLowerCase() === "ajeno") {
            return {
                ok: false,
                error: 'La categoría "Ajeno" no se puede eliminar.'
            };
        }

        const deleted = ItemRepository.delete(name, SHEET_CATEGORIAS.name);

        if (!deleted) {
            return {
                ok: false,
                error: `No encontré la categoría "${name}".`
            };
        }

        return {
            ok: true,
            deleted: name
        };
    },
}