function handleExpenseCategoryStep_(chatId, message, state) {
  const result = ItemService.parseSelection(message, SHEET_CATEGORIAS.name);

  if (!result.ok) {
    sendTelegram(result.error);
    CategoryCommand.sendSelectionList();
    return;
  }

  state.data.categoria = result.value;

  const isAjenoCategory = String(result.value || "").trim().toLowerCase() === "ajeno";

  if (isAjenoCategory) {
    state.step = "WAITING_DEBTOR";
    saveState_(chatId, state);

    sendTelegram(`✅ Categoría "${result.value}" guardada. Ahora elegí quién te debe este gasto.`);
    DebtorCommand.sendSelectionList();
    return;
  }

  ExpenseService.create(state.data);

  sendTelegram(`✅ Gasto registrado en ${result.value}.`);
  statesReset();
}

function handleExpenseDebtorStep_(chatId, message, state) {
  const result = ItemService.parseSelection(message, SHEET_DEUDORES.name);

  if (!result.ok) {
    sendTelegram(result.error);
    DebtorCommand.sendSelectionList();
    return;
  }

  state.data.deudor = result.value;

  const gastoId = ExpenseService.create(state.data);

  const deudaId = createDebt_({
    fecha: state.data.fecha,
    persona: state.data.deudor,
    moneda: state.data.moneda,
    monto: state.data.monto,
    detalle: state.data.detalle,
    gastoId: gastoId || ""
  });

  sendTelegram(
    `✅ Gasto ajeno registrado.\n` +
    `Deudor: ${state.data.deudor}\n` +
    `Monto deuda: ${fmtMoney_(state.data.moneda, state.data.monto)}\n` +
    `Detalle: ${state.data.detalle}\n` +
    `Deuda ID: ${deudaId}`
  );

  statesReset();
}