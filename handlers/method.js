function methodList() {
  const metodos = obtenerMetodos();
  let msg = MSG.METODO_TARJETA_LISTA_HEADER;
  metodos.forEach((m, i) => msg += `${i + 1}. ${m}\n`);
  msg += MSG.METODO_TARJETA_LISTA_FOOTER;
  sendTelegram(msg);
}

function handleMethodResponse(chatId, message, userState) {
  const metodos = obtenerMetodos();

  if (message.toUpperCase().startsWith("NUEVA ")) {
    const nuevoMetodo = message.substring(6).trim();
    if (!nuevoMetodo) { sendTelegram("Tenés que poner un nombre después de NUEVA 🙄"); methodList(); return; }
    guardarMetodo(nuevoMetodo);
    userState.metodo = nuevoMetodo;
  } else {
    const numero = parseInt(message.trim(), 10);
    if (!isNaN(numero) && numero >= 1 && numero <= metodos.length) {
      userState.metodo = metodos[numero - 1];
    } else {
      sendTelegram("❌ Número de método inválido. Probá otra vez 🙃");
      methodList(); return;
    }
  }

  userState.esperandoMetodo = false;

  if (userState.esperandoCategoria || !userState.categoria) {
    saveState_(chatId, userState);
    sendTelegram(`✅ Método seleccionado: "${userState.metodo}". Ahora elegí la categoría.`);
    pedirCategoria(chatId);
    return;
  }

  guardarRegistroCompleto(chatId, userState);
  sendTelegram(`✅ Registro completado con método "${userState.metodo}" y categoría "${userState.categoria}".`);
  clearState_(chatId);
}



function handleMethodForDateResponse_(chatId, message, userState) {
  const metodos = obtenerMetodos();

  if (_norm_(message).startsWith("NUEVA ")) {
    const nombre = message.substring(6).trim();
    if (!nombre) { sendTelegram("Tenés que poner un nombre después de NUEVA 🙄"); methodList(); return; }
    guardarMetodo(nombre);
    userState.metodoFecha = nombre;
  } else {
    const numero = parseInt(message.trim(), 10);
    if (!isNaN(numero) && numero >= 1 && numero <= metodos.length) {
      userState.metodoFecha = metodos[numero - 1];
    } else if (metodos.includes(message.trim())) {
      userState.metodoFecha = message.trim();
    } else {
      sendTelegram("❌ Número de método inválido. Probá otra vez 🙃");
      methodList(); return;
    }
  }

  try {
    setFechaTarjeta_(userState.metodoFecha, userState.campoFecha, userState.valorFecha);
  } catch (e) {
    sendTelegram("❌ No pude actualizar la fecha: " + e.message);
    clearState_(chatId); return;
  }

  sendTelegram(`✅ Guardado: ${userState.campoFecha.replace('_',' ')} = ${userState.valorFecha} para "${userState.metodoFecha}".`);
  clearState_(chatId);
}
