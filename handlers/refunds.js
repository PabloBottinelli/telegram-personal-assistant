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

    if (isReintegroPend) {
      const med = String(medio || "").trim();
      lines.push(
        `${med || "Medio"} te debe ${_fmtMoney_(moneda, ahorro)} por compra del ${fechaStr}\n` +
        `Descripcion: ${det}`
      );
    }

    if (isDevolPend) {
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
    sendTelegram(lines.join("\n\n"));
  }
}

function iniciarMarcarReintegrado_(chatId) {
  const sh = getSheet_(SHEET_MOVIMIENTOS);
  const values = getTableValues_(sh, TABLA_GASTOS);

  if (!hasData_(values)) { sendTelegram("No hay reintegros pendientes 🎉"); return; }

  const pendientes = []; 
  for (let i = 0; i < values.length; i++) {
    const [fecha, categoria, medio, monto, moneda, ahorro, detalle, reintegrado, devuelto] = values[i];
    if (!(fecha instanceof Date)) continue;

    if (reintegrado !== true) {
      pendientes.push({
        row: START_ROW + i,
        kind: 'reintegro',
        moneda, monto, ahorro, detalle, fecha,
        medio: String(medio || "").trim()
      });
    }

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

  const elegido = lista[idx - 1]; 
  const sh = getSheet_(SHEET_MOVIMIENTOS);

  const colTarget = (elegido.kind === 'devolucion') ? TABLA_GASTOS.startCol + (TABLA_GASTOS.devueltoColOffset  - 1) : TABLA_GASTOS.startCol + (TABLA_GASTOS.checkboxColOffset - 1);

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
