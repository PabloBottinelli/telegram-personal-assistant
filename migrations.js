const TEST_SHEET_PREFIX = "Copia de ";

const ID_MIGRATIONS = [
  {
    sheetName: "Gastos",
    prefix: "GAS",
  },
  {
    sheetName: "Ingresos",
    prefix: "ING",
  },
  {
    sheetName: "Deudas Tarjeta",
    prefix: "DT",
  },
  {
    sheetName: "Recordatorios",
    prefix: "REC",
  },
  {
    sheetName: "Categorias",
    prefix: "CAT",
  },
  {
    sheetName: "Tarjetas de credito",
    prefix: "TAR",
  },
];

function runTestIdMigration() {
  ID_MIGRATIONS.forEach(config => {
    const testSheetName = TEST_SHEET_PREFIX + config.sheetName;
    migrateIdsForSheet_(testSheetName, config.prefix);
  });
}

function migrateIdsForSheet_(sheetName, prefix) {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    Logger.log(`No existe la hoja "${sheetName}". Se omite.`);
    return;
  }

  const lastColumn = sheet.getLastColumn();
  const lastRow = sheet.getLastRow();

  if (lastRow < 1 || lastColumn < 1) {
    Logger.log(`La hoja "${sheetName}" está vacía. Se omite.`);
    return;
  }

  const idColumn = ensureIdColumn_(sheet);

  if (lastRow < 2) {
    Logger.log(`La hoja "${sheetName}" no tiene datos para migrar.`);
    return;
  }

  const numRows = lastRow - 1;
  const idsRange = sheet.getRange(2, idColumn, numRows, 1);
  const idsValues = idsRange.getValues();

  let generated = 0;

  for (let i = 0; i < idsValues.length; i++) {
    const currentId = String(idsValues[i][0] || "").trim();

    if (!currentId) {
      idsValues[i][0] = generateShortId_(prefix);
      generated++;
    }
  }

  idsRange.setValues(idsValues);

  Logger.log(`Hoja "${sheetName}": ${generated} IDs generados.`);
}

function ensureIdColumn_(sheet) {
  const lastColumn = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];

  for (let i = 0; i < headers.length; i++) {
    const header = String(headers[i] || "").trim().toUpperCase();

    if (header === "ID") {
      return i + 1;
    }
  }

  const newIdColumn = lastColumn + 1;
  sheet.getRange(1, newIdColumn).setValue("ID");

  return newIdColumn;
}

function generateShortId_(prefix) {
    const timestamp = Utilities.formatDate(
        new Date(),
        Session.getScriptTimeZone(),
        "yyyyMMdd-HHmmss"
    );

    const random = Utilities.getUuid().split("-")[0];

    return `${prefix}-${timestamp}-${random}`;
}