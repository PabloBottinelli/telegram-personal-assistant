function handleCreditExpenseCategoryStep_(chatId, message, state) {
    const result = ItemService.parseSelection(message, SHEET_CATEGORIAS.name);

    if (!result.ok) {
        sendTelegram(result.error);
        CategoryCommand.sendSelectionList();
        return;
    }

    state.data.categoria = result.value;

    state.step = "WAITING_METHOD";
    saveState_(chatId, state);

    sendTelegram(`✅ Categoría "${result.value}" guardada. Ahora elegí con que tarjeta pagaste.`);
    CreditCardCommand.sendSelectionList();
}

function handleCreditExpenseMethodStep_(chatId, message, state){
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

        sendTelegram(`✅ Método "${result.value}" guardado. Ahora elegí quién te debe este gasto.`);
        DebtorCommand.sendSelectionList();
        return;
    }

    
    const gastoId = ExpenseService.create(state.data);
    state.data.gastoId = gastoId;
    CreditCardExpenseService.create(state.data);

    sendTelegram(`✅ Gasto con tarjeta de crédito registrado en ${result.value}.`);
    statesReset();
}

function handleCreditExpenseDebtorStep_(chatId, message, state) {
    const result = ItemService.parseSelection(message, SHEET_DEUDORES.name);

    if (!result.ok) {
        sendTelegram(result.error);
        DebtorCommand.sendSelectionList();
        return;
    }

    state.data.deudor = result.value;

    const gastoId = ExpenseService.create(state.data);

    const deudaId = DebtService.create({
        fecha: state.data.fecha,
        deudor: state.data.deudor,
        moneda: state.data.moneda,
        monto: state.data.monto,
        detalle: state.data.detalle,
        gastoId: gastoId
    });

    state.data.gastoId = gastoId;
    CreditCardExpenseService.create(state.data);

    sendTelegram(
        `✅ Gasto ajeno con tarjeta de crédito registrado.\n` +
        `Deudor: ${state.data.deudor}\n` +
        `Monto deuda: ${fmtMoney_(state.data.moneda, state.data.monto)}\n` +
        `Detalle: ${state.data.detalle}\n` +
        `Método de pago: ${state.data.metodo}\n` +
        `Deuda ID: ${deudaId}`
    );

    statesReset();
}