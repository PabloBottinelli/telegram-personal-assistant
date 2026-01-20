function processIncome(chatId, lineas) {
    let fechaTexto, montoTexto, monedaRaw, descripcion;

    if (lineas.length == 3) {
      [, montoTexto, descripcion] = lineas;

      fechaTexto   = "-";
      monedaRaw    = "ARS";
    } else {
      [, fechaTexto, montoTexto, monedaRaw, descripcion] = lineas;
    }
    
    const errores = [];

    const fechaNorm = processDateInput(fechaTexto, errores);

    const monto = processAmountInput(montoTexto, errores)

    const moneda = processCoinInput(monedaRaw, errores);

    const detalleNorm = processDetailInput(descripcion, errores)

    if (errores.length > 0) { sendTelegram(MSG_ERRORS.ERRORES_PREFIX + errores.join("\n")); return; }

    const userState = {
        tipo: "INGRESO",
        datos: { fecha: fechaNorm, moneda, monto, detalle: detalleNorm },
        esperandoCategoria: true,
        timestamp: Date.now()
    };
    
    saveState_(chatId, userState);
    itemListCategoriesMsg();
}

function appendIncomeRow(income) {
  const sh = getSheet_(SHEET_INGRESOS.name);

  const rowIndex = findNextRowInTable_(sh);
  const row = [ 
    income.datos.fecha, 
    income.datos.monto, 
    income.datos.moneda, 
    income.categoria, 
    income.datos.detalle ?? '' 
  ];
  const range = sh.getRange(rowIndex, START_COL, 1, SHEET_INGRESOS.headers.length);
  range.setValues([row]);

  sortTableByDate_(sh, SHEET_INGRESOS.headers.length);
}