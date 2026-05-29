function isPendingRefund_(row, cols) {
  const idxTipo = getRequiredHeaderIndex_(cols, "Tipo", SHEET_GASTOS.name);
  const idxAhorro = getRequiredHeaderIndex_(cols, "Ahorro", SHEET_GASTOS.name);
  const idxReintegrado = getRequiredHeaderIndex_(cols, "Reintegrado?", SHEET_GASTOS.name);

  const tipo = String(row[idxTipo] || "").trim().toUpperCase();
  const ahorro = nOrZero_(row[idxAhorro]);
  const reintegrado = row[idxReintegrado];

  return tipo === "R" && ahorro > 0 && reintegrado !== true;
}

function isPendingExternalDebt_(row, cols) {
  const idxCategoria = getRequiredHeaderIndex_(cols, "Categoría", SHEET_GASTOS.name) 
  const idxDevuelto = getRequiredHeaderIndex_(cols, "Devuelto?", SHEET_GASTOS.name) 

  const categoria = String(row[idxCategoria] || "").trim().toLowerCase();
  const devuelto = row[idxDevuelto];

  return categoria === "ajeno" && devuelto !== true;
}

function sendRefunds() {
  const sh = getSheet_(SHEET_GASTOS.name);
  const values = getTableValues_(sh, sh.getLastColumn());
  const cols = getHeaderMapFromSheet_(sh);

  if (!hasData_(values)) { sendTelegram("No hay reintegros ni devoluciones pendientes 🎉"); return; }

  const idxFecha = getRequiredHeaderIndex_(cols, "Fecha", SHEET_GASTOS.name);
  const idxMedio = getRequiredHeaderIndex_(cols, "Medio de pago", SHEET_GASTOS.name);
  const idxMonto = getRequiredHeaderIndex_(cols, "Monto", SHEET_GASTOS.name);
  const idxMoneda = getRequiredHeaderIndex_(cols, "Moneda", SHEET_GASTOS.name);
  const idxAhorro = getRequiredHeaderIndex_(cols, "Ahorro", SHEET_GASTOS.name);
  const idxDetalle = getRequiredHeaderIndex_(cols, "Detalle", SHEET_GASTOS.name);

  const lines = [];

  for (let i = 0; i < values.length; i++) {
    const row = values[i];

    const fecha = row[idxFecha];
    const medio = row[idxMedio];
    const monto = row[idxMonto];
    const moneda = row[idxMoneda];
    const ahorro = row[idxAhorro];
    const detalle = row[idxDetalle];

    if (!(fecha instanceof Date)) continue;

    const fechaStr = dateToStringDM_(fecha);
    const det = String(detalle || "-");

    if (isPendingRefund_(row, cols)) {
      const med = String(medio || "").trim();
      lines.push(
        `${med || "Medio"} te debe ${fmtMoney_(moneda, ahorro)} por compra del ${fechaStr}\n` +
        `Descripcion: ${det}`
      );
    }

    if (isPendingExternalDebt_(row, cols)) {
      const total = nOrZero_(monto) - nOrZero_(ahorro);
      lines.push(
        `No te devolvieron la compra del ${fechaStr}\n` +
        `Descripcion: ${det}\n` +
        `Monto: ${fmtMoney_(moneda, monto)}  Ahorro: ${fmtMoney_(moneda, ahorro)}  Total: ${fmtMoney_(moneda, total)}`
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

  const idxFecha = getRequiredHeaderIndex_(cols, "Fecha", SHEET_GASTOS.name);
  const idxMedio = getRequiredHeaderIndex_(cols, "Medio de pago", SHEET_GASTOS.name);
  const idxMonto = getRequiredHeaderIndex_(cols, "Monto", SHEET_GASTOS.name);
  const idxMoneda = getRequiredHeaderIndex_(cols, "Moneda", SHEET_GASTOS.name);
  const idxAhorro = getRequiredHeaderIndex_(cols, "Ahorro", SHEET_GASTOS.name);
  const idxDetalle = getRequiredHeaderIndex_(cols, "Detalle", SHEET_GASTOS.name);

  const pendientes = []; 
  for (let i = 0; i < values.length; i++) {
    const row = values[i];

    const fecha = row[idxFecha];
    const medio = row[idxMedio];
    const monto = row[idxMonto];
    const moneda = row[idxMoneda];
    const ahorro = row[idxAhorro];
    const detalle = row[idxDetalle];

    if (!(fecha instanceof Date)) continue;

    if (isPendingRefund_(row, cols)) {
      pendientes.push({
        row: START_ROW + i,
        kind: 'reintegro',
        moneda, monto, ahorro, detalle, fecha,
        medio: String(medio || "").trim()
      });
    }

    if (isPendingExternalDebt_(row, cols)) {
      pendientes.push({
        row: START_ROW + i,
        kind: 'devolucion',
        moneda, monto, ahorro, detalle, fecha,
        medio: String(medio || "").trim()
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
  
  sh.getRange(elegido.row, targetIdx + 1).setValue(true);

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
