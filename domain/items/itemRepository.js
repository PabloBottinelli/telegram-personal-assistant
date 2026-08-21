var ItemRepository = {
  list(sheetName) {
    const sh = getSheet_(sheetName);
    const values = getTableValues_(sh, sh.getLastColumn());
    const cols = getHeaderMapFromSheet_(sh);
    const config = getItemSheetConfig_(sheetName);

    if (!hasData_(values)) return [];

    const nameIdx = getRequiredHeaderIndex_(cols, config.nameHeader, sheetName);

    return values
      .map(row => String(row[nameIdx] || "").trim())
      .filter(name => name !== "");
  },

  saveIfMissing(name, sheetName) {
    const cleanName = String(name || "").trim();
    if (!cleanName) return null;

    const items = this.list(sheetName);
    const alreadyExists = items.some(x => x.toLowerCase() === cleanName.toLowerCase());

    if (alreadyExists) return {
      ok: false,
      exist: true,
    };

    this.append(cleanName, sheetName);

    return {
      ok: true,
      exist: false,
      cleanName
    };
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
    const values = getTableValues_(sh, sheetNumCols || sh.getLastColumn());
    const cols = getHeaderMapFromSheet_(sh);
    const config = getItemSheetConfig_(sheetName);

    if (!hasData_(values)) return null;

    const nameIdx = getRequiredHeaderIndex_(cols, config.nameHeader, sheetName);
    const itemNorm = String(item || "").trim().toLowerCase();

    for (let i = 0; i < values.length; i++) {
      const valueNorm = String(values[i][nameIdx] || "").trim().toLowerCase();
      if (valueNorm === itemNorm) return START_ROW + i;
    }

    return null;
  },

  rename(oldName, newName, sheetName) {
    const sh = getSheet_(sheetName);
    const values = getTableValues_(sh, sh.getLastColumn());
    const cols = getHeaderMapFromSheet_(sh);
    const config = getItemSheetConfig_(sheetName);

    const nameIdx = getRequiredHeaderIndex_(cols, config.nameHeader, sheetName);
    const oldNameNorm = String(oldName || "").trim().toLowerCase();

    for (let i = 0; i < values.length; i++) {
      const currentName = String(values[i][nameIdx] || "").trim().toLowerCase();

      if (currentName !== oldNameNorm) continue;

      sh.getRange(START_ROW + i, START_COL + nameIdx).setValue(newName);
      return true;
    }

    return false;
  },

  delete(name, sheetName) {
    const sh = getSheet_(sheetName);
    const values = getTableValues_(sh, sh.getLastColumn());
    const cols = getHeaderMapFromSheet_(sh);
    const config = getItemSheetConfig_(sheetName);

    const nameIdx = getRequiredHeaderIndex_(cols, config.nameHeader, sheetName);
    const target = String(name || "").trim().toLowerCase();

    for (let i = 0; i < values.length; i++) {
      const current = String(values[i][nameIdx] || "").trim().toLowerCase();

      if (current !== target) continue;

      sh.deleteRow(START_ROW + i);
      return true;
    }

    return false;
  }
};
