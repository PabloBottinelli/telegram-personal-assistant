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

    const numCuotas = processQuotaInput(cuotasTexto, errores)
    
    const tipoVal = processTypeInput(tipo, errores);
    
    const reintegradoVal = processRefundInput(reintegrado, tipoVal, ahorroValor, errores);

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
    CategoryCommand.sendSelectionList();
}

function appendCuotaRow(credit, gastoId) {
  const cuotas = Number(credit.datos.cuotas) || 1;
  let montoTotal = nOrZero_(credit.datos.monto);
  
  if(credit.datos.tipo == 'D'){
    montoTotal = montoTotal - credit.datos.ahorro;
  }

  const debt = {
    id: generateId_("DT"),
    gastoId: gastoId,
    fecha: credit.datos.fecha,
    medio: credit.datos.metodo || "-",
    moneda: credit.datos.moneda,
    monto: montoTotal,
    cuotas: cuotas,
    cuotasRestantes: cuotas,
    detalle: credit.datos.detalle
  };

  return CardDebtRepository.append(debt);
}
