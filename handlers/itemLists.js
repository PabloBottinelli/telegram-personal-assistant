function itemList(tableName) {
  const sh = getSheet_(SHEET_LISTAS);
  return leerColumnaComoLista_(sh, tableName.startCol);
}

function saveItem(item, tableName) {
  const name = String(item || '').trim();
  if (!name) return;
  const items = itemList(tableName);
  const alreadyExists = items.some(x => x.toLowerCase() === name.toLowerCase());
  if (alreadyExists) return;
  appendTarjeta_(name);
}