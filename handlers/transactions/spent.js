function processSpent(chatId, lineas) {
    const [_, fechaTexto, montoTexto, monedaRaw, metodo, ahorroTexto, detalle, reintegrado] = lineas;

    const errores = [];

    const fechaNorm = processDateInput(fechaTexto, errores);

    const monto = processAmountInput(montoTexto, errores)

    const moneda = processCoinInput(monedaRaw, errores);

    const metodoProcesado = processMethodInput(metodo, errores);

    let ahorroValor = processSavingInput(monto, ahorroTexto, errores)

    const detalleNorm = processDetailInput(detalle, errores)

    const reintegradoVal = processRefundInput(reintegrado, errores);

    if (errores.length > 0) { sendTelegram(MSG_ERRORS.ERRORES_PREFIX + errores.join("\n")); return; }

    const userState = {
        tipo: "GASTO",
        datos: { fecha: fechaNorm, monto, moneda, metodo: metodoProcesado, ahorro: ahorroValor, detalle: detalleNorm, reintegrado: reintegradoVal },
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
    spent.datos.reintegrado === true,
    devuelto
  ];
  const range = sh.getRange(rowIndex, START_COL, 1, SHEET_GASTOS.headers.length);
  range.setValues([row]);

  sortTableByDate_(sh, SHEET_GASTOS.headers.length);
}