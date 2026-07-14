var ItemRepository = {
  list(sheetName) {
    const sh = getSheet_(sheetName);
    return getColumnAsList_(sh);
  },

  saveIfMissing(name, sheetName) {
    const cleanName = String(name || "").trim();
    if (!cleanName) return null;

    const items = this.list(sheetName);
    const alreadyExists = items.some(x => x.toLowerCase() === cleanName.toLowerCase());

    if (alreadyExists) return cleanName;

    this.append(cleanName, sheetName);
    return cleanName;
  },

  append(name, sheetName) {
    const sh = getSheet_(sheetName);
    const rowIndex = findNextRowInTable_(sh);
    const cols = getHeaderMapFromSheet_(sh);

    const config = getItemSheetConfig_(sheetName);

    const idxName = getRequiredHeaderIndex_(cols, config.nameHeader, sheetName);
    const idxId = getRequiredHeaderIndex_(cols, "ID", sheetName);

    sh.getRange(rowIndex, START_COL + idxName).setValue(name);
    sh.getRange(rowIndex, START_COL + idxId).setValue(generateId_(config.idPrefix));
  },

  findRowByName(item, sheetName, sheetNumCols) {
    const sh = getSheet_(sheetName);
    const values = getTableValues_(sh, sheetNumCols);

    if (!hasData_(values)) return null;

    const itemNorm = String(item || "").trim().toLowerCase();

    for (let i = 0; i < values.length; i++) {
      const valueNorm = String(values[i][0] || "").trim().toLowerCase();
      if (valueNorm === itemNorm) return START_ROW + i;
    }

    return null;
  }
};