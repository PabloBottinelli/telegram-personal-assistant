function buildCardStatement_(cardName, closeDate) {
  const sh = getSheet_(SHEET_CUOTAS.name);
  const lastRow = sh.getLastRow();

  if (lastRow < START_ROW) {
    return `Resumen ${cardName}\n\nNo hay deudas de tarjeta cargadas.`;
  }

  const values = sh
    .getRange(
      START_ROW,
      START_COL,
      lastRow - (START_ROW - 1),
      SHEET_CUOTAS.headers.length
    )
    .getValues();

  const h = SHEET_CUOTAS.headers;

  const idxFecha = h.indexOf("Fecha");
  const idxMedio = h.indexOf("Medio de pago");
  const idxMoneda = h.indexOf("Moneda");
  const idxMonto = h.indexOf("Monto");
  const idxCuotas = h.indexOf("#Cuotas");
  const idxCuotasRestantes = h.indexOf("#CuotasRestantes");
  const idxDetalle = h.indexOf("Detalle");
  const idxGastoId = h.indexOf("Gasto ID");

  if (idxGastoId === -1) {
    throw new Error('Falta la columna "Gasto ID" en Deudas Tarjeta.');
  }

  const valoresAProcesar = [];

  values.forEach(row => {
    const fecha = row[idxFecha];
    const medio = String(row[idxMedio] || "").trim();
    const cuotasRestantes = Number(row[idxCuotasRestantes]);

    if (!(fecha instanceof Date)) return;
    if (medio !== cardName) return;
    if (fecha.getTime() > closeDate.getTime()) return;
    if (cuotasRestantes <= 0) return;

    valoresAProcesar.push(row);
  });

  const shGastos = getSheet_(SHEET_GASTOS.name);
  const lastRowGastos = shGastos.getLastRow();

  const valuesGastos = lastRowGastos >= START_ROW
    ? shGastos
        .getRange(
          START_ROW,
          START_COL,
          lastRowGastos - (START_ROW - 1),
          SHEET_GASTOS.headers.length
        )
        .getValues()
    : [];

  const hG = SHEET_GASTOS.headers;

  const idxCategoriaGasto = hG.indexOf("Categoría");
  const idxAhorroGasto = hG.indexOf("Ahorro");
  const idxTipoGasto = hG.indexOf("Tipo");
  const idxReintegradoGasto = hG.indexOf("Reintegrado?");
  const idxDevueltoGasto = hG.indexOf("Devuelto?");
  const idxIdGasto = hG.indexOf("ID");

  if (idxIdGasto === -1) {
    throw new Error('Falta la columna "ID" en Gastos.');
  }

  const gastosById = new Map();

  for (const gasto of valuesGastos) {
    const gastoId = String(gasto[idxIdGasto] || "").trim();

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

  let encontradosPorId = 0;
  let sinGastoId = 0;
  let noEncontrados = 0;

  for (const row of valoresAProcesar) {
    const fechaCuota = row[idxFecha];
    const monedaCuota = String(row[idxMoneda] || "").trim().toUpperCase();
    const cuotas = Number(row[idxCuotas]);
    const cuotasRestantes = Number(row[idxCuotasRestantes]);
    const montoTotal = Number(row[idxMonto]);
    const montoCuota = cuotas > 1 ? montoTotal / cuotas : montoTotal;
    const detalleCuota = String(row[idxDetalle] || "").trim();
    const gastoId = String(row[idxGastoId] || "").trim();

    if (!gastoId) {
      sinGastoId++;

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
      noEncontrados++;

      sendTelegram(
        `⚠️ No encontré el gasto vinculado a una deuda de tarjeta.\n` +
        `Tarjeta: ${cardName}\n` +
        `Gasto ID: ${gastoId}\n` +
        `Detalle deuda: ${detalleCuota}\n` +
        `Sugerencia: revisá que exista ese ID en la hoja Gastos.`
      );

      continue;
    }

    encontradosPorId++;

    const categoria = String(gastoEq[idxCategoriaGasto] || "").trim();
    const isAjeno = categoria.toLowerCase() === "ajeno";

    const reintegrado = Boolean(gastoEq[idxReintegradoGasto]);

    const tipo = String(gastoEq[idxTipoGasto] || "").trim().toUpperCase();
    const tieneDescuento = tipo === "D";

    const descuento = tieneDescuento && !reintegrado
      ? Number(gastoEq[idxAhorroGasto]) || 0
      : 0;

    const descuentoTxt = descuento > 0
      ? ` (descuento pendiente: ${fmtMoney_(monedaCuota, descuento)})`
      : "";

    const nroDeCuota = cuotas > 1
      ? `(${cuotas - cuotasRestantes + 1}/${cuotas}) `
      : "";

    const ajenoTxt = isAjeno
      ? Boolean(gastoEq[idxDevueltoGasto])
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

  const debugLine =
    `\n\nVinculación por ID:\n` +
    `Encontradas: ${encontradosPorId}\n` +
    `Sin Gasto ID: ${sinGastoId}\n` +
    `Gasto ID inexistente: ${noEncontrados}`;

  const msg =
    `Resumen ${cardName}\n` +
    `Gastos Ajenos:\n` +
    (ajenosLines.length ? ajenosLines.join("\n") : "- (sin gastos ajenos)") +
    `\n\nTotal a pagar en usd de cosas ajenas: ${fmtMoney_("USD", totalAjenoUSD)}\n` +
    `Total a pagar en pesos de cosas ajenas: ${fmtMoney_("ARS", totalAjenoARS)}` +
    `\n\nGastos Propios:\n` +
    (propiosLines.length ? propiosLines.join("\n") : "- (sin gastos propios)") +
    `\n\nTotal a pagar en usd: ${fmtMoney_("USD", totalUSD)}\n` +
    `Total a pagar en pesos: ${fmtMoney_("ARS", totalARS)}` +
    debugLine;

  return msg;
}

function updateQuotas(cardName, closeDate) {
  const sh = getSheet_(SHEET_CUOTAS.name);
  const lastRow = sh.getLastRow();
  const values = sh.getRange(START_ROW, START_COL, lastRow - (START_ROW - 1), SHEET_CUOTAS.headers.length).getValues();

  const h = SHEET_CUOTAS.headers;
  const idxFecha = h.indexOf('Fecha');
  const idxMedio = h.indexOf('Medio de pago');
  const idxCuotasRestantes = h.indexOf('#CuotasRestantes');

  let changed = false;

  values.forEach(row => {
    const fecha = row[idxFecha];
    const medio = row[idxMedio];
    const cuotasRestantes = Number(row[idxCuotasRestantes]);

    if (!(fecha instanceof Date)) return;
    if (medio !== cardName) return;
    if (fecha > closeDate) return;
    if (cuotasRestantes <= 0) return;

    row[idxCuotasRestantes] = cuotasRestantes - 1;
    changed = true;
  });

  if (!changed) return;

  sh
    .getRange(START_ROW, START_COL, values.length, values[0].length)
    .setValues(values);
}

function selectCloseDateForStatement_(row) {
  const TODAY = todayNoon_();

  const uv = row[TARJETA_FIELD_TO_OFFSET['ULTIMO VENCIMIENTO']];
  const ultimoCierre = row[TARJETA_FIELD_TO_OFFSET['ULTIMO CIERRE']];
  const proximoCierre = row[TARJETA_FIELD_TO_OFFSET['PROXIMO CIERRE']];

  if (!(ultimoCierre instanceof Date) && !(proximoCierre instanceof Date)) return null;

  if (uv instanceof Date && uv < TODAY) {
    return (proximoCierre instanceof Date) ? proximoCierre : null;
  }

  return (ultimoCierre instanceof Date) ? ultimoCierre : null;
}

function sendStatements() {
  const sh = getSheet_(SHEET_TARJETAS.name);
  const values = getTableValues_(sh, SHEET_TARJETAS.headers.length);
  if (!hasData_(values)) return;

  for (const row of values) {
    const nombre = String(row[0]).trim();
    if (!nombre) continue;

    const closeDate = selectCloseDateForStatement_(row);

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

