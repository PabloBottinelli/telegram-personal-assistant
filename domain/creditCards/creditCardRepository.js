var CreditCardRepository = {
  setDate(data) {
    const sh = getSheet_(SHEET_TARJETAS.name);
    const row = ItemRepository.findRowByName(data.metodo, SHEET_TARJETAS.name, sh.getLastColumn());

    const cols = getHeaderMapFromSheet_(sh);

    const campoToHeader = {
      "ULTIMO CIERRE": "Último cierre",
      "ULTIMO VENCIMIENTO": "Último vencimiento",
      "PROXIMO CIERRE": "Próximo Cierre",
      "PROXIMO VENCIMIENTO": "Próximo Vencimiento"
    };

    const header = campoToHeader[data.type];

    const idx = getRequiredHeaderIndex_(cols, header, SHEET_TARJETAS.name);
    sh.getRange(row, START_COL + idx).setValue(data.date);
  },

  list() {
    const sh = getSheet_(SHEET_TARJETAS.name);
    const values = getTableValues_(sh, sh.getLastColumn());
    const cols = getHeaderMapFromSheet_(sh);

    if (!hasData_(values)) return [];

    return values
      .filter(row => row.some(value => String(value).trim() !== ""))
      .map(row => creditCardFromRow_(row, cols));
  },

  updateCycle(cardId, cycle) {
    const sh = getSheet_(SHEET_TARJETAS.name);
    const values = getTableValues_(sh, sh.getLastColumn());
    const cols = getHeaderMapFromSheet_(sh);

    if (!hasData_(values)) return false;

    const idIdx = getRequiredHeaderIndex_(cols,"ID",SHEET_TARJETAS.name);
    const lastCloseIdx = getRequiredHeaderIndex_(cols, "Último cierre", SHEET_TARJETAS.name);
    const lastDueIdx = getRequiredHeaderIndex_(cols, "Último vencimiento", SHEET_TARJETAS.name);
    const nextCloseIdx = getRequiredHeaderIndex_(cols, "Próximo Cierre", SHEET_TARJETAS.name);
    const nextDueIdx = getRequiredHeaderIndex_(cols, "Próximo Vencimiento", SHEET_TARJETAS.name);


    const normalizedId = String(cardId || "").trim();

    for (let i = 0; i < values.length; i++) {
      const currentId = String(values[i][idIdx] || "").trim();

      if (currentId !== normalizedId) continue;

      const row = values[i];

      row[lastCloseIdx] = cycle.ultimoCierre;
      row[lastDueIdx] = cycle.ultimoVencimiento || "";
      row[nextCloseIdx] = cycle.proximoCierre || "";
      row[nextDueIdx] = cycle.proximoVencimiento || "";

      sh
        .getRange(START_ROW + i, START_COL, 1, row.length)
        .setValues([row]);

      return true;
    }

    return false;
  }
};