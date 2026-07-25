function startMarkFlow(chatId, pendingExpenses) {
    const state = {
        flow: "MARK_REFUND",
        step: "WAITING_INDEX",
        data: {
            pendingRefunds: pendingExpenses.map(expense => ({
                id: expense.id,
                fecha: expense.fecha,
                moneda: expense.moneda,
                ahorro: expense.ahorro,
                detalle: expense.detalle,
                medio: expense.medio
            }))
        },
        timestamp: Date.now()
    };

    saveState_(chatId, state);

    sendTelegram(RefundFormatter.selectionPrompt(pendingExpenses));
}

function handleIndexResponse_(chatId, message, state) {
    const index = Number(message);
    const pending = state.data?.pendingRefunds || [];

    if (
        !Number.isInteger(index) ||
        index < 1 ||
        index > pending.length
    ) {
        sendTelegram(RefundFormatter.invalidIndex());
        return;
    }

    const selected = pending[index - 1];
    const result = RefundService.markAsRefunded(selected.id);

    if (!result.ok) {
        sendTelegram(result.message);
        statesReset();
        return;
    }

    sendTelegram(RefundFormatter.marked(result.value));
    statesReset();
}
