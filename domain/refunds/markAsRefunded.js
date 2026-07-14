function isPendingRefund_(gasto) {
  const tipo = String(gasto.tipo || "").trim().toUpperCase();
  const ahorro = nOrZero_(gasto.ahorro);

  return tipo === "R" && ahorro > 0 && gasto.reintegrado !== true;
}

function sendRefunds() {
  const gastos = ExpenseRepository.list();

  if (gastos.length === 0) {
    sendTelegram("No hay reintegros pendientes 🎉");
    return;
  }
  
  const lines = [];
  
  for (const gasto of gastos) {
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
  }
  
  if (lines.length === 0) {
    sendTelegram("No hay reintegros pendientes 🎉");
  } else {
    sendTelegram(lines.join("\n\n"));
  }
}

function initMarkAsRefunded(chatId) {
  const sh = getSheet_(SHEET_GASTOS.name);
  const values = getTableValues_(sh, sh.getLastColumn());
  const cols = getHeaderMapFromSheet_(sh);

  if (!hasData_(values)) { sendTelegram("No hay reintegros pendientes 🎉"); return; }

  const pendientes = []; 
  for (let i = 0; i < values.length; i++) {
    const gasto = expenseFromRow_(values[i], cols);

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
  }

  if (pendientes.length === 0) { sendTelegram("No hay reintegros pendientes 🎉"); return; }

  const lines = pendientes.map((p, idx) => {
    const fechaStr = dateToStringDM_(p.fecha);
    const det = p.detalle || "-";
    
    return (
      `${idx + 1}. ${p.medio || "Medio"} te debe ${fmtMoney_(p.moneda, p.ahorro)} por compra del ${fechaStr}\n` +
      `   Descripcion: ${det}`
    );
  });

  const st = {
    flow: "MARK_REFUND",
    step: "WAITING_INDEX",
    data: {
      reintegrosPendientes: pendientes
    },
    timestamp: Date.now()
  };

  saveState_(chatId, st);

  sendTelegram(lines.join("\n\n") + "\n\nRespondé el NÚMERO a marcar como resuelto, o escribí CANCELAR.");
}

function handleMarkAsRefundedResponse_(chatId, message, userState) {
  const idx = parseInt(message, 10);
  const lista = userState.reintegrosPendientes || [];

  if (!Number.isInteger(idx) || idx < 1 || idx > lista.length) {
    sendTelegram("❌ Número inválido. Probá otra vez o escribí CANCELAR.");
    return;
  }

  const elegido = lista[idx - 1]; 
  const sh = getSheet_(SHEET_GASTOS.name);
  const cols = getHeaderMapFromSheet_(sh);

  const targetIdx = getRequiredHeaderIndex_(cols, "Reintegrado?", SHEET_GASTOS.name);
  
  sh.getRange(elegido.row, START_COL + targetIdx).setValue(true);

  const fechaStr = dateToStringDM_(elegido.fecha);
  const det = elegido.detalle || "-";

  const resumen = `${(elegido.medio || "Medio")} te debía ${fmtMoney_(elegido.moneda, elegido.ahorro)} por ${det} del ${fechaStr}`;
  
  sendTelegram(`✅ Marcado como reintegrado:\n${resumen}`);
  statesReset();
}
