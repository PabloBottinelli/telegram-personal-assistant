function listDebtors() {
  listItems(SHEET_DEUDORES.name, "Deudores guardados:\n");
}

function itemListDebtorsMsg() {
  itemListMsg(
    SHEET_DEUDORES.name,
    "Elegí el deudor escribiendo el NÚMERO:\n\n",
    "\nO escribí NUEVO Nombre para crear uno nuevo.\nO escribí CANCELAR para abortar."
  );
}