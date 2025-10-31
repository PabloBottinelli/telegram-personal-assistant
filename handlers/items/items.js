function itemListMsg(tableName, msgHeader, msgFooter) {
  const items = itemList_(tableName);
  let msg = msgHeader;
  items.forEach((m, i) => msg += `${i + 1}. ${m}\n`);
  msg += msgFooter;
  sendTelegram(msg);
}

function itemList_(tableName) {
  const sh = getSheet_(SHEET_LISTAS);
  return getColumnAsList_(sh, tableName.startCol);
}

function saveItem_(item, tableName) {
  const name = String(item || '').trim();
  if (!name) return;
  const items = itemList_(tableName);
  const alreadyExists = items.some(x => x.toLowerCase() === name.toLowerCase());
  if (alreadyExists) return;
  appendItem_(name, tableName);
}

function appendItem_(name, tableName) {
  const sh = getSheet_(SHEET_LISTAS);
  const rowIndex = findNextRowInTable_(sh, tableName);
  sh.getRange(rowIndex, tableName.startCol, 1, 1).setValues([[name]]);
}

function handleItemResponse(chatId, tableName, message, userState){
  const items = itemList_(tableName);

  if (message.toUpperCase().startsWith("NUEVA ")) {
    const newItemName = message.substring(6).trim();

    if (!newItemName) { 
      sendTelegram(MSG_COMMANDS.FORMATO_INCORRECTO_NUEVA); 
      if(tableName == TABLA_TARJETAS){ itemListCardsMsg(); }else { itemListCategoriesMsg(); }
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
      sendTelegram(MSG_ERRORS.NUMERO_INVALIDO);
      if(tableName == TABLA_TARJETAS){ itemListCardsMsg(); }else { itemListCategoriesMsg(); }
      return;
    }
  }

  if(userState.esperandoMetodoFecha) {
    try {
      updateCardDate_(userState.metodo, userState.campoFecha, userState.fecha);
    } catch (e) {
      sendTelegram("❌ No pude actualizar la fecha: " + e.message);
      clearState_(chatId); 
      return;
    }

    sendTelegram(`✅ Guardado: ${userState.campoFecha.replace('_',' ')} = ${userState.fecha} para "${userState.metodo}".`);
  }else {
    if (tableName == TABLA_TARJETAS) {
      userState.esperandoMetodo = false;

      if (userState.esperandoCategoria || !userState.categoria) {
        saveState_(chatId, userState);
        sendTelegram(`✅ Método seleccionado: "${userState.metodo}". Ahora elegí la categoría.`);
        itemListCategoriesMsg();
        return;
      }

      saveTransaction(userState);
      sendTelegram(`✅ Registro completado con método "${userState.metodo}" y categoría "${userState.categoria}".`);
    }else {
      userState.esperandoCategoria = false;

      if (userState.tipo === "TC" && (userState.esperandoMetodo || !userState.metodo)) {
        saveState_(chatId, userState);
        sendTelegram(`✅ Categoría "${userState.categoria}" guardada. Ahora elegí el método de pago.`);
        itemListCardsMsg();
        return;
      }

      saveTransaction(userState);
      sendTelegram(`✅ Registro completado con categoría "${userState.categoria}".`);
    }
  }
  clearState_(chatId);
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

function createNewCard(lines) {
  const nombre = (lines[1] || "").trim();
  if (!nombre) { 
    sendTelegram(MSG_COMMANDS.TARJETA_NUEVA_FORMATO); 
  }else {
    saveItem_(nombre, TABLA_TARJETAS);
    sendTelegram(`✅ Tarjeta agregada: "${nombre}".`);
  }
}

