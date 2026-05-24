function processTC(chatId, lineas) {
    let fechaTexto, montoTexto, monedaRaw, ahorroTexto, cuotasTexto, detalle, tipo, reintegrado;

    if (lineas.length == 3) {
      [, montoTexto, detalle] = lineas;

      fechaTexto   = "-";
      monedaRaw    = "ARS";
      ahorroTexto  = "0";
      cuotasTexto = "1";
      tipo         = "-";
      reintegrado  = "-";
    } else {
      [, fechaTexto, montoTexto, monedaRaw, ahorroTexto, cuotasTexto, detalle, tipo, reintegrado] = lineas;
    }

    const errores = [];

    const fechaNorm = processDateInput(fechaTexto, errores);

    const monto = processAmountInput(montoTexto, errores);

    const moneda = processCoinInput(monedaRaw, errores);

    let ahorroValor = processSavingInput(monto, ahorroTexto, errores);

    const reintegradoVal = processRefundInput(reintegrado, errores);

    const numCuotas = processQuotaInput(cuotasTexto, errores)

    const tipoVal = processTypeInput(tipo, errores);

    const detalleNorm = processDetailInput(detalle, errores)

    if (errores.length > 0) { sendTelegram(MSG_ERRORS.ERRORES_PREFIX + errores.join("\n")); return; }

    const userState = {
        tipo: "TC",
        datos: { fecha: fechaNorm, monto, moneda, ahorro: ahorroValor, cuotas: numCuotas, detalle: detalleNorm, tipo: tipoVal, reintegrado: reintegradoVal },
        esperandoCategoria: true,
        esperandoMetodo: true,
        timestamp: Date.now()
    };

    saveState_(chatId, userState);
    itemListCategoriesMsg();
}

function appendCuotaRow(credit) {
  const sh = getSheet_(SHEET_CUOTAS.name);
  var montoResumen = credit.datos.monto
  if(credit.datos.tipo === "D" && credit.datos.reintegrado){
    montoResumen = credit.datos.monto - credit.datos.ahorro
  }

  sh.appendRow([ 
    credit.datos.fecha, 
    credit.datos.metodo || "-", 
    credit.datos.moneda, 
    montoResumen,
    credit.datos.cuotas, 
    credit.datos.cuotas, 
    credit.datos.detalle ,
    generateId_("DT")
  ]);

  sortTableByDate_(sh, SHEET_CUOTAS.headers.length);
}
