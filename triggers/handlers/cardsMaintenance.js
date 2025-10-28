function CardsMaintenanceTrigger() {
  const sh = getSheet_(SHEET_LISTAS);
  const values = getTableValues_(sh, TABLA_TARJETAS);

  if (!hasData_(values)) return;

  const TODAY = todayNoon_();

  let movedCount = 0;

  for (let i = 0; i < values.length; i++) {
    const row = values[i];

    const pc = row[TARJETA_FIELD_TO_OFFSET['PROXIMO_CIERRE']];
    const pv = row[TARJETA_FIELD_TO_OFFSET['PROXIMO_VENCIMIENTO']];

    if (pc && pc < TODAY) {
      row[TARJETA_FIELD_TO_OFFSET['ULTIMO_CIERRE']]       = pc;
      row[TARJETA_FIELD_TO_OFFSET['ULTIMO_VENCIMIENTO']]  = pv;
      row[TARJETA_FIELD_TO_OFFSET['PROXIMO_CIERRE']]      = "";
      row[TARJETA_FIELD_TO_OFFSET['PROXIMO_VENCIMIENTO']] = "";
      movedCount++;
    }

    values[i] = row;
  }

  if (movedCount > 0) {
    sh.getRange(START_ROW, TABLA_TARJETAS.startCol, values.length, values[0].length).setValues(values);
    sendTelegram(`Mantenimiento tarjetas: se movieron ${movedCount} ciclo(s).`);
  }
}
