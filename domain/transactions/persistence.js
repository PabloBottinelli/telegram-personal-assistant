function saveTransaction(userState) {
  if (userState.tipo === "GASTO") {
    appendSpentRow(userState);
    return;
  }

  if (userState.tipo === "INGRESO") {
    appendIncomeRow(userState);
    return;
  }

  if (userState.tipo === "TC") {
    const gastoId = generateId_("GAS");

    userState.id = gastoId;

    appendSpentRow(userState);
    appendCuotaRow(userState, gastoId);

    return;
  }
}