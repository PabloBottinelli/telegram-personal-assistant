var DebtFlow = {
  handleDebtorStep(chatId, message, state) {
    const result = ItemService.parseSelection(message, SHEET_DEUDORES.name);

    if (!result.ok) {
      sendTelegram(result.error);
      DebtorCommand.sendSelectionListWithCreateOption();
      return;
    }

    state.data.deudor = result.value;

    const deudaId = DebtService.create(state.data);

    const prefix = result.exist ? `${result.value} ya existe, no se guardará nuevamente.\n` : "";
    
    sendTelegram(
      prefix +
      `✅ Deuda registrada.\n` +
      `Deudor: ${state.data.deudor}\n` +
      `Monto deuda: ${fmtMoney_(state.data.moneda, state.data.monto)}\n` +
      `Detalle: ${state.data.detalle}\n` +
      `Deuda ID: ${deudaId}`
    );

    statesReset(chatId);
  }
}