function itemListMsg(tableName) {
  const items = itemList(tableName);
  let msg = (tableName == TABLA_TARJETAS) ? MSG.METODO_TARJETA_LISTA_HEADER : MSG.CATEGORIA_LISTA_HEADER;
  items.forEach((m, i) => msg += `${i + 1}. ${m}\n`);
  msg += (tableName == TABLA_TARJETAS) ? MSG.METODO_TARJETA_LISTA_FOOTER : MSG.CATEGORIA_LISTA_FOOTER;
  sendTelegram(msg);
}

function itemList(tableName) {
  const sh = getSheet_(SHEET_LISTAS);
  return getColumnAsList_(sh, tableName.startCol);
}

function saveItem_(item, tableName) {
  const name = String(item || '').trim();
  if (!name) return;
  const items = itemList(tableName);
  const alreadyExists = items.some(x => x.toLowerCase() === name.toLowerCase());
  if (alreadyExists) return;
  appendItem_(name, tableName);
}

function appendItem_(name, tableName) {
  const sh = getSheet_(SHEET_LISTAS);
  const rowIndex = findNextRowInTable_(sh, SHEET_LISTAS);
  sh.getRange(rowIndex, tableName.startCol, 1, 1).setValues([[name]]);
}

function handleItemResponse_(chatId, tableName, message, userState){
  const items = itemList(tableName);

  if (message.toUpperCase().startsWith("NUEVA ")) {
    const newItemName = message.substring(6).trim();

    if (!newItemName) { 
      sendTelegram(MSG.FORMATO_INCORRECTO_NUEVA); 
      itemListMsg(tableName); 
      return; 
    }

    saveItem_(newItemName, tableName);
    if(tableName == TABLA_TARJETAS){
      userState.metodo = newItemName;
    }else {
      userState.categoria = newItemName;
    }
  }else {
    const itemNumber = parseInt(message.trim(), 10);
    if (!isNaN(itemNumber) && itemNumber >= 1 && itemNumber <= items.length) {
      if(tableName == TABLA_TARJETAS){
        userState.metodo = items[itemNumber - 1];
      }else {
        userState.categoria = items[itemNumber - 1];
      }
    } else {
      sendTelegram(MSG.NUMERO_INVALIDO);
      itemListMsg(tableName); 
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
    if (tableName == TABLA_TARJETAS) {
      userState.esperandoMetodo = false;

      if (userState.esperandoCategoria || !userState.categoria) {
        saveState_(chatId, userState);
        sendTelegram(`✅ Método seleccionado: "${userState.metodo}". Ahora elegí la categoría.`);
        itemListMsg(TABLA_CATEGORIAS);
        return;
      }

      guardarRegistroCompleto(chatId, userState);
      sendTelegram(`✅ Registro completado con método "${userState.metodo}" y categoría "${userState.categoria}".`);
    }else {
      userState.esperandoCategoria = false;

      if (userState.tipo === "TC" && (userState.esperandoMetodo || !userState.metodo)) {
        saveState_(chatId, userState);
        sendTelegram(`✅ Categoría "${userState.categoria}" guardada. Ahora elegí el método de pago.`);
        itemListMsg(TABLA_TARJETAS);
        return;
      }

      guardarRegistroCompleto(chatId, userState);
      sendTelegram(`✅ Registro completado con categoría "${userState.categoria}".`);
    }
    clearState_(chatId);
  }
}

function findItemRow_(item, tableName) {
  const sh = getSheet_(SHEET_LISTAS);
  const values = getTableValues_(sh, tableName);

  if (!hasData_(values)) return null;

  for (let i = 0; i < values.length; i++) {
    if (values[i][0] === item) return 2 + i;
  }
  return null;
}

function createNewCard_(lines) {
  const nombre = (lines[1] || "").trim();
  if (!nombre) { 
    sendTelegram(MSG.TARJETA_NUEVA_FORMATO); 
  }else {
    saveItem_(nombre, TABLA_TARJETAS);
    sendTelegram(`✅ Tarjeta agregada: "${nombre}".`);
  }
}