var ReminderRepository = {
  append(reminder) {
    const sheet = getSheet_(SHEET_RECORDATORIOS.name);
    const row = ReminderMapper.toRow(reminder);

    sheet.getRange(sheet.getLastRow() + 1, 1, 1, row.length).setValues([row]);

    return reminder.id;
  },

  list() {
    const sheet = getSheet_(SHEET_RECORDATORIOS.name);
    const values = getTableValues_(sheet, sheet.getLastColumn());
    const cols = getHeaderMapFromSheet_(sheet);

    return values.map((row, index) => ReminderMapper.fromRow(row, cols, START_ROW + index));
  },

  updateLastExecution(id, date) {
    return ReminderRepository.updateFieldById_(id, "Ultima Ejecucion", date);
  },

  deactivate(id) {
    return ReminderRepository.updateFieldById_(id, "Activo", false);
  },

  updateFieldById_(id, header, value) {
    const sheet = getSheet_(SHEET_RECORDATORIOS.name);
    const values = getTableValues_(sheet, sheet.getLastColumn());
    const cols = getHeaderMapFromSheet_(sheet);

    const idIdx = getRequiredHeaderIndex_(cols, "ID", SHEET_RECORDATORIOS.name);
    const targetIdx = getRequiredHeaderIndex_(cols, header, SHEET_RECORDATORIOS.name);
    const normalizedId = String(id || "").trim();

    for (let i = 0; i < values.length; i++) {
      const currentId = String(values[i][idIdx] || "").trim();

      if (currentId !== normalizedId) continue;

      sheet.getRange(START_ROW + i, START_COL + targetIdx).setValue(value);
      return true;
    }

    return false;
  }
};