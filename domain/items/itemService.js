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

      const savedName = ItemRepository.saveIfMissing(newItemName, sheetName);

      return {
        ok: true,
        value: savedName,
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
  }
};