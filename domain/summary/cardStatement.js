function buildCardStatement_(cardName, closeDate){
    const sh = getSheet_(SHEET_CUOTAS.name)
    const lastRow = sh.getLastRow()
    const values = sh.getRange(START_ROW, START_COL, lastRow - 1, SHEET_CUOTAS.headers.length).getValues()

    const h = SHEET_CUOTAS.headers
    const idxFecha = h.indexOf('Fecha')
    const idxMedio = h.indexOf('Medio de pago')
    const idxMoneda = h.indexOf('Moneda')
    const idxMonto = h.indexOf('Monto')
    const idxCuotas = h.indexOf('#Cuotas')
    const idxCuotasRestantes = h.indexOf('#CuotasRestantes')
    const idxDetalle = h.indexOf('Detalle')

    const valoresAProcesar = []

    values.forEach((row, i) => {
        if(row[idxMedio] === cardName && row[idxFecha].getTime() <= closeDate.getTime() && Number(row[idxCuotasRestantes]) > 0){
            valoresAProcesar.push(row)
        }
    })

    const shGastos = getSheet_(SHEET_GASTOS.name)
    const lastRowGastos = shGastos.getLastRow()
    const valuesGastos = shGastos.getRange(START_ROW, START_COL, lastRowGastos - 1, SHEET_GASTOS.headers.length).getValues()

    const hG = SHEET_GASTOS.headers;
    const idxFechaGasto = hG.indexOf('Fecha')
    const idxCategoriaGasto = hG.indexOf('Categoría')
    const idxMedioGasto = hG.indexOf('Medio de pago')
    const idxAhorroGasto = hG.indexOf('Ahorro')
    const idxDetalleGasto = hG.indexOf('Detalle')
    const idxTipoGasto = hG.indexOf('Tipo')
    const idxReintegradoGasto = hG.indexOf('Reintegrado?')
    const idxDevueltoGasto = hG.indexOf('Devuelto?')

    const gastosByKey = new Map()
    for (const g of valuesGastos) {
        const key = `${g[idxFechaGasto]}|${String(g[idxMedioGasto]).trim()}|${String(g[idxDetalleGasto]).trim()}`
        gastosByKey.set(key, g)
    }

    const ajenosLines = []
    const propiosLines = []

    let totalARS = 0
    let totalUSD = 0

    let totalAjenoARS = 0
    let totalAjenoUSD = 0

    for (const row of valoresAProcesar) {
        const fechaCuota = row[idxFecha]
        const monedaCuota = String(row[idxMoneda]).trim().toUpperCase()
        const montoCuota = (row[idxCuotas] > 1) ? (Number(row[idxMonto])/Number(row[idxCuotas])) : Number(row[idxMonto])
        const detalleCuota = String(row[idxDetalle]).trim()
        const medioCuota = String(row[idxMedio]).trim()
        

        const key = `${fechaCuota}|${medioCuota}|${detalleCuota}`
        const gastoEq = gastosByKey.get(key)

        const categoria = String(gastoEq[idxCategoriaGasto]).trim()
        const isAjeno = categoria.toLowerCase() === "ajeno"

        const reintegrado = gastoEq ? Boolean(gastoEq[idxReintegradoGasto]) : false

        const tipo = String(gastoEq[idxTipoGasto]).trim().toUpperCase()
        const tieneDescuento = tipo === "D" 

        const descuento = (tieneDescuento && !reintegrado) ? Number(gastoEq[idxAhorroGasto]) : 0

        const descuentoTxt = descuento > 0 ? ` (descuento pendiente: ${fmtMoney_(monedaCuota, descuento)})` : ""

        const nroDeCuota = (Number(row[idxCuotas]) > 1) ? `(${Number(row[idxCuotas])-Number(row[idxCuotasRestantes])+1}/${Number(row[idxCuotas])}) ` : ""

        const ajenoTxt = isAjeno ? (Boolean(gastoEq[idxDevueltoGasto]) ? ` (ya devuelto)` : ` (aun no te devolvio)`) : ""

        const line = `- ${nroDeCuota}${dateToStringDM_(fechaCuota)} · ${fmtMoney_(monedaCuota, montoCuota)} · ${detalleCuota}${descuentoTxt}${ajenoTxt}`

        if (isAjeno) {
            ajenosLines.push(line)
            if(monedaCuota === "USD" || monedaCuota === "USDT") {
                totalAjenoUSD += montoCuota
            }else {
                totalAjenoARS += montoCuota
            }
        }else{
            propiosLines.push(line)

            if (monedaCuota === "USD" || monedaCuota === "USDT") {
                totalUSD += montoCuota
            } else {
                totalARS += montoCuota
            }
        }
    }

    const msg =
        `Resumen ${cardName}\n` +
        `Gastos Ajenos:\n` +
        (ajenosLines.length ? ajenosLines.join("\n") : "- (sin gastos ajenos)\n") +
        `\n\nTotal a pagar en usd de cosas ajenas: ${fmtMoney_('USD', totalAjenoUSD)}\n` +
        `Total a pagar en pesos de cosas ajenas: ${fmtMoney_('ARS', totalAjenoARS)}` +
        `\n\nGastos Propios:\n` +
        (propiosLines.length ? propiosLines.join("\n") : "- (sin gastos propios)\n") +
        `\n\nTotal a pagar en usd: ${fmtMoney_('USD', totalUSD)}\n` +
        `Total a pagar en pesos: ${fmtMoney_('ARS', totalARS)}`;

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
      sendTelegram(`⚠️ ${nombre}: error generando resumen.\n${err.message || err}`);
    }
  }
}

