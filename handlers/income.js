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
    pedirCategoria(chatId);
}