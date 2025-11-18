function itemListMsg(sheetName, msgHeader, msgFooter) {
  const items = itemList_(sheetName);
  let msg = msgHeader;
  items.forEach((m, i) => msg += `${i + 1}. ${m}\n`);
  msg += msgFooter;
  sendTelegram(msg);
}

function listItems(sheetName, headerMsg){
  const items = itemList_(sheetName);
  let msg = headerMsg;
  items.forEach((m) => msg += `${m}\n`);
  sendTelegram(msg);
}

function itemList_(sheetName) {
  const sh = getSheet_(sheetName);
  return getColumnAsList_(sh);
}

function saveItem_(item, sheetName) {
  const name = String(item || '').trim();
  if (!name) return;
  const items = itemList_(sheetName);
  const alreadyExists = items.some(x => x.toLowerCase() === name.toLowerCase());
  if (alreadyExists) return;
  appendItem_(name, sheetName);
}

function appendItem_(name, sheetName) {
  const sh = getSheet_(sheetName);
  const rowIndex = findNextRowInTable_(sh);
  sh.getRange(rowIndex, START_COL, 1, 1).setValues([[name]]);
}

function handleItemResponse(chatId, sheetName, message, userState){
  const items = itemList_(sheetName);

  if (message.toUpperCase().startsWith("NUEVA ")) {
    const newItemName = message.substring(6).trim();

    if (!newItemName) { 
      sendTelegram(MSG_ERRORS.FORMATO_INCORRECTO_NUEVA); 
      if(sheetName == SHEET_TARJETAS.name){ itemListCardsMsg(); }else { itemListCategoriesMsg(); }
      return; 
    }

    saveItem_(newItemName, sheetName);
    if(sheetName == SHEET_TARJETAS.name){
      userState.datos.metodo = newItemName;
    }else {
      userState.categoria = newItemName;
    }
  }else {
    const itemNumber = parseInt(message.trim(), 10);
    if (!isNaN(itemNumber) && itemNumber >= 1 && itemNumber <= items.length) {
      if(sheetName == SHEET_TARJETAS.name){
        userState.datos.metodo = items[itemNumber - 1];
      }else {
        userState.categoria = items[itemNumber - 1];
      }
    } else {
      sendTelegram(MSG_ERRORS.NUMERO_INVALIDO);
      if(sheetName == SHEET_TARJETAS.name){ itemListCardsMsg(); }else { itemListCategoriesMsg(); }
      return;
    }
  }

  if(userState.esperandoMetodoFecha) {
    try {
      updateCardDate_(userState.datos.metodo, userState.campoFecha, userState.fecha);
    } catch (e) {
      sendTelegram("❌ No pude actualizar la fecha: " + e.message);
      statesReset();
      return;
    }

    sendTelegram(`✅ Guardado: ${userState.campoFecha} = ${dateToStringDM_(userState.fecha)} para "${userState.datos.metodo}".`);
  }else {
    if (sheetName == SHEET_TARJETAS.name) {
      userState.esperandoMetodo = false;

      if (userState.esperandoCategoria || !userState.categoria) {
        saveState_(chatId, userState);
        sendTelegram(`✅ Método seleccionado: "${userState.datos.metodo}". Ahora elegí la categoría.`);
        itemListCategoriesMsg();
        return;
      }

      saveTransaction(userState);
      sendTelegram(`✅ Registro completado con método "${userState.datos.metodo}" y categoría "${userState.categoria}".`);
    }else {
      userState.esperandoCategoria = false;

      if (userState.tipo === "TC" && (userState.esperandoMetodo || !userState.datos.metodo)) {
        saveState_(chatId, userState);
        sendTelegram(`✅ Categoría "${userState.categoria}" guardada. Ahora elegí el método de pago.`);
        itemListCardsMsg();
        return;
      }

      saveTransaction(userState);
      sendTelegram(`✅ Registro completado con categoría "${userState.categoria}".`);
    }
  }
  statesReset();
}

function findItemRow_(item, sheetName, sheetNumCols) {
  const sh = getSheet_(sheetName);
  const values = getTableValues_(sh, sheetNumCols);

  if (!hasData_(values)) return null;

  for (let i = 0; i < values.length; i++) {
    if (values[i][0] === item) return 2 + i;
  }
  return null;
}

function createNewCard(lines) {
  const nombre = (lines[1] || "").trim();
  if (!nombre) { 
    sendTelegram(MSG_FORMAT_ERROR_BASE + FORMATS["NUEVA TARJETA"]); 
  }else {
    saveItem_(nombre, SHEET_TARJETAS.name);
    sendTelegram(`✅ Tarjeta agregada: "${nombre}".`);
  }
}

