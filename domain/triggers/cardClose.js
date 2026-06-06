function CardsMaintenanceTrigger() {
  const sh = getSheet_(SHEET_TARJETAS.name);
  const values = getTableValues_(sh, sh.getLastColumn());
  const cols = getHeaderMapFromSheet_(sh);

  if (!hasData_(values)) return

  const idxUltimoCierre = getRequiredHeaderIndex_(cols, "Último cierre", SHEET_TARJETAS.name);
  const idxUltimoVencimiento = getRequiredHeaderIndex_(cols, "Último vencimiento", SHEET_TARJETAS.name);
  const idxProximoCierre = getRequiredHeaderIndex_(cols, "Próximo Cierre", SHEET_TARJETAS.name);
  const idxProximoVencimiento = getRequiredHeaderIndex_(cols, "Próximo Vencimiento", SHEET_TARJETAS.name);

  const TODAY = todayNoon_()

  const moved = [] 
  let movedCount = 0

  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    const card = cardFromRow_(row, cols);

    const cardName = String(card.nombre || "").trim();
    const pc = card.proximoCierre;
    const pv = card.proximoVencimiento;

    if (pc && pc < TODAY) {
      if (cardName) {
        moved.push({ name: cardName, closeDate: pc });
      }

      row[idxUltimoCierre] = pc;
      row[idxUltimoVencimiento] = pv;
      row[idxProximoCierre] = "";
      row[idxProximoVencimiento] = "";

      movedCount++;
    }

    values[i] = row;
  }

  if (movedCount > 0) {
    sh.getRange(START_ROW, START_COL, values.length, values[0].length).setValues(values)
    for (const m of moved) {
      try {
        const resumen = buildCardStatement_(m.name, m.closeDate)
        sendTelegram(resumen)
      } catch (err) {
        sendTelegram(
          `⚠️ Se movió el ciclo de "${m.name}" pero falló el resumen.\n` +
          `Error: ${err.message || err}`
        )
      }
    }
  }
}
