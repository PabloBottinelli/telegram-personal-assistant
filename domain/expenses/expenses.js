function processExpense(chatId, lineas) {
    let fechaTexto, montoTexto, monedaRaw, metodo, ahorroTexto, detalle, tipo, reintegrado;

    if (lineas.length == 4) {
      [, montoTexto, metodo, detalle] = lineas;

      fechaTexto   = "-";
      monedaRaw    = "ARS";
      ahorroTexto  = "0";
      tipo         = "-";
      reintegrado  = "-";
    } else {
      [, fechaTexto, montoTexto, monedaRaw, metodo, ahorroTexto, detalle, tipo, reintegrado] = lineas;
    }

    const errores = [];

    const fechaNorm = processDateInput(fechaTexto, errores);

    const monto = processAmountInput(montoTexto, errores)

    const moneda = processCoinInput(monedaRaw, errores);

    const metodoProcesado = processMethodInput(metodo, errores);

    let ahorroValor = processSavingInput(monto, ahorroTexto, errores)

    const detalleNorm = processDetailInput(detalle, errores)

    const tipoVal = processTypeInput(tipo, errores);

    const reintegradoVal = processRefundInput(reintegrado, tipoVal, ahorroValor, errores);

    if (errores.length > 0) { sendTelegram(MSG_ERRORS.ERRORES_PREFIX + errores.join("\n")); return; }

    const userState = {
      tipo: "GASTO",
      datos: { fecha: fechaNorm, monto, moneda, metodo: metodoProcesado, ahorro: ahorroValor, detalle: detalleNorm, tipo: tipoVal, reintegrado: reintegradoVal },
      esperandoCategoria: true,
      timestamp: Date.now()
    };

    saveState_(chatId, userState);
    itemListCategoriesMsg();
}

function appendExpenseRow(expense) {
  const gasto = {
    id: expense.id || generateId_("GAS"),
    fecha: expense.datos.fecha,
    categoria: expense.categoria,
    medio: expense.datos.metodo,
    monto: expense.datos.monto,
    moneda: expense.datos.moneda,
    ahorro: expense.datos.ahorro ?? "",
    detalle: expense.datos.detalle ?? "",
    tipo: expense.datos.tipo,
    reintegrado: expense.datos.reintegrado === true,
  };

  return ExpenseRepository.append(gasto);
}