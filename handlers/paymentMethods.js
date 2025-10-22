function methodListMsg() {
  const methods = methodList();
  let msg = MSG.METODO_TARJETA_LISTA_HEADER;
  methods.forEach((m, i) => msg += `${i + 1}. ${m}\n`);
  msg += MSG.METODO_TARJETA_LISTA_FOOTER;
  sendTelegram(msg);
}

function handleMethodResponse_(chatId, message, userState) {
  const methods = methodList();

  if (message.toUpperCase().startsWith("NUEVA ")) {
    const newMethod = message.substring(6).trim();

    if (!newMethod) { 
      sendTelegram(MSG.FORMATO_INCORRECTO_METODO); 
      methodListMsg(); 
      return; 
    }
    
    guardarMetodo(newMethod);
    userState.metodo = newMethod;
  } else {
    const methodNumber = parseInt(message.trim(), 10);
    if (!isNaN(methodNumber) && methodNumber >= 1 && methodNumber <= methods.length) {
      userState.metodo = methods[methodNumber - 1];
    } else {
      sendTelegram(MSG.NUMERO_INVALIDO_METODO);
      methodListMsg(); 
      return;
    }
  }

  if(userState.esperandoMetodoFecha) {
    try {
      setFechaTarjeta_(userState.metodo, userState.campoFecha, userState.valorFecha);
    } catch (e) {
      sendTelegram("❌ No pude actualizar la fecha: " + e.message);
      clearState_(chatId); 
      return;
    }

    sendTelegram(`✅ Guardado: ${userState.campoFecha.replace('_',' ')} = ${userState.valorFecha} para "${userState.metodo}".`);
  }else {
    userState.esperandoMetodo = false;

    if (userState.esperandoCategoria || !userState.categoria) {
      saveState_(chatId, userState);
      sendTelegram(`✅ Método seleccionado: "${userState.metodo}". Ahora elegí la categoría.`);
      pedirCategoria(chatId);
      return;
    }

    guardarRegistroCompleto(chatId, userState);
    sendTelegram(`✅ Registro completado con método "${userState.metodo}" y categoría "${userState.categoria}".`);
  }
  clearState_(chatId);
}

