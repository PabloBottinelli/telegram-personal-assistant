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
    extraColumns: ["Gasto ID"],
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
    migrateIdsForSheet_(testSheetName, config);
  });

  migrateGastoIdsInTestCreditDebts_();
}

function migrateIdsForSheet_(sheetName, config) {
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

  const idColumn = ensureColumn_(sheet, "ID");

  if (config.extraColumns && config.extraColumns.length > 0) {
    config.extraColumns.forEach(columnName => {
      ensureColumn_(sheet, columnName);
    });
  }

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
      idsValues[i][0] = generateId_(config.prefix);
      generated++;
    }
  }

  idsRange.setValues(idsValues);

  Logger.log(`Hoja "${sheetName}": ${generated} IDs generados.`);
}

function migrateGastoIdsInTestCreditDebts_() {
  const ss = SpreadsheetApp.getActive();

  const gastosSheet = ss.getSheetByName(TEST_SHEET_PREFIX + "Gastos");
  const deudasSheet = ss.getSheetByName(TEST_SHEET_PREFIX + "Deudas Tarjeta");

  if (!gastosSheet) {
    Logger.log(`No existe la hoja "${TEST_SHEET_PREFIX}Gastos". No se migran Gasto ID.`);
    return;
  }

  if (!deudasSheet) {
    Logger.log(`No existe la hoja "${TEST_SHEET_PREFIX}Deudas Tarjeta". No se migran Gasto ID.`);
    return;
  }

  const gastosLastRow = gastosSheet.getLastRow();
  const deudasLastRow = deudasSheet.getLastRow();

  if (gastosLastRow < 2 || deudasLastRow < 2) {
    Logger.log("No hay datos suficientes para migrar Gasto ID.");
    return;
  }

  const gastosCols = getHeaderMap_(gastosSheet);
  const deudasCols = getHeaderMap_(deudasSheet);

  const gastoIdCol = getRequiredColumn_(gastosCols, "ID", "Gastos");
  const gastoFechaCol = getRequiredColumn_(gastosCols, "Fecha", "Gastos");
  const gastoMedioCol = getRequiredColumn_(gastosCols, "Medio de pago", "Gastos");
  const gastoDetalleCol = getRequiredColumn_(gastosCols, "Detalle", "Gastos");

  const deudaGastoIdCol = ensureColumn_(deudasSheet, "Gasto ID");
  const deudaFechaCol = getRequiredColumn_(deudasCols, "Fecha", "Deudas Tarjeta");
  const deudaMedioCol = getRequiredColumn_(deudasCols, "Medio de pago", "Deudas Tarjeta");
  const deudaDetalleCol = getRequiredColumn_(deudasCols, "Detalle", "Deudas Tarjeta");

  const gastosValues = gastosSheet
    .getRange(2, 1, gastosLastRow - 1, gastosSheet.getLastColumn())
    .getValues();

  const deudasValues = deudasSheet
    .getRange(2, 1, deudasLastRow - 1, deudasSheet.getLastColumn())
    .getValues();

  const gastosByKey = {};
  let gastosIndexados = 0;
  let gastosSinId = 0;
  let duplicados = 0;

  for (let i = 0; i < gastosValues.length; i++) {
    const row = gastosValues[i];

    const id = String(row[gastoIdCol - 1] || "").trim();

    if (!id) {
      gastosSinId++;
      continue;
    }

    const key = buildGastoDeudaKey_(
      row[gastoFechaCol - 1],
      row[gastoMedioCol - 1],
      row[gastoDetalleCol - 1]
    );

    if (!key) continue;

    if (gastosByKey[key]) {
      duplicados++;
      Logger.log(`Gasto duplicado para clave "${key}". Se conserva el primero: ${gastosByKey[key]}, duplicado: ${id}`);
      continue;
    }

    gastosByKey[key] = id;
    gastosIndexados++;
  }

  let completados = 0;
  let yaTenian = 0;
  let noEncontrados = 0;

  const gastoIdValues = deudasSheet
    .getRange(2, deudaGastoIdCol, deudasLastRow - 1, 1)
    .getValues();

  for (let i = 0; i < deudasValues.length; i++) {
    const currentGastoId = String(gastoIdValues[i][0] || "").trim();

    if (currentGastoId) {
      yaTenian++;
      continue;
    }

    const row = deudasValues[i];

    const key = buildGastoDeudaKey_(
      row[deudaFechaCol - 1],
      row[deudaMedioCol - 1],
      row[deudaDetalleCol - 1]
    );

    const matchedGastoId = gastosByKey[key];

    if (!matchedGastoId) {
      noEncontrados++;
      Logger.log(`No se encontró gasto para deuda fila ${i + 2}. Clave: "${key}"`);
      continue;
    }

    gastoIdValues[i][0] = matchedGastoId;
    completados++;
  }

  deudasSheet
    .getRange(2, deudaGastoIdCol, deudasLastRow - 1, 1)
    .setValues(gastoIdValues);

  Logger.log(`Migración Gasto ID finalizada.`);
  Logger.log(`Gastos indexados: ${gastosIndexados}`);
  Logger.log(`Gastos sin ID: ${gastosSinId}`);
  Logger.log(`Claves duplicadas en gastos: ${duplicados}`);
  Logger.log(`Deudas completadas: ${completados}`);
  Logger.log(`Deudas que ya tenían Gasto ID: ${yaTenian}`);
  Logger.log(`Deudas sin match: ${noEncontrados}`);
}

function ensureColumn_(sheet, columnName) {
  const lastColumn = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];

  const wanted = normalizeHeader_(columnName);

  for (let i = 0; i < headers.length; i++) {
    const current = normalizeHeader_(headers[i]);

    if (current === wanted) {
      return i + 1;
    }
  }

  const newColumn = lastColumn + 1;
  sheet.getRange(1, newColumn).setValue(columnName);

  Logger.log(`Columna "${columnName}" agregada en hoja "${sheet.getName()}".`);

  return newColumn;
}

function getHeaderMap_(sheet) {
  const lastColumn = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];

  const map = {};

  for (let i = 0; i < headers.length; i++) {
    const normalized = normalizeHeader_(headers[i]);

    if (normalized) {
      map[normalized] = i + 1;
    }
  }

  return map;
}

function getRequiredColumn_(headerMap, columnName, sheetName) {
  const normalized = normalizeHeader_(columnName);
  const col = headerMap[normalized];

  if (!col) {
    throw new Error(`No se encontró la columna "${columnName}" en "${sheetName}".`);
  }

  return col;
}

function buildGastoDeudaKey_(fecha, medio, detalle) {
  const fechaKey = normalizeDateKey_(fecha);
  const medioKey = normalizeTextKey_(medio);
  const detalleKey = normalizeTextKey_(detalle);

  if (!fechaKey || !medioKey || !detalleKey) {
    return "";
  }

  return `${fechaKey}|${medioKey}|${detalleKey}`;
}

function normalizeDateKey_(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(
      value,
      Session.getScriptTimeZone(),
      "yyyy-MM-dd"
    );
  }

  const text = String(value || "").trim();

  if (!text) return "";

  return text;
}

function normalizeTextKey_(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function normalizeHeader_(value) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

