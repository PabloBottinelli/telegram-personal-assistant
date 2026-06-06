function BestCardTrigger() {
  const sh = getSheet_(SHEET_TARJETAS.name);
  const values = getTableValues_(sh, sh.getLastColumn());
  const cols = getHeaderMapFromSheet_(sh);

  if (!hasData_(values)) {
    sendTelegram("Mejor tarjeta: (no hay tarjetas)");
    return;
  }
  
  const TODAY = todayNoon_();

  let mejor = null; 
  const problemas = []; 

  for (const row of values) {
    const card = cardFromRow_(row, cols);

    const nombre = String(card.nombre || "").trim();
    if (!nombre) continue;
    
    const ultCierre = card.ultimoCierre;
    const ultVenc = card.ultimoVencimiento;
    const proxCierre = card.proximoCierre;
    const proxVenc = card.proximoVencimiento;

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