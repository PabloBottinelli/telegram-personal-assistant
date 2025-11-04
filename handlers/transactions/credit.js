function processTC(chatId, lineas) {
    const [_, fechaTexto, montoTexto, monedaRaw, ahorroTexto, cuotasTexto, detalle, reintegrado] = lineas;

    const errores = [];

    const fechaNorm = processDateInput(fechaTexto, errores);

    const monto = processAmountInput(montoTexto, errores);

    const moneda = processCoinInput(monedaRaw, errores);

    let ahorroValor = processSavingInput(monto, ahorroTexto, errores);

    const reintegradoVal = processRefundInput(reintegrado, errores);

    const numCuotas = processQuotaInput(cuotasTexto, errores)

    const detalleNorm = processDetailInput(detalle, errores)

    if (errores.length > 0) { sendTelegram(MSG_ERRORS.ERRORES_PREFIX + errores.join("\n")); return; }

    const userState = {
        tipo: "TC",
        datos: { fecha: fechaNorm, monto, moneda, ahorro: ahorroValor, cuotas: numCuotas, detalleNorm, reintegrado: reintegradoVal },
        esperandoCategoria: true,
        esperandoMetodo: true,
        timestamp: Date.now()
    };

    saveState_(chatId, userState);
    itemListCategoriesMsg();
}

function appendCuotaRow(credit) {
  const sh = getSheet_(SHEET_CUOTAS);
  sh.appendRow([ 
    credit.datos.fecha, 
    credit.metodo || "-", 
    credit.datos.moneda, 
    credit.datos.monto, 
    credit.datos.cuotas, 
    credit.datos.cuotas, 
    credit.datos.detalle 
  ]);

  sortTableByDate_(sh, TABLA_DEUDAS);
}
