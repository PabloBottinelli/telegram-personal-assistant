function handleDebtorResponse(chatId, message, userState) {
  const msg = String(message || "").trim();

  const debtors = itemList_(SHEET_DEUDORES.name);
  let debtorName = null;

  if (msg.toUpperCase().startsWith("NUEVO ")) {
    const newDebtorName = msg.substring(6).trim();

    if (!newDebtorName) {
      sendTelegram("Formato incorrecto. Usá: NUEVO Nombre");
      itemListDebtorsMsg();
      return;
    }

    saveItem_(newDebtorName, SHEET_DEUDORES.name);
    debtorName = newDebtorName;
  } else {
    const itemNumber = parseInt(msg, 10);

    if (!isNaN(itemNumber) && itemNumber >= 1 && itemNumber <= debtors.length) {
      debtorName = debtors[itemNumber - 1];
    } else {
      sendTelegram("Número inválido.");
      itemListDebtorsMsg();
      return;
    }
  }

  userState.deudor = debtorName;
  userState.esperandoDeudor = false;

  finishDebtFlow_(chatId, userState);
}