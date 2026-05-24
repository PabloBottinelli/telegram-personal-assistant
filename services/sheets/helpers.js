const USE_TEST_SHEETS = true;

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
  const numRows = lastRow - 1;
  const numCols = sheetNumCols;
  const values = sheet.getRange(START_ROW, START_COL, numRows, numCols).getValues();
  return values;
}

function hasData_(values){
  if(values.flat().some(v => String(v).trim() !== '')) return true;
  return false;
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

