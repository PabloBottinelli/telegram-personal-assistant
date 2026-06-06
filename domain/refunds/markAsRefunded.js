function isPendingRefund_(gasto) {
  const tipo = String(gasto.tipo || "").trim().toUpperCase();
  const ahorro = nOrZero_(gasto.ahorro);

  return tipo === "R" && ahorro > 0 && gasto.reintegrado !== true;
}

function isPendingExternalDebt_(gasto) {
  const categoria = String(gasto.categoria || "").trim().toLowerCase();

  return categoria === "ajeno" && gasto.devuelto !== true;
}

function sendRefunds() {
  const sh = getSheet_(SHEET_GASTOS.name);
  const values = getTableValues_(sh, sh.getLastColumn());
  const cols = getHeaderMapFromSheet_(sh);

  if (!hasData_(values)) { sendTelegram("No hay reintegros ni devoluciones pendientes 🎉"); return; }
  
  const lines = [];
  
  for (let i = 0; i < values.length; i++) {
    const gasto = spentFromRow_(values[i], cols);

    if (!(gasto.fecha instanceof Date)) continue;

    const fechaStr = dateToStringDM_(gasto.fecha);
    const det = String(gasto.detalle || "-");

    if (isPendingRefund_(gasto)) {
      const med = String(gasto.medio || "").trim();
      lines.push(
        `${med || "Medio"} te debe ${fmtMoney_(gasto.moneda, gasto.ahorro)} por compra del ${fechaStr}\n` +
        `Descripcion: ${det}`
      );
    }

    if (isPendingExternalDebt_(gasto)) {
      const total = nOrZero_(gasto.monto) - nOrZero_(gasto.ahorro);
      lines.push(
        `No te devolvieron la compra del ${fechaStr}\n` +
        `Descripcion: ${det}\n` +
        `Monto: ${fmtMoney_(gasto.moneda, gasto.monto)}  Ahorro: ${fmtMoney_(gasto.moneda, gasto.ahorro)}  Total: ${fmtMoney_(gasto.moneda, total)}`
      );
    }
  }

  if (lines.length === 0) {
    sendTelegram("No hay reintegros ni devoluciones pendientes 🎉");
  } else {
    sendTelegram(lines.join("\n\n"));
  }
}

function initMarkAsRefunded(chatId) {
  const sh = getSheet_(SHEET_GASTOS.name);
  const values = getTableValues_(sh, sh.getLastColumn());
  const cols = getHeaderMapFromSheet_(sh);

  if (!hasData_(values)) { sendTelegram("No hay reintegros ni devoluciones pendientes 🎉"); return; }

  const pendientes = []; 
  for (let i = 0; i < values.length; i++) {
    const gasto = spentFromRow_(values[i], cols);

    if (!(gasto.fecha instanceof Date)) continue;

    if (isPendingRefund_(gasto)) {
      pendientes.push({
        row: START_ROW + i,
        kind: 'reintegro',
        moneda: gasto.moneda, 
        monto: gasto.monto, 
        ahorro: gasto.ahorro, 
        detalle: gasto.detalle, 
        fecha: gasto.fecha,
        medio: String(gasto.medio || "").trim()
      });
    }

    if (isPendingExternalDebt_(gasto)) {
      pendientes.push({
        row: START_ROW + i,
        kind: 'devolucion',
        moneda: gasto.moneda, 
        monto: gasto.monto, 
        ahorro: gasto.ahorro, 
        detalle: gasto.detalle, 
        fecha: gasto.fecha,
        medio: String(gasto.medio || "").trim()
      });
    }
  }

  if (pendientes.length === 0) { sendTelegram("No hay reintegros ni devoluciones pendientes 🎉"); return; }

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
  const cols = getHeaderMapFromSheet_(sh);

  const targetHeader = elegido.kind === "devolucion" ? "Devuelto?" : "Reintegrado?";
  const targetIdx = getRequiredHeaderIndex_(cols, targetHeader, SHEET_GASTOS.name);
  
  sh.getRange(elegido.row, START_COL + targetIdx).setValue(true);

  const fechaStr = dateToStringDM_(elegido.fecha);
  const det = elegido.detalle || "-";

  if (elegido.kind === 'reintegro') {
    const resumen = `${(elegido.medio || "Medio")} te debía ${fmtMoney_(elegido.moneda, elegido.ahorro)} por ${det} del ${fechaStr}`;
    sendTelegram(`✅ Marcado como reintegrado:\n${resumen}`);
  } else {
    const total = nOrZero_(elegido.monto) - nOrZero_(elegido.ahorro);
    const resumen = `Compra del ${fechaStr}\nDescripcion: ${det}\nMonto: ${fmtMoney_(elegido.moneda, elegido.monto)}  Ahorro: ${fmtMoney_(elegido.moneda, elegido.ahorro)}  Total: ${fmtMoney_(elegido.moneda, total)}`;
    sendTelegram(`✅ Marcado como devuelto:\n${resumen}`);
  }

  statesReset();
}
