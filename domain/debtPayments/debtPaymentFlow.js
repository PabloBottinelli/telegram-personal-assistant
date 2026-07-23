function handleDebtPaymentDebtorStep_(chatId, message, state) {
    const result = ItemService.parseSelection(message, SHEET_DEUDORES.name);

    if (!result.ok) {
        sendTelegram(result.error);
        DebtorCommand.sendSelectionList();
        return;
    }

    state.data.deudor = result.value;

    const debts = DebtRepository.listPendingByDebtor(state.data.deudor);

    if (debts.length === 0) {
        sendTelegram(`No hay deudas pendientes para ${state.data.deudor}.`);
        statesReset();
        return;
    }

    if (debts.length === 1) {
        DebtPaymentService.applyPayment(debts[0], state.data.monto);
        statesReset();
        return;
    }

    state.step = "WAITING_DEBT_TO_PAY";
    state.data.deudasDisponibles = debts.map(d => d.id);
    saveState_(chatId, state);
    sendTelegram(DebtFormatter.formatPaymentSelection(state.data.deudor, debts));
}

function handleDebtToPayStep_(chatId, message, state) {
  const msg = String(message || "").trim();
  const idx = parseInt(msg, 10);

  const ids = state.data?.deudasDisponibles || [];

  if (isNaN(idx) || idx < 1 || idx > ids.length) {
    sendTelegram("Número inválido. Elegí una deuda de la lista o escribí CANCELAR.");
    saveState_(chatId, state);

    const debts = DebtRepository.listPendingByDebtor(state.data.deudor)

    sendTelegram(DebtFormatter.formatPaymentSelection(state.data.deudor, debts));
    return;
  }

  const deudaId = ids[idx - 1];
  const deuda = DebtRepository.findById(deudaId);

  if (!deuda) {
    sendTelegram("❌ No encontré esa deuda. Volvé a intentar.");
    statesReset();
    return;
  }

  DebtPaymentService.applyPayment(deuda, state.data.monto);
  statesReset();
}