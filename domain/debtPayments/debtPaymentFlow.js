var DebtPaymentFlow = {
  handleDebtorStep(chatId, message, state) {
    if(message.includes("NUEVO")) {
      sendTelegram("No podes registrar una deuda sobre un deudor nuevo.");
      DebtorCommand.sendExistingSelectionList();
      return;
    }

    const result = ItemService.parseSelection(message, SHEET_DEUDORES.name);

    if (!result.ok) {
      sendTelegram(result.error);
      DebtorCommand.sendExistingSelectionList();
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
      DebtPaymentFlow.registerDebtPayment(debts[0], state.data.monto);
      statesReset();
      return;
    }

    state.step = "WAITING_DEBT_TO_PAY";
    state.data.deudasDisponibles = debts.map(d => d.id);
    saveState_(chatId, state);
    sendTelegram(DebtFormatter.formatPaymentSelection(state.data.deudor, debts));
  },

  handleDebtToPayStep(chatId, message, state) {
    const msg = String(message || "").trim();
    const idx = parseInt(msg, 10);

    const ids = state.data?.deudasDisponibles || [];

    if (isNaN(idx) || idx < 1 || idx > ids.length) {
      sendTelegram(MSG_ERRORS.NUMERO_INVALIDO);
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

    DebtPaymentFlow.registerDebtPayment(deuda, state.data.monto);
    statesReset();
  },

  registerDebtPayment(deuda, montoPago) {
    try {
      const result = DebtPaymentService.register({
        deudaId: deuda.id,
        monto: montoPago
      });

      sendTelegram(DebtPaymentFormatter.formatPaymentSuccess(result));
      return true;
    } catch (err) {
      sendTelegram(DebtPaymentFormatter.formatPaymentError(err));
      return false;
    }
  }
}