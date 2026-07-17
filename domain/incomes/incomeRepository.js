const IncomeRepository = {
  append(income) {
    const sh = getSheet_(SHEET_INGRESOS.name);
    const rowIndex = findNextRowInTable_(sh);
    const cols = getHeaderMapFromSheet_(sh);

    const id = income.id || generateId_("ING");

    const row = new Array(sh.getLastColumn()).fill("");

    row[getRequiredHeaderIndex_(cols, "ID", SHEET_INGRESOS.name)] = id;
    row[getRequiredHeaderIndex_(cols, "Fecha", SHEET_INGRESOS.name)] = income.fecha;
    row[getRequiredHeaderIndex_(cols, "Categoría", SHEET_INGRESOS.name)] = income.categoria;
    row[getRequiredHeaderIndex_(cols, "Monto", SHEET_INGRESOS.name)] = income.monto;
    row[getRequiredHeaderIndex_(cols, "Moneda", SHEET_INGRESOS.name)] = income.moneda;
    row[getRequiredHeaderIndex_(cols, "Detalle", SHEET_INGRESOS.name)] = income.detalle;

    sh.getRange(rowIndex, START_COL, 1, row.length).setValues([row]);

    sortTableByDate_(sh, sh.getLastColumn());

    return id;
  }
};