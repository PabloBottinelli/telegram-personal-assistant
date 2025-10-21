function procesarGasto(chatId, lineas) {
    const [_, fechaTexto, montoTexto, monedaRaw, metodo, ahorroTexto, detalle, reintegrado] = lineas;

    const errores = [];

    const fechaNorm = processDateInput_(fechaTexto, errores);

    const monto = processAmountInput_(montoTexto, errores)

    const moneda = processCoinInput_(monedaRaw, errores);

    const metodoProcesado = processMethodInput_(metodo, errores);

    let ahorroValor = processSavingInput_(monto, ahorroTexto, errores)

    const reintegradoVal = processRefundInput_(reintegrado, errores);

    if (errores.length > 0) { sendTelegram(MSG.ERRORES_PREFIX + errores.join("\n")); return; }

    const userState = {
        tipo: "GASTO",
        datos: { fecha: fechaNorm, monto, moneda, metodoProcesado, ahorro: ahorroValor, detalle, reintegrado: reintegradoVal },
        esperandoCategoria: true,
        timestamp: Date.now()
    };

    saveState_(chatId, userState);
    pedirCategoria(chatId);
}

function appendGastoRow_(spent) {
  const sh = getSheet_(SHEET_MOVIMIENTOS);
  const date = ymdStringToLocalNoonDate_(spent.datos.fecha);
  
  const rowIndex = findNextRowInTable_(sh, SHEET_MOVIMIENTOS);

  const cat = String(spent.categoria || "").trim();
  const isAjeno = (cat.toLowerCase() === "ajeno");
  const devuelto = isAjeno ? false : true; 
  const row = [
    date,
    spent.categoria,
    spent.datos.metodo,
    spent.datos.monto,
    spent.datos.moneda,
    spent.datos.ahorro ?? '',
    spent.datos.detalle ?? '',
    spent.datos.reintegrado === true,
    devuelto
  ];
  const range = sh.getRange(rowIndex, TABLA_GASTOS.startCol, 1, TABLA_GASTOS.headers.length);
  range.setValues([row]);

  sortTableByDate_(sh, TABLA_GASTOS);
}