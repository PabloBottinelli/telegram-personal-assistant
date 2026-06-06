function buildCardStatement_(cardName, closeDate) {
  const sh = getSheet_(SHEET_CUOTAS.name);
  const lastRow = sh.getLastRow();

  if (lastRow < START_ROW) {
    return `Resumen ${cardName}\n\nNo hay deudas de tarjeta cargadas.`;
  }

  const values = getTableValues_(sh, sh.getLastColumn());
  const cols = getHeaderMapFromSheet_(sh);

  const valoresAProcesar = [];

  for (let i = 0; i < values.length; i++) {
    const debt = cardDebtFromRow_(values[i], cols);

    const fecha = debt.fecha;
    const medio = String(debt.medio || "").trim();
    const cuotasRestantes = Number(debt.cuotasRestantes);

    if (!(fecha instanceof Date)) continue;
    if (medio !== cardName) continue;
    if (fecha >= closeDate) continue;
    if (cuotasRestantes <= 0) continue;

    valoresAProcesar.push(debt);
  }

  const shGastos = getSheet_(SHEET_GASTOS.name);
  const lastRowGastos = shGastos.getLastRow();

  const valuesGastos = lastRowGastos >= START_ROW
    ? getTableValues_(shGastos, shGastos.getLastColumn())
    : [];

  const colsGastos = getHeaderMapFromSheet_(shGastos);
  const gastosById = new Map();

  for (const rowGasto of valuesGastos) {
    const gasto = spentFromRow_(rowGasto, colsGastos);
    const gastoId = String(gasto.id || "").trim();

    if (gastoId) {
      gastosById.set(gastoId, gasto);
    }
  }

  const ajenosLines = [];
  const propiosLines = [];

  let totalARS = 0;
  let totalUSD = 0;

  let totalAjenoARS = 0;
  let totalAjenoUSD = 0;

  for (const debt of valoresAProcesar) {
    const fechaCuota = debt.fecha;
    const monedaCuota = String(debt.moneda || "").trim().toUpperCase();
    const cuotas = Number(debt.cuotas);
    const cuotasRestantes = Number(debt.cuotasRestantes);
    const montoTotal = Number(debt.monto);
    const montoCuota = cuotas > 1 ? montoTotal / cuotas : montoTotal;
    const detalleCuota = String(debt.detalle || "").trim();
    const gastoId = String(debt.gastoId || "").trim();

    if (!gastoId) {
      sendTelegram(
        `⚠️ Hay una deuda de tarjeta sin Gasto ID.\n` +
        `Tarjeta: ${cardName}\n` +
        `Fecha: ${dateToStringDM_(fechaCuota)}\n` +
        `Detalle: ${detalleCuota}`
      );

      continue;
    }

    const gastoEq = gastosById.get(gastoId);

    if (!gastoEq) {
      sendTelegram(
        `⚠️ No encontré el gasto vinculado a una deuda de tarjeta.\n` +
        `Tarjeta: ${cardName}\n` +
        `Gasto ID: ${gastoId}\n` +
        `Detalle deuda: ${detalleCuota}\n` +
        `Sugerencia: revisá que exista ese ID en la hoja Gastos.`
      );

      continue;
    }

    const categoria = String(gastoEq.categoria || "").trim();
    const isAjeno = categoria.toLowerCase() === "ajeno";

    const reintegrado = gastoEq.reintegrado === true;

    const tipo = String(gastoEq.tipo || "").trim().toUpperCase();
    const tieneDescuento = tipo === "D";

    const descuento = tieneDescuento && !reintegrado
      ? Number(gastoEq.ahorro) || 0
      : 0;

    const descuentoTxt = descuento > 0
      ? ` (descuento pendiente: ${fmtMoney_(monedaCuota, descuento)})`
      : "";

    const nroDeCuota = cuotas > 1
      ? `(${cuotas - cuotasRestantes + 1}/${cuotas}) `
      : "";

    const ajenoTxt = isAjeno
      ? gastoEq.devuelto === true
        ? " (ya devuelto)"
        : " (aun no te devolvio)"
      : "";

    const line =
      `- ${nroDeCuota}${dateToStringDM_(fechaCuota)} · ` +
      `${fmtMoney_(monedaCuota, montoCuota)} · ` +
      `${detalleCuota}${descuentoTxt}${ajenoTxt} [${gastoId}]`;

    if (isAjeno) {
      ajenosLines.push(line);

      if (monedaCuota === "USD" || monedaCuota === "USDT") {
        totalAjenoUSD += montoCuota;
      } else {
        totalAjenoARS += montoCuota;
      }
    } else {
      propiosLines.push(line);

      if (monedaCuota === "USD" || monedaCuota === "USDT") {
        totalUSD += montoCuota;
      } else {
        totalARS += montoCuota;
      }
    }
  }
  
  let msg = `Resumen ${cardName}\n\n`;

  msg += `Gastos Ajenos:\n`;
  msg += ajenosLines.length > 0
    ? ajenosLines.join("\n")
    : "- No hay gastos ajenos.\n";

  msg += `\n\n`;
  msg += `Total a pagar en usd de cosas ajenas: ${fmtMoney_("USD", totalAjenoUSD)}\n`;
  msg += `Total a pagar en pesos de cosas ajenas: ${fmtMoney_("ARS", totalAjenoARS)}\n`;

  msg += `\n`;
  msg += `Gastos Propios:\n`;
  msg += propiosLines.length > 0
    ? propiosLines.join("\n")
    : "- No hay gastos propios.\n";

  msg += `\n\n`;
  msg += `Total a pagar en usd de cosas propias: ${fmtMoney_("USD", totalUSD)}\n`;
  msg += `Total a pagar en pesos de cosas propias: ${fmtMoney_("ARS", totalARS)}\n`;

  msg += `\n`;
  msg += `Total general USD: ${fmtMoney_("USD", totalUSD + totalAjenoUSD)}\n`;
  msg += `Total general ARS: ${fmtMoney_("ARS", totalARS + totalAjenoARS)}`;

  return msg;
}

