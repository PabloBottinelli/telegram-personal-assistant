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

function enviarFechasTarjetas_() {
  const sh = getSheet_(SHEET_LISTAS);
  const values = getTableValues_(sh, TABLA_TARJETAS);

  if (!hasData_(values)) {
    sendTelegram("Fechas de Tarjetas\n(no hay tarjetas cargadas)");
    return;
  }

  const fmtDate = (v) => v instanceof Date
    ? fmtFechaYMD_(v)
    : "-";

  const bloques = [];
  for (let i = 0; i < values.length; i++) {
    const [nombre, uc, uv, pc, pv] = values[i];
    const nombreStr = String(nombre || "").trim();
    if (!nombreStr) continue;

    const line1 = nombreStr;
    const line2 = `FUC: ${fmtDate(uc)} | FUV: ${fmtDate(uv)} | FPC: ${fmtDate(pc)} | FPV: ${fmtDate(pv)}`;
    bloques.push(line1 + "\n" + line2);
  }

  if (bloques.length === 0) {
    sendTelegram("Fechas de Tarjetas\n(no hay tarjetas cargadas)");
  } else {
    sendTelegram("Fechas de Tarjetas\n\n" + bloques.join("\n\n"));
  }
}




