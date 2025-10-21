function procesarTC(chatId, lineas) {
    const [_, fechaTexto, montoTexto, monedaRaw, ahorroTexto, cuotasTexto, detalle, reintegrado] = lineas;

    const errores = [];

    const fechaNorm = processDateInput_(fechaTexto, errores);

    const monto = processAmountInput_(montoTexto, errores);

    const moneda = processCoinInput_(monedaRaw, errores);

    let ahorroValor = processSavingInput_(monto, ahorroTexto, errores);

    const reintegradoVal = processRefundInput_(reintegrado, errores);

    const numCuotas = processQuotaInput_(cuotasTexto, errores)

    const detalleNorm = processDetailInput_(detalle, errores)

    if (errores.length > 0) { sendTelegram(MSG.ERRORES_PREFIX + errores.join("\n")); return; }

    const userState = {
        tipo: "TC",
        datos: { fecha: fechaNorm, monto, moneda, ahorro: ahorroValor, cuotas: numCuotas, detalleNorm, reintegrado: reintegradoVal },
        esperandoCategoria: true,
        esperandoMetodo: true,
        timestamp: Date.now()
    };

    saveState_(chatId, userState);
    pedirCategoria(chatId);
}

function appendCuotaRow_(credit) {
  const sh = getSheet_(SHEET_CUOTAS);
  const date = ymdStringToLocalNoonDate_(credit.datos.fecha);
  sh.appendRow([ date, credit.metodo || "-", credit.datos.moneda, credit.datos.monto, credit.datos.cuotas, credit.datos.cuotas, credit.datos.detalle ]);

  sortTableByDate_(sh, TABLA_DEUDAS);
}
