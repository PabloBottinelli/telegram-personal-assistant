function procesarIngreso(chatId, lineas) {
    const [_, fechaTexto, montoTexto, monedaRaw, descripcion] = lineas;

    const errores = [];

    const fechaNorm = processDateInput_(fechaTexto, errores);

    const monto = processAmountInput_(montoTexto, errores)

    const moneda = processCoinInput_(monedaRaw, errores);

    if (errores.length > 0) { sendTelegram(MSG.ERRORES_PREFIX + errores.join("\n")); return; }

    const userState = {
        tipo: "INGRESO",
        datos: { fecha: fechaNorm, moneda, monto, descripcion },
        esperandoCategoria: true,
        timestamp: Date.now()
    };
    
    saveState_(chatId, userState);
    itemListMsg(TABLA_CATEGORIAS);
}

function appendIngresoRow_(income) {
  const sh = getSheet_(SHEET_MOVIMIENTOS);
  const date = ymdStringToLocalNoonDate_(income.datos.fecha);

  const rowIndex = findNextRowInTable_(sh, TABLA_INGRESOS);
  const row = [ date, income.datos.monto, income.datos.moneda, income.categoria, income.datos.descripcion ?? '' ];
  const range = sh.getRange(rowIndex, TABLA_INGRESOS.startCol, 1, TABLA_INGRESOS.headers.length);
  range.setValues([row]);

  sortTableByDate_(sh, TABLA_INGRESOS);
}