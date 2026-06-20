function saveTransaction(userState) {
  if (userState.tipo === "GASTO") {
    return appendSpentRow(userState);
  }

  if (userState.tipo === "INGRESO") {
    return appendIncomeRow(userState);
  }

  if (userState.tipo === "TC") {
    const gastoId = generateId_("GAS");

    userState.id = gastoId;

    appendSpentRow(userState);
    appendCuotaRow(userState, gastoId);

    return gastoId;
  }
}