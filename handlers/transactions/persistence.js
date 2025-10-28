function saveTransaction(estado) {
  if (estado.tipo === "GASTO") {
    appendSpentRow(estado);
  } else if (estado.tipo === "INGRESO") {
    appendIncomeRow(estado);
  } else if (estado.tipo === "TC") {
    appendSpentRow(estado);
    appendQuoteRow(estado);
  }
}

