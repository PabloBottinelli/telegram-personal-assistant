function getSheet_(sheetName) {
  const ss = SpreadsheetApp.getActive();

  let sh = ss.getSheetByName(sheetName);

  if (!sh) {
    throw new Error(`La hoja "${sheetName}" no existe.`);
  }

  return sh;
}

function getTableValues_(sheet, sheetNumCols) {
  const lastRow = sheet.getLastRow();
  if (lastRow < START_ROW) {
    return [];
  }
  const numRows = lastRow - START_ROW + 1;
  const numCols = sheetNumCols;
  return sheet.getRange(START_ROW, START_COL, numRows, numCols).getValues();
}

function hasData_(values) {
  if (!values || values.length === 0) return false;
  return values.flat().some(v => String(v).trim() !== '');
}

function findNextRowInTable_(sheet) {
  return sheet.getLastRow() + 1;
}

function sortTableByDate_(sheet, sheetNumCols) {
  try {
    const lastRow = sheet.getLastRow();
    if (lastRow < START_ROW) return true;

    const cols = getHeaderMapFromSheet_(sheet);
    const dateIdx = getRequiredHeaderIndex_(cols, "Fecha", sheet.getName());

    const numRows = lastRow - START_ROW + 1;
    const numCols = Math.max(sheetNumCols || 0, sheet.getLastColumn());

    sheet.getRange(START_ROW, START_COL, numRows, numCols)
      .sort({ column: dateIdx + 1, ascending: false });

    return true;
  } catch (error) {
    Logger.log(`No se pudo ordenar la hoja "${sheet.getName()}": ${error.message}`);
    return false;
  }
}

function normalizeHeader_(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getHeaderMapFromSheet_(sheet) {
  const lastColumn = sheet.getLastColumn();

  if (lastColumn < 1) {
    return {};
  }

  const headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  const map = {};

  for (let i = 0; i < headers.length; i++) {
    const key = normalizeHeader_(headers[i]);
    if (key) {
      map[key] = i;
    }
  }

  return map;
}

function getRequiredHeaderIndex_(headerMap, columnName, sheetName) {
  const key = normalizeHeader_(columnName);
  const idx = headerMap[key];

  if (idx === undefined) {
    throw new Error(`Falta la columna "${columnName}" en "${sheetName}".`);
  }

  return idx;
}

function listSheetValues_(sheetName, mapper) {
  const sh = getSheet_(sheetName);
  const values = getTableValues_(sh, sh.getLastColumn());
  const cols = getHeaderMapFromSheet_(sh);

  return values
    .filter(row => row.some(v => String(v).trim() !== ""))
    .map(row => mapper.fromRow(row, cols));
}

function appendSheetEntity_(sheetName, mapper, entity, sortByDate) {
  const sh = getSheet_(sheetName);
  const row = mapper.toRow(entity);
  const rowIndex = findNextRowInTable_(sh);

  sh.getRange(rowIndex, START_COL, 1, row.length).setValues([row]);

  if (sortByDate) { sortTableByDate_(sh); }

  return entity.id;
}

function replaceSheetColumnValue_(sheetName, columnName, oldValue, newValue) {
  const sh = getSheet_(sheetName);
  const values = getTableValues_(sh, sh.getLastColumn());
  const cols = getHeaderMapFromSheet_(sh);

  const columnIdx = getRequiredHeaderIndex_(cols, columnName, sheetName);
  const oldValueNorm = String(oldValue || "").trim().toLowerCase();

  if (!oldValueNorm) return 0;
  let updated = 0;

  for (let i = 0; i < values.length; i++) {
    const currentValue = String(values[i][columnIdx] || "").trim().toLowerCase();
    if (currentValue !== oldValueNorm) continue;
    sh.getRange(START_ROW + i, START_COL + columnIdx).setValue(newValue);
    updated++;
  }

  return updated;
}

function updateSheetFieldById_(sheetName, id, header, value) {
  const sheet = getSheet_(sheetName);
  const values = getTableValues_(sheet, sheet.getLastColumn());
  const cols = getHeaderMapFromSheet_(sheet);

  const idIdx = getRequiredHeaderIndex_(cols, "ID", sheetName);
  const targetIdx = getRequiredHeaderIndex_(cols, header, sheetName);
  const normalizedId = String(id || "").trim();

  for (let i = 0; i < values.length; i++) {
    const currentId = String(values[i][idIdx] || "").trim();

    if (currentId !== normalizedId) continue;

    sheet.getRange(START_ROW + i, START_COL + targetIdx).setValue(value);
    return true;
  }

  return false;
}