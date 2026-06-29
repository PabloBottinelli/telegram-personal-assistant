function processSpent(chatId, lineas) {
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

function appendSpentRow(spent) {
  const gasto = {
    id: spent.id || generateId_("GAS"),
    fecha: spent.datos.fecha,
    categoria: spent.categoria,
    medio: spent.datos.metodo,
    monto: spent.datos.monto,
    moneda: spent.datos.moneda,
    ahorro: spent.datos.ahorro ?? "",
    detalle: spent.datos.detalle ?? "",
    tipo: spent.datos.tipo,
    reintegrado: spent.datos.reintegrado === true,
  };

  return ExpenseRepository.append(gasto);
}