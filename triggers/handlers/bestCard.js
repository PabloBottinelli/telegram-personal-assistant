function BestCardTrigger_() {
  const sh = getSheet_(SHEET_LISTAS);
  const values = getTableValues_(sh, TABLA_TARJETAS);

  if (!hasData_(values)) {
    sendTelegram("Mejor tarjeta: (no hay tarjetas)");
    return;
  }
  
  const TODAY = todayNoon_();

  let mejor = null; 
  const problemas = []; 

  for (const row of values) {
    const nombre = row[0].trim();
    if (!nombre) continue;
    
    const ultCierre = row[TARJETA_FIELD_TO_OFFSET['ULTIMO_CIERRE']];
    const ultVenc   = row[TARJETA_FIELD_TO_OFFSET['ULTIMO_VENCIMIENTO']];
    const proxCierre = row[TARJETA_FIELD_TO_OFFSET['PROXIMO_CIERRE']];
    const proxVenc   = row[TARJETA_FIELD_TO_OFFSET['PROXIMO_VENCIMIENTO']];

    const faltaAlguna = !(ultCierre && ultVenc && proxCierre && proxVenc);

    if (faltaAlguna) problemas.push(nombre);
    
    const elegible = (ultCierre && ultCierre <= TODAY) && !!proxVenc;
    if (!elegible) continue;

    if (!mejor || (proxVenc > mejor.proxVenc)) {
      mejor = { nombre, proxVenc };
    }
  }

  let msg = mejor ? `Mejor tarjeta: ${mejor.nombre}` : "Mejor tarjeta: (sin tarjeta elegible hoy)";

  if (problemas.length > 0) {
    problemas.forEach(nom => {
      msg += `\nFalta actualizar información de la tarjeta: ${nom}`;
    });
  }

  sendTelegram(msg);
}