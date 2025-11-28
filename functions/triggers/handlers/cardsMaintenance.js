function CardsMaintenanceTrigger() {
  const sh = getSheet_(SHEET_TARJETAS.name);
  const values = getTableValues_(sh, SHEET_TARJETAS.headers.length);

  if (!hasData_(values)) return;

  const TODAY = todayNoon_();

  let movedCount = 0;

  for (let i = 0; i < values.length; i++) {
    const row = values[i];

    const pc = row[TARJETA_FIELD_TO_OFFSET['PROXIMO CIERRE']];
    const pv = row[TARJETA_FIELD_TO_OFFSET['PROXIMO VENCIMIENTO']];

    if (pc && pc < TODAY) {
      row[TARJETA_FIELD_TO_OFFSET['ULTIMO CIERRE']]       = pc;
      row[TARJETA_FIELD_TO_OFFSET['ULTIMO VENCIMIENTO']]  = pv;
      row[TARJETA_FIELD_TO_OFFSET['PROXIMO CIERRE']]      = "";
      row[TARJETA_FIELD_TO_OFFSET['PROXIMO VENCIMIENTO']] = "";
      movedCount++;
    }

    values[i] = row;
  }

  if (movedCount > 0) {
    sh.getRange(START_ROW, START_COL, values.length, values[0].length).setValues(values);
    sendTelegram(`Mantenimiento tarjetas: se movieron ${movedCount} ciclo(s).`);
  }
}
