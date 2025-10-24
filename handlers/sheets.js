function getSheet_(sheetName) {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(sheetName);
  if (!sh) sh = ss.insertSheet(sheetName);
  return sh;
}

function getTableValues_(sheet, tableName) {
  const lastRow = sheet.getLastRow();
  const numRows = lastRow - 1;
  const numCols = tableName.headers.length;
  const values = sheet.getRange(START_ROW, tableName.startCol, numRows, numCols).getValues();
  return values;
}

function hasData_(values){
  if(values.flat().some(v => String(v).trim() !== '')) return true;
  return false;
}

function findNextRowInTable_(sheet, tableName){
  const values = sheet.getRange(tableName.startColLetter + "1:" + tableName.startColLetter).getValues();
  const filled = values.filter(r => String(r[0]).trim() !== '');
  return filled.length + 1;
}

function sortTableByDate_(sheet, tableName) {
  const headerRow = 1;
  const lastRow = sheet.getLastRow();
  if (lastRow <= headerRow) return;
  const numRows = lastRow - 1;
  sheet
    .getRange(headerRow + 1, tableName.startCol, numRows, tableName.headers.length)
    .sort({ column: tableName.startCol, ascending: false });
}

function getColumnAsList_(sheet, startCol) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const values = sheet.getRange(2, startCol, lastRow - 1, 1).getValues();
  return values.map(r => String(r[0] || '').trim()).filter(v => v !== '');
}






