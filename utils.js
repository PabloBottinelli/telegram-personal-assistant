// Normaliza texto (mayúsculas y sin tildes)
function _norm_(s) {
  return String(s || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toUpperCase().trim();
}

function parseNumeroPositivo_(txt) {
  const n = parseFloat(String(txt || '').replace(",", "."));
  return isFinite(n) && n > 0 ? n : null;
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

