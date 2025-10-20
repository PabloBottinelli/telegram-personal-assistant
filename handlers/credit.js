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