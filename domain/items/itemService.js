var ItemService = {
  parseSelection(message, sheetName) {
    const items = ItemRepository.list(sheetName);
    const text = String(message || "").trim();

    if (text.toUpperCase().startsWith("NUEVA") || text.toUpperCase().startsWith("NUEVO")) {
      const newItemName = text.substring(6).trim();

      if (!newItemName) {
        return {
          ok: false,
          error: MSG_ERRORS.FORMATO_INCORRECTO_NUEVA
        };
      }

      const result = ItemRepository.saveIfMissing(newItemName, sheetName);

      return {
        exist: result?.exist,
        ok: true,
        value: result?.cleanName,
        isNew: true
      };
    }

    const itemNumber = parseInt(text, 10);

    if (!isNaN(itemNumber) && itemNumber >= 1 && itemNumber <= items.length) {
      return {
        ok: true,
        value: items[itemNumber - 1],
        isNew: false
      };
    }

    return {
      ok: false,
      error: MSG_ERRORS.NUMERO_INVALIDO
    };
  },

  parseExistingSelection(message, sheetName) {
    const items = ItemRepository.list(sheetName);
    const text = String(message || "").trim();
    const itemNumber = parseInt(text, 10);

    if (!isNaN(itemNumber) && itemNumber >= 1 && itemNumber <= items.length) {
      return {
        ok: true,
        value: items[itemNumber - 1]
      };
    }

    return {
      ok: false,
      error: MSG_ERRORS.NUMERO_INVALIDO
    };
  }
};