function updateQuotas(cardName, closeDate) {
  const sh = getSheet_(SHEET_CUOTAS.name);
  const lastRow = sh.getLastRow();
  
  if (lastRow < START_ROW) return;

  const values = getTableValues_(sh, sh.getLastColumn());
  const cols = getHeaderMapFromSheet_(sh);

  const idxCuotasRestantes = getRequiredHeaderIndex_(
    cols,
    "#CuotasRestantes",
    SHEET_CUOTAS.name
  );

  let changed = false;

  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    const debt = cardDebtFromRow_(row, cols);

    const fecha = debt.fecha;
    const medio = String(debt.medio || "").trim();
    const cuotasRestantes = Number(debt.cuotasRestantes);

    if (!(fecha instanceof Date)) continue;
    if (medio !== cardName) continue;
    if (fecha >= closeDate) continue;
    if (cuotasRestantes <= 0) continue;

    row[idxCuotasRestantes] = cuotasRestantes - 1;
    changed = true;
  }

  if (!changed) return;

  sh
    .getRange(START_ROW, START_COL, values.length, values[0].length)
    .setValues(values);
}

function selectCloseDateForStatement_(card) {
  const TODAY = todayNoon_();

  const ultimoVencimiento = card.ultimoVencimiento;
  const ultimoCierre = card.ultimoCierre;
  const proximoCierre = card.proximoCierre;

  if (!(ultimoCierre instanceof Date) && !(proximoCierre instanceof Date)) return null;

  if (ultimoVencimiento instanceof Date && ultimoVencimiento < TODAY) {
    return (proximoCierre instanceof Date) ? proximoCierre : null;
  }

  return (ultimoCierre instanceof Date) ? ultimoCierre : null;
}

function sendStatements() {
  const sh = getSheet_(SHEET_TARJETAS.name);
  const values = getTableValues_(sh, sh.getLastColumn());
  const cols = getHeaderMapFromSheet_(sh);

  if (!hasData_(values)) return;

  for (const row of values) {
    const card = cardFromRow_(row, cols);
    
    const nombre = String(card.nombre || "").trim();
    if (!nombre) continue;

    const closeDate = selectCloseDateForStatement_(card);

    if (!(closeDate instanceof Date)) {
      sendTelegram(`⚠️ ${nombre}: no pude determinar fecha de cierre para el resumen.`);
      continue;
    }

    try {
      const resumen = buildCardStatement_(nombre, closeDate);
      sendTelegram(resumen);
    } catch (err) {
      sendTelegram(
        `⚠️ ${nombre}: error generando resumen.\n` +
        (err && err.stack ? err.stack : (err.message || err))
      );
    }
  }
}

