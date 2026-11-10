var ItemRepository = {
  getAllFrom(sheetName) {
    const sh = getSheet_(sheetName);
    const values = getTableValues_(sh, sh.getLastColumn());
    const cols = getHeaderMapFromSheet_(sh);
    const config = getItemSheetConfig_(sheetName);

    const nameIdx = getRequiredHeaderIndex_(cols, config.nameHeader, sheetName);

    return values
      .map(row => String(row[nameIdx] || "").trim())
      .filter(name => name !== "");
  },

  list(sheetName, noItemsMsg, header) {
    const items = this.getAllFrom(sheetName);
    if (items.length == 0) {
      sendTelegram(noItemsMsg)
    } else {
      const msg = ItemFormatter.formatPlainList(items, header);
      sendTelegram(msg);
    }
  },

  sendSelectionList(sheetName, header, footer = "") {
    const items = this.getAllFrom(sheetName);
    sendTelegram(ItemFormatter.formatNumberedList(items, header, footer));
  },

  saveIfMissing(name, sheetName) {
    const cleanName = String(name || "").trim();
    if (!cleanName) return null;

    const items = this.getAllFrom(sheetName);
    const alreadyExists = items.some(x => x.toLowerCase() === cleanName.toLowerCase());

    if (alreadyExists) return {
      ok: false,
      exist: true,
      cleanName
    };

    this.append(cleanName, sheetName);

    return {
      ok: true,
      exist: false,
      cleanName
    };
  },

  createItem(parts, sheetName, commandName, resultMsg) {
    const name = parts[1].trim();
    if (!name) {
      sendTelegram(MSG_ERRORS.MSG_FORMAT_ERROR_BASE + COMMANDS[commandName].format_indication);
    } else {
      const result = this.saveIfMissing(name, sheetName);

      if (result?.exist) {
        sendTelegram(MSG_ERRORS.ITEM_EXISTENTE)
      } else {
        sendTelegram(`${resultMsg} "${name}".`);
      }
    }
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
