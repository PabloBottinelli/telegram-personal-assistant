var CreditCardExpenseFlow = {
    handleCategoryStep(chatId, message, state) {
        const result = ItemService.parseSelection(message, SHEET_CATEGORIAS.name);

        if (!result.ok) {
            sendTelegram(result.error);
            CategoryCommand.sendSelectionListWithCreateOption();
            return;
        }

        state.data.categoria = result.value;

        state.step = "WAITING_METHOD";
        saveState_(chatId, state);

        if (result.exist) {
            sendTelegram(`${result.value} ya existe, no se guardará nuevamente.\n ✅ Categoría "${result.value}" seleccionada. Ahora elegí con que tarjeta pagaste.`);
        } else {
            sendTelegram(`✅ Categoría "${result.value}" seleccionada. Ahora elegí con que tarjeta pagaste.`);
        }

        CreditCardCommand.sendSelectionList();
    },

    handleMethodStep(chatId, message, state) {
        const result = ItemService.parseSelection(message, SHEET_TARJETAS.name);

        if (!result.ok) {
            sendTelegram(result.error);
            CreditCardCommand.sendSelectionList();
            return;
        }

        state.data.metodo = result.value;

        const isAjenoCategory = String(state.data.categoria || "").trim().toLowerCase() === "ajeno";

        if (isAjenoCategory) {
            state.step = "WAITING_DEBTOR";
            saveState_(chatId, state);

            if (result.exist) {
                sendTelegram(`${result.value} ya existe, no se guardará nuevamente.\n ✅ Método "${result.value}" seleccionado. Ahora elegí quién te debe este gasto.`);
            } else {
                sendTelegram(`✅ Método "${result.value}" guardado. Ahora elegí quién te debe este gasto.`);
            }

            DebtorCommand.sendSelectionListWithCreateOption();
            return;
        }


        const gastoId = ExpenseService.create(state.data);
        state.data.gastoId = gastoId;
        CreditCardExpenseService.create(state.data);

        if (result.exist) {
            sendTelegram(`${result.value} ya existe, no se guardará nuevamente.\n ✅ Gasto con tarjeta de crédito registrado en ${result.value}.`);
        } else {
            sendTelegram(`✅ Gasto con tarjeta de crédito registrado en ${result.value}.`);
        }

        statesReset();
    },

    handleDebtorStep(chatId, message, state) {
        const result = ItemService.parseSelection(message, SHEET_DEUDORES.name);

        if (!result.ok) {
            sendTelegram(result.error);
            DebtorCommand.sendSelectionListWithCreateOption();
            return;
        }

        state.data.deudor = result.value;

        const gastoId = ExpenseService.create(state.data);
        const montoDeuda = state.data.monto - state.data.ahorro

        const deudaId = DebtService.create({
            fecha: state.data.fecha,
            deudor: state.data.deudor,
            moneda: state.data.moneda,
            monto: montoDeuda,
            detalle: state.data.detalle,
            gastoId: gastoId
        });

        state.data.gastoId = gastoId;
        CreditCardExpenseService.create(state.data);

        if (result.exist) {
            sendTelegram(
                `${result.value} ya existe, no se guardará nuevamente.\n` +
                `✅ Gasto ajeno con tarjeta de crédito registrado.\n` +
                `Deudor: ${state.data.deudor}\n` +
                `Monto deuda: ${fmtMoney_(state.data.moneda, montoDeuda)}\n` +
                `Detalle: ${state.data.detalle}\n` +
                `Método de pago: ${state.data.metodo}\n` +
                `Deuda ID: ${deudaId}`
            );
        } else {
            sendTelegram(
                `✅ Gasto ajeno con tarjeta de crédito registrado.\n` +
                `Deudor: ${state.data.deudor}\n` +
                `Monto deuda: ${fmtMoney_(state.data.moneda, montoDeuda)}\n` +
                `Detalle: ${state.data.detalle}\n` +
                `Método de pago: ${state.data.metodo}\n` +
                `Deuda ID: ${deudaId}`
            );
        }

        statesReset();
    }
}
