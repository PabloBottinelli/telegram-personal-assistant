function pedirCategoria(chatId) {
  const categorias = obtenerCategorias();
  let mensaje = MSG.CATEGORIA_LISTA_HEADER;
  categorias.forEach((cat, i) => mensaje += `${i + 1}. ${cat}\n`);
  mensaje += MSG.CATEGORIA_LISTA_FOOTER;
  sendTelegram(mensaje);
}

function handleCategoryResponse(chatId, message, userState) {
  const categorias = obtenerCategorias();

  if (message.toUpperCase().startsWith("NUEVA ")) {
    const nuevaCategoria = message.substring(6).trim();
    if (!nuevaCategoria) { sendTelegram("Tenés que poner un nombre después de NUEVA 🙄"); pedirCategoria(chatId); return; }
    guardarCategoria(nuevaCategoria);
    userState.categoria = nuevaCategoria;
  } else {
    const numero = parseInt(message.trim(), 10);
    if (!isNaN(numero) && numero >= 1 && numero <= categorias.length) {
      userState.categoria = categorias[numero - 1];
    } else if (categorias.includes(message.trim())) {
      userState.categoria = message.trim();
    } else {
      sendTelegram("❌ Categoría no válida. Elegí un número de la lista o creá una NUEVA.");
      pedirCategoria(chatId); return;
    }
  }

  userState.esperandoCategoria = false;

  if (userState.tipo === "TC" && (userState.esperandoMetodo || !userState.metodo)) {
    saveState_(chatId, userState);
    sendTelegram(`✅ Categoría "${userState.categoria}" guardada. Ahora elegí el método de pago.`);
    methodListMsg();
    return;
  }

  guardarRegistroCompleto(chatId, userState);
  sendTelegram(`✅ Registro completado con categoría "${userState.categoria}".`);
  clearState_(chatId);
}