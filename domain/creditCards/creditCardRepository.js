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

  sendCardDates() {
    const sh = getSheet_(SHEET_TARJETAS.name);
    const values = getTableValues_(sh, sh.getLastColumn());
    const cols = getHeaderMapFromSheet_(sh);

    if (!hasData_(values)) {
      sendTelegram("Fechas de Tarjetas\n(no hay tarjetas cargadas)");
      return;
    }

    const fmtDate = (v) => v instanceof Date
      ? dateToStringDM_(v)
      : "-";

    const bloques = [];

    for (let i = 0; i < values.length; i++) {
      const card = creditCardFromRow_(values[i], cols);

      const nombreStr = String(card.nombre || "").trim();

      const line1 = nombreStr;
      const line2 =
        `FUC: ${fmtDate(card.ultimoCierre)} | ` +
        `FUV: ${fmtDate(card.ultimoVencimiento)} | ` +
        `FPC: ${fmtDate(card.proximoCierre)} | ` +
        `FPV: ${fmtDate(card.proximoVencimiento)}`;

      bloques.push(line1 + "\n" + line2);
    }

    sendTelegram("Fechas de Tarjetas\n\n" + bloques.join("\n\n"));
  }
};