function handleDebtorResponse(chatId, message, userState) {
  const debtors = itemList_(SHEET_DEUDORES.name);
  let debtorName = null;

  if (message.toUpperCase().startsWith("NUEVO")) {
    const newDebtorName = message.substring(6).trim();

    if (!newDebtorName) {
      sendTelegram("Formato incorrecto. Usá: NUEVO Nombre");
      DebtorCommand.sendSelectionList();
      return;
    }

    saveItem_(newDebtorName, SHEET_DEUDORES.name);
    debtorName = newDebtorName;
  } else {
    const itemNumber = parseInt(message, 10);

    if (!isNaN(itemNumber) && itemNumber >= 1 && itemNumber <= debtors.length) {
      debtorName = debtors[itemNumber - 1];
    } else {
      sendTelegram("Número inválido.");
      DebtorCommand.sendSelectionList();
      return;
    }
  }

  userState.deudor = debtorName;
  userState.esperandoDeudor = false;

  finishDebtFlow_(chatId, userState);
}