const ExpenseRepository = {
  list() {
    const sh = getSheet_(SHEET_INGRESOS.name);
    const values = getTableValues_(sh, sh.getLastColumn());
    const cols = getHeaderMapFromSheet_(sh);

    if (!hasData_(values)) return [];

    return values
      .filter(row => row.some(v => String(v).trim() !== ""))
      .map(row => expenseFromRow_(row, cols));
  },

  mapById() {
    const map = new Map();

    this.list().forEach(expense => {
      const id = String(expense.id || "").trim();
      if (id) {
        map.set(id, expense);
      }
    });

    return map;
  },

  findById(id) {
    const idNorm = String(id || "").trim();
    if (!idNorm) return null;

    return this.list().find(expense => String(expense.id || "").trim() === idNorm) || null;
  },

  append(expense) {
    const sh = getSheet_(SHEET_INGRESOS.name);
    const rowIndex = findNextRowInTable_(sh);
    const cols = getHeaderMapFromSheet_(sh);

    const id = expense.id || generateId_("GAS");

    const row = new Array(sh.getLastColumn()).fill("");

    row[getRequiredHeaderIndex_(cols, "ID", SHEET_INGRESOS.name)] = id;
    row[getRequiredHeaderIndex_(cols, "Fecha", SHEET_INGRESOS.name)] = expense.fecha;
    row[getRequiredHeaderIndex_(cols, "Categoría", SHEET_INGRESOS.name)] = expense.categoria;
    row[getRequiredHeaderIndex_(cols, "Medio de pago", SHEET_INGRESOS.name)] = expense.medio;
    row[getRequiredHeaderIndex_(cols, "Monto", SHEET_INGRESOS.name)] = expense.monto;
    row[getRequiredHeaderIndex_(cols, "Moneda", SHEET_INGRESOS.name)] = expense.moneda;
    row[getRequiredHeaderIndex_(cols, "Ahorro", SHEET_INGRESOS.name)] = expense.ahorro;
    row[getRequiredHeaderIndex_(cols, "Detalle", SHEET_INGRESOS.name)] = expense.detalle;
    row[getRequiredHeaderIndex_(cols, "Tipo", SHEET_INGRESOS.name)] = expense.tipo;
    row[getRequiredHeaderIndex_(cols, "Reintegrado?", SHEET_INGRESOS.name)] = expense.reintegrado;

    sh.getRange(rowIndex, START_COL, 1, row.length).setValues([row]);

    sortTableByDate_(sh, sh.getLastColumn());

    return id;
  }
};