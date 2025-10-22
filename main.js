function doPost(e) {
  try {
    const contents = JSON.parse(e.postData.contents);
    const message = contents.message?.text?.trim();
    const chatId = String(contents.message?.chat?.id);
    if (chatId !== TELEGRAM_CHAT_ID) return;

    let userState = loadState_(chatId);

    if (userState && userState.esperandoReintegroIdx) { handleMarcarReintegroResponse_(chatId, message, userState); return; }
    if (userState && userState.esperandoCategoria)   { handleCategoryResponse(chatId, message, userState); return; }
    if (userState && (userState.esperandoMetodo || userState.esperandoMetodoFecha)) { handleMethodResponse_(chatId, message, userState); return; }

    const lineas = message.split("\n").map(s => s.trim());
    const tipo = (lineas[0] || '').toUpperCase();

    if (!COMMANDS.includes(tipo)) {
      sendTelegram(MSG.ELEGIR_COMANDO);
      return;
    }

    routeCommand_(tipo, lineas, chatId);
  } catch (err) {
    sendTelegram(MSG.ERROR_GENERIC + err.message);
  }
}

function routeCommand_(tipo, lineas, chatId) {
  if (tipo === "FECHAS") { enviarFechasTarjetas_(); return; }

  if (tipo === "MARCAR REINTEGRADO") { iniciarMarcarReintegrado_(chatId); return; }
  
  if (tipo === "REINTEGROS") { enviarReintegros_(); return; }

  if (tipo === "TOTALES") { enviarTotales_(chatId); return; }

  if (tipo === "COMANDOS") { sendMenuComandos(); return; }

  if (tipo === "NUEVA TARJETA") {
    const nombre = (lineas[1] || "").trim();
    if (!nombre) { sendTelegram(MSG.TARJETA_NUEVA_FORMATO); return; }
    guardarMetodo(nombre);
    sendTelegram(`✅ Tarjeta agregada: "${nombre}".`);
    return;
  }

  if (CMD_TO_FIELD[tipo]) {
    const fechaBruta = (lineas[1] || "").trim();
    const ymd = parseFechaYyyymmdd_(fechaBruta);
    if (!ymd) { sendTelegram(MSG.FECHA_INVALIDA_STRICT + `\n\nEj:\n${tipo}\n2025-09-27`); return; }
    const valorFecha = ymdStringToLocalNoonDate_(fechaBruta);

    const newState = { esperandoMetodoFecha: true, campoFecha: CMD_TO_FIELD[tipo], valorFecha, timestamp: Date.now() };
    saveState_(chatId, newState);
    methodListMsg();
    return;
  }

  if (tipo === "GASTO")   { if (lineas.length !== 8) { sendTelegram(MSG.FORMATO_GASTO);   return; } procesarGasto(chatId, lineas);   return; }
  if (tipo === "INGRESO") { if (lineas.length !== 5) { sendTelegram(MSG.FORMATO_INGRESO); return; } procesarIngreso(chatId, lineas); return; }
  if (tipo === "TC")      { if (lineas.length !== 8) { sendTelegram(MSG.FORMATO_TC);      return; } procesarTC(chatId, lineas);      return; }
}
