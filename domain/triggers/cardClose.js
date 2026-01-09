function CardsMaintenanceTrigger() {
  const sh = getSheet_(SHEET_TARJETAS.name)
  const values = getTableValues_(sh, SHEET_TARJETAS.headers.length)

  if (!hasData_(values)) return

  const TODAY = todayNoon_()

  const moved = [] // [{ name, closeDate }]
  let movedCount = 0

  for (let i = 0; i < values.length; i++) {
    const row = values[i]

    const cardName = row[0]
    const pc = row[TARJETA_FIELD_TO_OFFSET['PROXIMO CIERRE']]
    const pv = row[TARJETA_FIELD_TO_OFFSET['PROXIMO VENCIMIENTO']]

    if (pc && pc < TODAY) {

      if (cardName) moved.push({ name: cardName, closeDate: pc })

      row[TARJETA_FIELD_TO_OFFSET['ULTIMO CIERRE']]       = pc
      row[TARJETA_FIELD_TO_OFFSET['ULTIMO VENCIMIENTO']]  = pv
      row[TARJETA_FIELD_TO_OFFSET['PROXIMO CIERRE']]      = ""
      row[TARJETA_FIELD_TO_OFFSET['PROXIMO VENCIMIENTO']] = ""
      movedCount++
    }

    values[i] = row
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
