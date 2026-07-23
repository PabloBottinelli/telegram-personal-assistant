function handleDebtorResponse(chatId, message, state) {
  const result = ItemService.parseSelection(message, SHEET_DEUDORES.name);

  if (!result.ok) {
    sendTelegram(result.error);
    DebtorCommand.sendSelectionList();
    return;
  }

  state.data.deudor = result.value;

  const deudaId = DebtService.create(state.data);

  sendTelegram(
    `✅ Deuda registrada.\n` +
    `Deudor: ${state.data.deudor}\n` +
    `Monto deuda: ${fmtMoney_(state.data.moneda, state.data.monto)}\n` +
    `Detalle: ${state.data.detalle}\n` +
    `Deuda ID: ${deudaId}`
  );

  statesReset();
}