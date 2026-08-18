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

  moveExpiredCycles(today) {
    const sh = getSheet_(SHEET_TARJETAS.name);
    const values = getTableValues_(sh, sh.getLastColumn());
    const cols = getHeaderMapFromSheet_(sh);

    if (!hasData_(values)) return [];

    const lastCloseIdx = getRequiredHeaderIndex_(cols, "Último cierre", SHEET_TARJETAS.name);
    const lastDueIdx = getRequiredHeaderIndex_(cols, "Último vencimiento", SHEET_TARJETAS.name);
    const nextCloseIdx = getRequiredHeaderIndex_(cols, "Próximo Cierre", SHEET_TARJETAS.name);
    const nextDueIdx = getRequiredHeaderIndex_(cols, "Próximo Vencimiento", SHEET_TARJETAS.name);

    const movedCards = [];
    let changed = false;

    for (let i = 0; i < values.length; i++) {
      const row = values[i];
      const card = creditCardFromRow_(row, cols);

      const cardName = String(card.nombre || "").trim();
      const nextClose = card.proximoCierre;
      const nextDue = card.proximoVencimiento;

      if (!(nextClose instanceof Date) || nextClose >= today) continue;

      if (cardName) {
        movedCards.push({
          card: {
            ...card,
            ultimoCierre: nextClose,
            ultimoVencimiento: nextDue,
            proximoCierre: null,
            proximoVencimiento: null
          },
          closeDate: nextClose
        });
      }

      row[lastCloseIdx] = nextClose;
      row[lastDueIdx] = nextDue instanceof Date ? nextDue : "";
      row[nextCloseIdx] = "";
      row[nextDueIdx] = "";

      values[i] = row;
      changed = true;
    }

    if (changed) {
      sh.getRange(START_ROW, START_COL, values.length, values[0].length).setValues(values);
    }

    return movedCards;
  }
};