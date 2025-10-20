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
