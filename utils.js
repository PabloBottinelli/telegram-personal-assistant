// Normaliza texto (mayúsculas y sin tildes)
function _norm_(s) {
  return String(s || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toUpperCase().trim();
}



// Validadores / Parsers (punto 6)
function parseMoneda_(moneda) {
  return /^(USD|USDT|ARS)$/.test(String(moneda || '').toUpperCase());
}

function parseNumeroPositivo_(txt) {
  const n = parseFloat(String(txt || '').replace(",", "."));
  return isFinite(n) && n > 0 ? n : null;
}

// parseAhorro_: acepta "xx%" o número positivo. Devuelve {valor,error}
function parseAhorro_(montoBase, ahorroTexto) {
  const s = String(ahorroTexto || '').trim();
  if (!s) return { error: "💾 Ahorro inválido. Indicá un número positivo o un porcentaje (ej: 15 o 15%)." };

  const esPorcentaje = /^\s*\d+(?:[.,]\d+)?\s*%$/.test(s);
  const esNumero = /^\s*\d+(?:[.,]\d+)?\s*$/.test(s);

  if (!esPorcentaje && !esNumero) {
    return { error: "💾 Formato de ahorro inválido. Usá número positivo o porcentaje (ej: 200 o 12,5%)." };
  }

  if (esPorcentaje) {
    const porc = parseFloat(s.replace("%","").replace(",", "."));
    if (!isFinite(porc) || porc <= 0) return { error: "💾 El porcentaje de ahorro debe ser un número positivo (ej: 10%)." };
    if (!isFinite(montoBase)) return { error: "💵 Monto base inválido para calcular porcentaje." };
    const valor = Number(((montoBase * porc) / 100).toFixed(2));
    return { valor };
  } else {
    const num = parseFloat(s.replace(",", "."));
    if (!isFinite(num) || num < 0) return { error: "💾 El ahorro debe ser un número mayor a 0 (ej: 150 o 150,75)." };
    return { valor: Number(num.toFixed(2)) };
  }
}

// parseReintegrado_: "si", "sí" o "-" → true ; "no" → false ; otro → error
function parseReintegrado_(txt) {
  const t = String(txt || '').trim().toLowerCase();
  if (t === "si" || t === "sí" || t === "-") return { valor: true };
  if (t === "no") return { valor: false };
  return { error: "↩️ Valor inválido en reintegrado. Solo se acepta 'si' o 'no'." };
}

function _nOrZero_(v) {
  const n = typeof v === 'number' ? v : Number(String(v).replace(/[^\d.-]/g,''));
  return isFinite(n) ? n : 0;
}

function _fmtARS_(n) {
  // $ con formato es-AR, 2 decimales
  return `$${n.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
}

function _fmtUSDplain_(n) {
  // número con punto/coma según es-AR pero sin símbolo y con 2 decimales
  return n.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
}

function _fmtMoney_(moneda, n) {
  const num = _nOrZero_(n);
  const s = num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (String(moneda).toUpperCase() === 'ARS') ? `$${s}` : `${s} ${moneda || ''}`.trim();
}

