var RefundCommand = {
  list() {
    const pending = RefundService.listPending();

    if (pending.length === 0) {
      sendTelegram(RefundFormatter.noPending());
      return;
    }

    sendTelegram(
      RefundFormatter.formatPendingList(pending, false)
    );
  },

  startMarkFlow(chatId) {
    const pending = RefundService.listPending();

    if (pending.length === 0) {
      sendTelegram(RefundFormatter.noPending());
      return;
    }

    startMarkFlow(chatId, pending);
  }
};