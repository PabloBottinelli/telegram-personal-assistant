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

function saveItem_(name, sheetName) {
  const items = itemList_(sheetName);
  const alreadyExists = items.some(x => x.toLowerCase() === name.toLowerCase());
  if (alreadyExists) return;
  appendItem_(name, sheetName);
}

function appendItem_(name, sheetName) {
  const sh = getSheet_(sheetName);
  const rowIndex = findNextRowInTable_(sh);
  const cols = getHeaderMapFromSheet_(sh);

  let prefix = "ITEM";
  let nameHeader = null;

  if (sheetName === SHEET_CATEGORIAS.name) {
    prefix = "CAT";
    nameHeader = "Categoría";
  }

  if (sheetName === SHEET_TARJETAS.name) {
    prefix = "TAR";
    nameHeader = "Tarjeta de crédito";
  }

  if (sheetName === SHEET_DEUDORES.name) {
    prefix = "DEUDOR";
    nameHeader = "Nombre";
  }

  if (!nameHeader) {
    throw new Error("No sé cómo agregar ítems en la hoja: " + sheetName);
  }

  const idxName = getRequiredHeaderIndex_(cols, nameHeader, sheetName);
  const idxId = getRequiredHeaderIndex_(cols, "ID", sheetName);

  sh.getRange(rowIndex, START_COL + idxName).setValue(name);
  sh.getRange(rowIndex, START_COL + idxId).setValue(generateId_(prefix));
}

function handleItemResponse(chatId, sheetName, message, userState){
  const items = itemList_(sheetName);

  if (message.toUpperCase().startsWith("NUEVA ")) {
    const newItemName = message.substring(6).trim();

    if (!newItemName) { 
      sendTelegram(MSG_ERRORS.FORMATO_INCORRECTO_NUEVA); 
      if(sheetName == SHEET_TARJETAS.name){ CreditCardCommand.sendSelectionList(); }else { CategoryCommand.sendSelectionList(); }
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
      if(sheetName == SHEET_TARJETAS.name){ CreditCardCommand.sendSelectionList(); }else { CategoryCommand.sendSelectionList(); }
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
        CategoryCommand.sendSelectionList();
        return;
      }

      const isAjenoCategory = String(userState.categoria || "").trim().toLowerCase() === "ajeno";

      if ((userState.tipo === "GASTO" || userState.tipo === "TC") && isAjenoCategory && !userState.deudor) {
        userState.esperandoDeudor = true;

        saveState_(chatId, userState);

        sendTelegram(
          `✅ Método seleccionado: "${userState.datos.metodo}". ` +
          `Ahora elegí quién te debe este gasto.`
        );

        DebtorCommand.sendSelectionList();
        return;
      }

      sendTelegram(`✅ Registro completado con método "${userState.datos.metodo}" y categoría "${userState.categoria}".`);
    }else {
      userState.esperandoCategoria = false;

      if (userState.tipo === "TC" && (userState.esperandoMetodo || !userState.datos.metodo)) {
        saveState_(chatId, userState);
        sendTelegram(`✅ Categoría "${userState.categoria}" guardada. Ahora elegí el método de pago.`);
        CreditCardCommand.sendSelectionList();
        return;
      }
      
      const isAjenoCategory = String(userState.categoria || "").trim().toLowerCase() === "ajeno";

      if ((userState.tipo === "GASTO" || userState.tipo === "TC") && isAjenoCategory) {
        userState.esperandoDeudor = true;

        saveState_(chatId, userState);

        sendTelegram(`✅ Categoría "${userState.categoria}" guardada. Ahora elegí quién te debe este gasto.`);
        DebtorCommand.sendSelectionList();
        return;
      }

      sendTelegram(`✅ Registro completado con categoría "${userState.categoria}".`);
    }
  }
  statesReset();
}

function findItemRow_(item, sheetName, sheetNumCols) {
  const sh = getSheet_(sheetName);
  const values = getTableValues_(sh, sheetNumCols);

  if (!hasData_(values)) return null;

  const itemNorm = String(item || "").trim().toLowerCase();

  for (let i = 0; i < values.length; i++) {
    const valueNorm = String(values[i][0] || "").trim().toLowerCase();

    if (valueNorm === itemNorm) return START_ROW + i
  }
  return null;
}


