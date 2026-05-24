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

    const reintegradoVal = processRefundInput(reintegrado, errores);

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
  const sh = getSheet_(SHEET_GASTOS.name);

  const rowIndex = findNextRowInTable_(sh);

  const cat = String(spent.categoria || "").trim();
  const isAjeno = (cat.toLowerCase() === "ajeno");
  const devuelto = isAjeno ? false : true; 
  const row = [
    spent.datos.fecha,
    spent.categoria,
    spent.datos.metodo,
    spent.datos.monto,
    spent.datos.moneda,
    spent.datos.ahorro ?? '',
    spent.datos.detalle ?? '',
    spent.datos.tipo,
    spent.datos.reintegrado === true,
    devuelto,
    generateId_("GAS")
  ];
  const range = sh.getRange(rowIndex, START_COL, 1, row.length);
  range.setValues([row]);

  sortTableByDate_(sh, SHEET_GASTOS.headers.length);
}