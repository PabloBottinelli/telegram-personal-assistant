/******************************************************
 * TESTS MANUALES PARA BOT DE GASTOS
 *
 * Cómo usar:
 * 1. Subí el archivo con clasp push.
 * 2. Abrí Apps Script.
 * 3. Ejecutá runAllManualTests_().
 *
 * Recomendación:
 * - Usar una copia del Sheet real.
 * - Tener al menos una fila de prueba en:
 *   Gastos, Ingresos, Deudas Tarjeta y Tarjetas de crédito.
 ******************************************************/


/******************************************************
 * ASSERTS BÁSICOS
 ******************************************************/

function assertEquals_(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(
      message + "\n" +
      "Esperado: " + expected + "\n" +
      "Recibido: " + actual
    );
  }
}

function assertTrue_(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertDate_(value, message) {
  if (!(value instanceof Date)) {
    throw new Error(message + "\nRecibido: " + value);
  }
}


/******************************************************
 * TESTS DE HEADERS
 ******************************************************/

function testHeadersGastos_() {
  const sh = getSheet_(SHEET_GASTOS.name);
  const cols = getHeaderMapFromSheet_(sh);

  getRequiredHeaderIndex_(cols, "ID", SHEET_GASTOS.name);
  getRequiredHeaderIndex_(cols, "Fecha", SHEET_GASTOS.name);
  getRequiredHeaderIndex_(cols, "Categoría", SHEET_GASTOS.name);
  getRequiredHeaderIndex_(cols, "Medio de pago", SHEET_GASTOS.name);
  getRequiredHeaderIndex_(cols, "Monto", SHEET_GASTOS.name);
  getRequiredHeaderIndex_(cols, "Moneda", SHEET_GASTOS.name);
  getRequiredHeaderIndex_(cols, "Ahorro", SHEET_GASTOS.name);
  getRequiredHeaderIndex_(cols, "Detalle", SHEET_GASTOS.name);
  getRequiredHeaderIndex_(cols, "Tipo", SHEET_GASTOS.name);
  getRequiredHeaderIndex_(cols, "Reintegrado?", SHEET_GASTOS.name);
  getRequiredHeaderIndex_(cols, "Devuelto?", SHEET_GASTOS.name);

  Logger.log("✅ testHeadersGastos_ OK");
}

function testHeadersTarjetas_() {
  const sh = getSheet_(SHEET_TARJETAS.name);
  const cols = getHeaderMapFromSheet_(sh);

  getRequiredHeaderIndex_(cols, "ID", SHEET_TARJETAS.name);
  getRequiredHeaderIndex_(cols, "Tarjeta de crédito", SHEET_TARJETAS.name);
  getRequiredHeaderIndex_(cols, "Último cierre", SHEET_TARJETAS.name);
  getRequiredHeaderIndex_(cols, "Último vencimiento", SHEET_TARJETAS.name);
  getRequiredHeaderIndex_(cols, "Próximo Cierre", SHEET_TARJETAS.name);
  getRequiredHeaderIndex_(cols, "Próximo Vencimiento", SHEET_TARJETAS.name);

  Logger.log("✅ testHeadersTarjetas_ OK");
}

function testHeadersIngresos_() {
  const sh = getSheet_(SHEET_INGRESOS.name);
  const cols = getHeaderMapFromSheet_(sh);

  getRequiredHeaderIndex_(cols, "ID", SHEET_INGRESOS.name);
  getRequiredHeaderIndex_(cols, "Fecha", SHEET_INGRESOS.name);
  getRequiredHeaderIndex_(cols, "Monto", SHEET_INGRESOS.name);
  getRequiredHeaderIndex_(cols, "Moneda", SHEET_INGRESOS.name);
  getRequiredHeaderIndex_(cols, "Categoría", SHEET_INGRESOS.name);
  getRequiredHeaderIndex_(cols, "Descripción", SHEET_INGRESOS.name);

  Logger.log("✅ testHeadersIngresos_ OK");
}

function testHeadersDeudasTarjeta_() {
  const sh = getSheet_(SHEET_CUOTAS.name);
  const cols = getHeaderMapFromSheet_(sh);

  getRequiredHeaderIndex_(cols, "ID", SHEET_CUOTAS.name);
  getRequiredHeaderIndex_(cols, "Gasto ID", SHEET_CUOTAS.name);
  getRequiredHeaderIndex_(cols, "Fecha", SHEET_CUOTAS.name);
  getRequiredHeaderIndex_(cols, "Medio de pago", SHEET_CUOTAS.name);
  getRequiredHeaderIndex_(cols, "Moneda", SHEET_CUOTAS.name);
  getRequiredHeaderIndex_(cols, "Monto", SHEET_CUOTAS.name);
  getRequiredHeaderIndex_(cols, "#Cuotas", SHEET_CUOTAS.name);
  getRequiredHeaderIndex_(cols, "#CuotasRestantes", SHEET_CUOTAS.name);
  getRequiredHeaderIndex_(cols, "Detalle", SHEET_CUOTAS.name);

  Logger.log("✅ testHeadersDeudasTarjeta_ OK");
}

function runHeaderTests_() {
  testHeadersGastos_();
  testHeadersTarjetas_();
  testHeadersIngresos_();
  testHeadersDeudasTarjeta_();

  Logger.log("✅ Todos los tests de headers OK");
}


/******************************************************
 * TESTS DE MAPPERS
 ******************************************************/

function testSpentFromRow_() {
  const sh = getSheet_(SHEET_GASTOS.name);
  const values = getTableValues_(sh, sh.getLastColumn());
  const cols = getHeaderMapFromSheet_(sh);

  assertTrue_(hasData_(values), "La hoja Gastos no tiene datos para testear.");

  const gasto = spentFromRow_(values[0], cols);

  assertTrue_("id" in gasto, "spentFromRow_ no devuelve id.");
  assertTrue_("fecha" in gasto, "spentFromRow_ no devuelve fecha.");
  assertTrue_("categoria" in gasto, "spentFromRow_ no devuelve categoria.");
  assertTrue_("medio" in gasto, "spentFromRow_ no devuelve medio.");
  assertTrue_("monto" in gasto, "spentFromRow_ no devuelve monto.");
  assertTrue_("moneda" in gasto, "spentFromRow_ no devuelve moneda.");
  assertTrue_("ahorro" in gasto, "spentFromRow_ no devuelve ahorro.");
  assertTrue_("detalle" in gasto, "spentFromRow_ no devuelve detalle.");
  assertTrue_("tipo" in gasto, "spentFromRow_ no devuelve tipo.");
  assertTrue_("reintegrado" in gasto, "spentFromRow_ no devuelve reintegrado.");
  assertTrue_("devuelto" in gasto, "spentFromRow_ no devuelve devuelto.");

  Logger.log("✅ testSpentFromRow_ OK");
}

function testIncomeFromRow_() {
  const sh = getSheet_(SHEET_INGRESOS.name);
  const values = getTableValues_(sh, sh.getLastColumn());
  const cols = getHeaderMapFromSheet_(sh);

  assertTrue_(hasData_(values), "La hoja Ingresos no tiene datos para testear.");

  const income = incomeFromRow_(values[0], cols);

  assertTrue_("id" in income, "incomeFromRow_ no devuelve id.");
  assertTrue_("fecha" in income, "incomeFromRow_ no devuelve fecha.");
  assertTrue_("monto" in income, "incomeFromRow_ no devuelve monto.");
  assertTrue_("moneda" in income, "incomeFromRow_ no devuelve moneda.");
  assertTrue_("categoria" in income, "incomeFromRow_ no devuelve categoria.");
  assertTrue_("descripcion" in income, "incomeFromRow_ no devuelve descripcion.");

  Logger.log("✅ testIncomeFromRow_ OK");
}

function testCardFromRow_() {
  const sh = getSheet_(SHEET_TARJETAS.name);
  const values = getTableValues_(sh, sh.getLastColumn());
  const cols = getHeaderMapFromSheet_(sh);

  assertTrue_(hasData_(values), "La hoja Tarjetas no tiene datos para testear.");

  const card = cardFromRow_(values[0], cols);

  assertTrue_("id" in card, "cardFromRow_ no devuelve id.");
  assertTrue_("nombre" in card, "cardFromRow_ no devuelve nombre.");
  assertTrue_("ultimoCierre" in card, "cardFromRow_ no devuelve ultimoCierre.");
  assertTrue_("ultimoVencimiento" in card, "cardFromRow_ no devuelve ultimoVencimiento.");
  assertTrue_("proximoCierre" in card, "cardFromRow_ no devuelve proximoCierre.");
  assertTrue_("proximoVencimiento" in card, "cardFromRow_ no devuelve proximoVencimiento.");

  Logger.log("✅ testCardFromRow_ OK");
}

function testCardDebtFromRow_() {
  const sh = getSheet_(SHEET_CUOTAS.name);
  const values = getTableValues_(sh, sh.getLastColumn());
  const cols = getHeaderMapFromSheet_(sh);

  assertTrue_(hasData_(values), "La hoja Deudas Tarjeta no tiene datos para testear.");

  const debt = cardDebtFromRow_(values[0], cols);

  assertTrue_("id" in debt, "cardDebtFromRow_ no devuelve id.");
  assertTrue_("gastoId" in debt, "cardDebtFromRow_ no devuelve gastoId.");
  assertTrue_("fecha" in debt, "cardDebtFromRow_ no devuelve fecha.");
  assertTrue_("medio" in debt, "cardDebtFromRow_ no devuelve medio.");
  assertTrue_("moneda" in debt, "cardDebtFromRow_ no devuelve moneda.");
  assertTrue_("monto" in debt, "cardDebtFromRow_ no devuelve monto.");
  assertTrue_("cuotas" in debt, "cardDebtFromRow_ no devuelve cuotas.");
  assertTrue_("cuotasRestantes" in debt, "cardDebtFromRow_ no devuelve cuotasRestantes.");
  assertTrue_("detalle" in debt, "cardDebtFromRow_ no devuelve detalle.");

  Logger.log("✅ testCardDebtFromRow_ OK");
}

function runMapperTests_() {
  testSpentFromRow_();
  testIncomeFromRow_();
  testCardFromRow_();
  testCardDebtFromRow_();

  Logger.log("✅ Todos los tests de mappers OK");
}


/******************************************************
 * TEST DE REINTEGROS / DEVOLUCIONES
 ******************************************************/

function testPendingRefundLogic_() {
  const sh = getSheet_(SHEET_GASTOS.name);
  const values = getTableValues_(sh, sh.getLastColumn());
  const cols = getHeaderMapFromSheet_(sh);

  assertTrue_(hasData_(values), "La hoja Gastos no tiene datos para testear reintegros.");

  let pendingRefunds = 0;
  let pendingExternalDebts = 0;

  for (const row of values) {
    const gasto = spentFromRow_(row, cols);

    if (isPendingRefund_(gasto)) pendingRefunds++;
    if (isPendingExternalDebt_(gasto)) pendingExternalDebts++;
  }

  Logger.log("Reintegros pendientes detectados: " + pendingRefunds);
  Logger.log("Devoluciones pendientes detectadas: " + pendingExternalDebts);

  Logger.log("✅ testPendingRefundLogic_ OK");
}

function testSendRefunds_() {
  sendRefunds();
  Logger.log("✅ testSendRefunds_ ejecutado. Revisá Telegram.");
}


/******************************************************
 * TEST DE updateCardDate_
 ******************************************************/

function testUpdateCardDate_() {
  const cardName = "TEST VISA";
  const fecha = new Date(2026, 5, 15, 12, 0, 0, 0);

  updateCardDate_(cardName, "PROXIMO CIERRE", fecha);

  const sh = getSheet_(SHEET_TARJETAS.name);
  const row = findItemRow_(cardName, SHEET_TARJETAS.name, sh.getLastColumn());

  assertTrue_(row !== null, "No encontró la tarjeta test: " + cardName);

  const cols = getHeaderMapFromSheet_(sh);
  const idxProximoCierre = getRequiredHeaderIndex_(
    cols,
    "Próximo Cierre",
    SHEET_TARJETAS.name
  );

  const value = sh.getRange(row, START_COL + idxProximoCierre).getValue();

  assertDate_(value, "El valor guardado no es una fecha.");
  assertEquals_(
    dateToStringDM_(value),
    dateToStringDM_(fecha),
    "La fecha guardada no coincide."
  );

  Logger.log("✅ testUpdateCardDate_ OK");
}


/******************************************************
 * TEST DE RESUMEN DE TARJETA
 ******************************************************/

function testBuildCardStatement_() {
  const closeDate = new Date(2026, 6, 1, 12, 0, 0, 0); // 01/07/2026
  const msg = buildCardStatement_("TEST VISA", closeDate);

  Logger.log(msg);

  assertTrue_(
    msg.indexOf("Resumen TEST VISA") !== -1,
    "No aparece el título del resumen."
  );

  Logger.log("✅ testBuildCardStatement_ OK. Revisá el log para ver el resumen.");
}


/******************************************************
 * TEST DE TOTALES
 ******************************************************/

function testTotals_() {
  const gastos = getSheet_(SHEET_GASTOS.name);
  const ingresos = getSheet_(SHEET_INGRESOS.name);

  const spent = computeSpentTotals_(gastos, 2026, 5); // junio 2026
  const income = computeIncomeTotals_(ingresos, 2026, 5); // junio 2026

  Logger.log("Gastos junio 2026:");
  Logger.log(spent);

  Logger.log("Ingresos junio 2026:");
  Logger.log(income);

  assertTrue_("ars" in spent, "computeSpentTotals_ no devuelve ars.");
  assertTrue_("usd" in spent, "computeSpentTotals_ no devuelve usd.");
  assertTrue_("ars" in income, "computeIncomeTotals_ no devuelve ars.");
  assertTrue_("usd" in income, "computeIncomeTotals_ no devuelve usd.");

  Logger.log("✅ testTotals_ OK");
}


/******************************************************
 * TEST DE updateQuotas_
 *
 * Este test modifica datos.
 * Prepará una fila en Deudas Tarjeta con:
 * ID = DT-TEST-QUOTA
 * Medio de pago = TEST VISA
 * Fecha anterior a 01/07/2026
 * #CuotasRestantes > 0
 ******************************************************/

function testUpdateQuotas_() {
  const sh = getSheet_(SHEET_CUOTAS.name);
  const valuesBefore = getTableValues_(sh, sh.getLastColumn());
  const cols = getHeaderMapFromSheet_(sh);

  const idxId = getRequiredHeaderIndex_(cols, "ID", SHEET_CUOTAS.name);
  const idxCuotasRestantes = getRequiredHeaderIndex_(
    cols,
    "#CuotasRestantes",
    SHEET_CUOTAS.name
  );

  let before = null;

  for (const row of valuesBefore) {
    const id = String(row[idxId] || "").trim();

    if (id === "DT-TEST-QUOTA") {
      before = Number(row[idxCuotasRestantes]);
      break;
    }
  }

  assertTrue_(before !== null, "No encontré DT-TEST-QUOTA antes del test.");

  const closeDate = new Date(2026, 6, 1, 12, 0, 0, 0); // 01/07/2026

  updateQuotas("TEST VISA", closeDate);

  const valuesAfter = getTableValues_(sh, sh.getLastColumn());

  let after = null;

  for (const row of valuesAfter) {
    const id = String(row[idxId] || "").trim();

    if (id === "DT-TEST-QUOTA") {
      after = Number(row[idxCuotasRestantes]);
      break;
    }
  }

  assertEquals_(after, before - 1, "updateQuotas no descontó una cuota.");

  Logger.log("✅ testUpdateQuotas_ OK");
}


/******************************************************
 * TESTS DE FUNCIONES DE TARJETAS
 ******************************************************/

function testSendCardDates_() {
  sendCardDates();
  Logger.log("✅ testSendCardDates_ ejecutado. Revisá Telegram.");
}

function testSendStatements_() {
  sendStatements();
  Logger.log("✅ testSendStatements_ ejecutado. Revisá Telegram.");
}

function testBestCardTrigger_() {
  BestCardTrigger();
  Logger.log("✅ testBestCardTrigger_ ejecutado. Revisá Telegram.");
}

function testExpirationsAlertTrigger_() {
  ExpirationsAlertTrigger();
  Logger.log("✅ testExpirationsAlertTrigger_ ejecutado. Revisá Telegram.");
}


/******************************************************
 * RUNNERS
 ******************************************************/

function runSafeManualTests_() {
  runHeaderTests_();
  runMapperTests_();

  testPendingRefundLogic_();
  testUpdateCardDate_();
  testBuildCardStatement_();
  testTotals_();

  Logger.log("✅ Tests seguros OK");
}

function runTelegramManualTests_() {
  testSendRefunds_();
  testSendCardDates_();
  testSendStatements_();
  testBestCardTrigger_();
  testExpirationsAlertTrigger_();

  Logger.log("✅ Tests con Telegram ejecutados. Revisá los mensajes recibidos.");
}

function runAllManualTests_() {
  runSafeManualTests_();

  Logger.log(
    "✅ runAllManualTests_ OK.\n" +
    "No ejecuté testUpdateQuotas_ porque modifica cuotas.\n" +
    "No ejecuté runTelegramManualTests_ para no mandarte varios mensajes por Telegram.\n" +
    "Ejecutalos aparte si querés."
  );
}