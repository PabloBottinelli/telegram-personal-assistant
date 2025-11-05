function processIncome(chatId, lineas) {
    const [_, fechaTexto, montoTexto, monedaRaw, descripcion] = lineas;

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
  const sh = getSheet_(SHEET_MOVIMIENTOS);

  const rowIndex = findNextRowInTable_(sh, TABLA_INGRESOS);
  const row = [ 
    income.datos.fecha, 
    income.datos.monto, 
    income.datos.moneda, 
    income.categoria, 
    income.datos.detalle ?? '' 
  ];
  const range = sh.getRange(rowIndex, TABLA_INGRESOS.startCol, 1, TABLA_INGRESOS.headers.length);
  range.setValues([row]);

  sortTableByDate_(sh, TABLA_INGRESOS);
}