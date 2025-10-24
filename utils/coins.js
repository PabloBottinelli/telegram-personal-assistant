function fmtARS_(n) {
  return `$${n.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
}

function fmtUSDplain_(n) {
  return n.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
}

function _fmtMoney_(moneda, n) {
  const num = _nOrZero_(n);
  const s = num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (String(moneda).toUpperCase() === 'ARS') ? `$${s}` : `${s} ${moneda || ''}`.trim();
}