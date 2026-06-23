const USE_TEST_SHEETS = false;

function getSheetName_(sheetName) {
  return USE_TEST_SHEETS ? "Copia de " + sheetName : sheetName;
}

function getSheet_(sheetName) {
  const ss = SpreadsheetApp.getActive();
  const resolvedSheetName = getSheetName_(sheetName);

  let sh = ss.getSheetByName(resolvedSheetName);

  if (!sh) {
    throw new Error(`La hoja "${resolvedSheetName}" no existe.`);
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

function hasData_(values){
  if (!values || values.length === 0) return false;
  return values.flat().some(v => String(v).trim() !== '');
}

function findNextRowInTable_(sheet){
  const values = sheet.getRange(START_COL_LETTER + "1:" + START_COL_LETTER).getValues();
  const filled = values.filter(r => String(r[0]).trim() !== '');
  return filled.length + 1; 
}

function sortTableByDate_(sheet, sheetNumCols) {
  const headerRow = 1;
  const lastRow = sheet.getLastRow();

  if (lastRow <= headerRow) return;

  const numRows = lastRow - headerRow;
  const numCols = Math.max(sheetNumCols || 0, sheet.getLastColumn());

  sheet
    .getRange(headerRow + 1, START_COL, numRows, numCols)
    .sort({ column: START_COL, ascending: false });
}

function getColumnAsList_(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const values = sheet.getRange(2, START_COL, lastRow - 1, 1).getValues();
  return values.map(r => String(r[0] || '').trim()).filter(v => v !== '');
}

function deleteRow_(sheetName, rowNumber) {
  const sh = getSheet_(sheetName);
  sh.deleteRow(rowNumber);
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