const ReminderRepository = {
  append(reminder) {
    return appendSheetEntity_(SHEET_RECORDATORIOS.name, ReminderMapper, reminder, false);
  },

  list() {
    const sheet = getSheet_(SHEET_RECORDATORIOS.name);
    const values = getTableValues_(sheet, sheet.getLastColumn());
    const cols = getHeaderMapFromSheet_(sheet);

    return values.map(row => ReminderMapper.fromRow(row, cols));
  },

  updateLastExecution(id, date) {
    return ReminderRepository.updateFieldById_(id, "Ultima Ejecucion", date);
  },

  deactivate(id) {
    return ReminderRepository.updateFieldById_(id, "Activo", false);
  },

  updateFieldById_(id, header, value) {
    return updateSheetFieldById_(SHEET_RECORDATORIOS.name, id, header, value)
  }
};
