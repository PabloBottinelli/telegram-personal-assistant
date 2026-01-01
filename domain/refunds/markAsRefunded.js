function sendRefunds() {
  const sh = getSheet_(SHEET_GASTOS.name);
  const values = getTableValues_(sh, SHEET_GASTOS.headers.length);

  if (!hasData_(values)) { sendTelegram("No hay reintegros pendientes 🎉"); return; }

  const lines = [];
  for (let i = 0; i < values.length; i++) {
    const [fecha, categoria, medio, monto, moneda, ahorro, detalle, reintegrado, devuelto] = values[i];
    if (!(fecha instanceof Date)) continue;

    const fechaStr = dateToStringDM_(fecha);
    const det = String(detalle || "-");
    const isReintegroPend = (reintegrado !== true);
    const isDevolPend = (devuelto !== true);

    if (isReintegroPend) {
      const med = String(medio || "").trim();
      lines.push(
        `${med || "Medio"} te debe ${fmtMoney_(moneda, ahorro)} por compra del ${fechaStr}\n` +
        `Descripcion: ${det}`
      );
    }

    if (isDevolPend) {
      const total = nOrZero_(monto) - nOrZero_(ahorro);
      lines.push(
        `No te devolvieron la compra del ${fechaStr}\n` +
        `Descripcion: ${det}\n` +
        `Monto: ${fmtMoney_(moneda, monto)}  Ahorro: ${fmtMoney_(moneda, ahorro)}  Total: ${fmtMoney_(moneda, total)}`
      );
    }
  }

  if (lines.length === 0) {
    sendTelegram("No hay reintegros pendientes 🎉");
  } else {
    sendTelegram(lines.join("\n\n"));
  }
}

function initMarkAsRefunded(chatId) {
  const sh = getSheet_(SHEET_GASTOS.name);
  const values = getTableValues_(sh, SHEET_GASTOS.headers.length);

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
    const fechaStr = dateToStringDM_(p.fecha);
    const det = p.detalle || "-";
    if (p.kind === 'reintegro') {
      return `${idx + 1}. ${p.medio || "Medio"} te debe ${fmtMoney_(p.moneda, p.ahorro)} por compra del ${fechaStr}\n` +
             `   Descripcion: ${det}`;
    } else {
      const total = nOrZero_(p.monto) - nOrZero_(p.ahorro);
      return `${idx + 1}. No te devolvieron la compra del ${fechaStr}\n` +
             `   Descripcion: ${det}\n` +
             `   Monto: ${fmtMoney_(p.moneda, p.monto)}  Ahorro: ${fmtMoney_(p.moneda, p.ahorro)}  Total: ${fmtMoney_(p.moneda, total)}`;
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

function handleMarkAsRefundedResponse_(chatId, message, userState) {
  if (handleCancel_(message)) return;

  const idx = parseInt(message, 10);
  const lista = userState.reintegrosPendientes || [];
  if (!Number.isInteger(idx) || idx < 1 || idx > lista.length) {
    sendTelegram("❌ Número inválido. Probá otra vez o escribí CANCELAR.");
    return;
  }

  const elegido = lista[idx - 1]; 
  const sh = getSheet_(SHEET_GASTOS.name);

  const colTarget = (elegido.kind === 'devolucion') ? START_COL + (SHEET_GASTOS.devueltoColOffset  - 1) : START_COL + (SHEET_GASTOS.checkboxColOffset - 1);

  sh.getRange(elegido.row, colTarget).setValue(true);

  const fechaStr = dateToStringDM_(elegido.fecha);
  const det = elegido.detalle || "-";
  let resumen;
  if (elegido.kind === 'reintegro') {
    resumen = `${(elegido.medio || "Medio")} te debía ${fmtMoney_(elegido.moneda, elegido.ahorro)} por ${det} del ${fechaStr}`;
    sendTelegram(`✅ Marcado como reintegrado:\n${resumen}`);
  } else {
    const total = nOrZero_(elegido.monto) - nOrZero_(elegido.ahorro);
    resumen = `Compra del ${fechaStr}\nDescripcion: ${det}\nMonto: ${fmtMoney_(elegido.moneda, elegido.monto)}  Ahorro: ${fmtMoney_(elegido.moneda, elegido.ahorro)}  Total: ${fmtMoney_(elegido.moneda, total)}`;
    sendTelegram(`✅ Marcado como devuelto:\n${resumen}`);
  }

  statesReset();
}
