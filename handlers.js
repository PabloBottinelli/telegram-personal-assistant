
function guardarRegistroCompleto(chatId, estado) {
  if (estado.tipo === "GASTO") {
    appendGastoRow_(estado);
  } else if (estado.tipo === "INGRESO") {
    appendIngresoRow_(estado);
  } else if (estado.tipo === "TC") {
    appendGastoRow_(estado);
    appendCuotaRow_(estado);
  }
}

function enviarReintegros_() {
  const sh = getSheet_(SHEET_MOVIMIENTOS);
  const values = getTableValues_(sh, TABLA_GASTOS);

  if (!hasData_(values)) { sendTelegram("No hay reintegros pendientes 🎉"); return; }

  const lines = [];
  for (let i = 0; i < values.length; i++) {
    const [fecha, categoria, medio, monto, moneda, ahorro, detalle, reintegrado, devuelto] = values[i];
    if (!(fecha instanceof Date)) continue;

    const fechaStr = fmtFechaYMD_(fecha);
    const det = String(detalle || "-");
    const isReintegroPend = (reintegrado !== true);
    const isDevolPend = (devuelto !== true);

    // REINTEGROS PENDIENTES
    if (isReintegroPend) {
      // Formato requerido:
      // medio de pago te debe ahorro por compra del fecha
      // Descripcion: descripcion
      const med = String(medio || "").trim();
      lines.push(
        `${med || "Medio"} te debe ${_fmtMoney_(moneda, ahorro)} por compra del ${fechaStr}\n` +
        `Descripcion: ${det}`
      );
    }

    // DEVOLUCIONES PENDIENTES
    if (isDevolPend) {
      // Formato requerido:
      // No te devolvieron la compra del fecha
      // Descripcion: descripcion
      // Monto: monto  Ahorro: ahorro  Total: monto-ahorro
      const total = _nOrZero_(monto) - _nOrZero_(ahorro);
      lines.push(
        `No te devolvieron la compra del ${fechaStr}\n` +
        `Descripcion: ${det}\n` +
        `Monto: ${_fmtMoney_(moneda, monto)}  Ahorro: ${_fmtMoney_(moneda, ahorro)}  Total: ${_fmtMoney_(moneda, total)}`
      );
    }
  }

  if (lines.length === 0) {
    sendTelegram("No hay reintegros pendientes 🎉");
  } else {
    // salto de línea entre cada item
    sendTelegram(lines.join("\n\n"));
  }
}


// Considera TRUE solo si es booleano true
function reintragradoEsTrue_(v) {
  return v === true; // todo lo demás (FALSE, "", null, "-", "no") cuenta como NO marcado
}

function iniciarMarcarReintegrado_(chatId) {
  const sh = getSheet_(SHEET_MOVIMIENTOS);
  const values = getTableValues_(sh, TABLA_GASTOS);

  if (!hasData_(values)) { sendTelegram("No hay reintegros pendientes 🎉"); return; }

  const pendientes = []; // {row, kind:'reintegro'|'devolucion', moneda, monto, ahorro, detalle, fecha, medio}
  for (let i = 0; i < values.length; i++) {
    const [fecha, categoria, medio, monto, moneda, ahorro, detalle, reintegrado, devuelto] = values[i];
    if (!(fecha instanceof Date)) continue;

    // Reintegro pendiente
    if (reintegrado !== true) {
      pendientes.push({
        row: START_ROW + i,
        kind: 'reintegro',
        moneda, monto, ahorro, detalle, fecha,
        medio: String(medio || "").trim()
      });
    }

    // Devolución pendiente
    if (devuelto !== true) {
      pendientes.push({
        row: START_ROW + i,
        kind: 'devolucion',
        moneda, monto, ahorro, detalle, fecha,
        medio: String(medio || "").trim()
      });
    }
  }

  if (pendientes.length === 0) { sendTelegram("No hay reintegros pendientes 🎉"); return; }

  // Armamos el listado numerado con texto según tipo
  const lines = pendientes.map((p, idx) => {
    const fechaStr = fmtFechaYMD_(p.fecha);
    const det = p.detalle || "-";
    if (p.kind === 'reintegro') {
      return `${idx + 1}. ${p.medio || "Medio"} te debe ${_fmtMoney_(p.moneda, p.ahorro)} por compra del ${fechaStr}\n` +
             `   Descripcion: ${det}`;
    } else {
      const total = _nOrZero_(p.monto) - _nOrZero_(p.ahorro);
      return `${idx + 1}. No te devolvieron la compra del ${fechaStr}\n` +
             `   Descripcion: ${det}\n` +
             `   Monto: ${_fmtMoney_(p.moneda, p.monto)}  Ahorro: ${_fmtMoney_(p.moneda, p.ahorro)}  Total: ${_fmtMoney_(p.moneda, total)}`;
    }
  });

  const st = {
    esperandoReintegroIdx: true,
    reintegrosPendientes: pendientes,
    timestamp: Date.now()
  };
  saveState_(chatId, st);

  sendTelegram(lines.join("\n\n") + "\n\nRespondé el NÚMERO a marcar como resuelto, o escribí CANCELAR.");
}

function handleMarcarReintegroResponse_(chatId, message, userState) {
  const txt = String(message || "").trim().toUpperCase();
  if (txt === "CANCELAR") {
    clearState_(chatId);
    sendTelegram("Operación cancelada.");
    return;
  }

  const idx = parseInt(message, 10);
  const lista = userState.reintegrosPendientes || [];
  if (!Number.isInteger(idx) || idx < 1 || idx > lista.length) {
    sendTelegram("❌ Número inválido. Probá otra vez o escribí CANCELAR.");
    return;
  }

  const elegido = lista[idx - 1]; // {row, kind, ...}
  const sh = getSheet_(SHEET_MOVIMIENTOS);

  // Columnas H e I según offsets configurados
  const colReintegro = TABLA_GASTOS.startCol + (TABLA_GASTOS.checkboxColOffset - 1); // H
  const colDevuelto  = TABLA_GASTOS.startCol + (TABLA_GASTOS.devueltoColOffset  - 1); // I
  const colTarget = (elegido.kind === 'devolucion') ? colDevuelto : colReintegro;

  sh.getRange(elegido.row, colTarget).setValue(true);

  const fechaStr = fmtFechaYMD_(elegido.fecha);
  const det = elegido.detalle || "-";
  let resumen;
  if (elegido.kind === 'reintegro') {
    resumen = `${(elegido.medio || "Medio")} te debía ${_fmtMoney_(elegido.moneda, elegido.ahorro)} por ${det} del ${fechaStr}`;
    sendTelegram(`✅ Marcado como reintegrado:\n${resumen}`);
  } else {
    const total = _nOrZero_(elegido.monto) - _nOrZero_(elegido.ahorro);
    resumen = `Compra del ${fechaStr}\nDescripcion: ${det}\nMonto: ${_fmtMoney_(elegido.moneda, elegido.monto)}  Ahorro: ${_fmtMoney_(elegido.moneda, elegido.ahorro)}  Total: ${_fmtMoney_(elegido.moneda, total)}`;
    sendTelegram(`✅ Marcado como devuelto:\n${resumen}`);
  }

  clearState_(chatId);
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
    // Salto de línea entre cada tarjeta (línea en blanco)
    sendTelegram("Fechas de Tarjetas\n\n" + bloques.join("\n\n"));
  }
}

