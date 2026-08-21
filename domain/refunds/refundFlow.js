var RefundFlow = {
    handleIndexStep(chatId, message, state) {
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
}
