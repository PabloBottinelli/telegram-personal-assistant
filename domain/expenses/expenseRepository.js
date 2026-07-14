const ExpenseRepository = {
  list() {
    const sh = getSheet_(SHEET_GASTOS.name);
    const values = getTableValues_(sh, sh.getLastColumn());
    const cols = getHeaderMapFromSheet_(sh);

    if (!hasData_(values)) return [];

    return values
      .filter(row => row.some(v => String(v).trim() !== ""))
      .map(row => expenseFromRow_(row, cols));
  },

  mapById() {
    const map = new Map();

    this.list().forEach(gasto => {
      const id = String(gasto.id || "").trim();
      if (id) {
        map.set(id, gasto);
      }
    });

    return map;
  },

  findById(id) {
    const idNorm = String(id || "").trim();
    if (!idNorm) return null;

    return this.list().find(gasto => String(gasto.id || "").trim() === idNorm) || null;
  },

  append(gasto) {
    const sh = getSheet_(SHEET_GASTOS.name);
    const rowIndex = findNextRowInTable_(sh);
    const cols = getHeaderMapFromSheet_(sh);

    const id = gasto.id || generateId_("GAS");

    const row = new Array(sh.getLastColumn()).fill("");

    row[getRequiredHeaderIndex_(cols, "ID", SHEET_GASTOS.name)] = id;
    row[getRequiredHeaderIndex_(cols, "Fecha", SHEET_GASTOS.name)] = gasto.fecha;
    row[getRequiredHeaderIndex_(cols, "Categoría", SHEET_GASTOS.name)] = gasto.categoria;
    row[getRequiredHeaderIndex_(cols, "Medio de pago", SHEET_GASTOS.name)] = gasto.medio;
    row[getRequiredHeaderIndex_(cols, "Monto", SHEET_GASTOS.name)] = gasto.monto;
    row[getRequiredHeaderIndex_(cols, "Moneda", SHEET_GASTOS.name)] = gasto.moneda;
    row[getRequiredHeaderIndex_(cols, "Ahorro", SHEET_GASTOS.name)] = gasto.ahorro;
    row[getRequiredHeaderIndex_(cols, "Detalle", SHEET_GASTOS.name)] = gasto.detalle;
    row[getRequiredHeaderIndex_(cols, "Tipo", SHEET_GASTOS.name)] = gasto.tipo;
    row[getRequiredHeaderIndex_(cols, "Reintegrado?", SHEET_GASTOS.name)] = gasto.reintegrado;

    sh.getRange(rowIndex, START_COL, 1, row.length).setValues([row]);

    sortTableByDate_(sh, sh.getLastColumn());

    return id;
  }
};