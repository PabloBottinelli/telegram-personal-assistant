var ItemService = {
  parseSelection(message, sheetName) {
    const items = ItemRepository.getAllFrom(sheetName);
    const text = String(message || "").trim();

    if (text.toUpperCase().startsWith("NUEVA ") || text.toUpperCase().startsWith("NUEVO ")) {
      const newItemName = text.substring(6).trim();

      if (!newItemName) {
        return {
          ok: false,
          error: MSG_ERRORS.FORMATO_INCORRECTO_NUEVA
        };
      }

      const result = this.saveIfMissing(newItemName, sheetName);

      return {
        exist: result?.exist,
        ok: true,
        value: result?.cleanName,
      };
    }

    const itemNumber = /^\d+$/.test(text) ? Number(text) : NaN;

    if (!isNaN(itemNumber) && itemNumber >= 1 && itemNumber <= items.length) {
      return {
        ok: true,
        value: items[itemNumber - 1],
      };
    }

    return {
      ok: false,
      error: MSG_ERRORS.NUMERO_INVALIDO_NUEVA
    };
  },

  saveIfMissing(name, sheetName) {
    const cleanName = String(name || "").trim();
    if (!cleanName) return null;

    const items = ItemRepository.getAllFrom(sheetName);
    const alreadyExists = items.some(item => item.toLowerCase() === cleanName.toLowerCase());

    if (alreadyExists) return { ok: false, exist: true, cleanName };

    ItemRepository.append(cleanName, sheetName);
    return { ok: true, exist: false, cleanName };
  },

  parseExistingSelection(message, sheetName) {
    const items = ItemRepository.getAllFrom(sheetName);
    const text = String(message || "").trim();
    const itemNumber = /^\d+$/.test(text) ? Number(text) : NaN;

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
