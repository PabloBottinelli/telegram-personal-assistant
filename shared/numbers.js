function parsePositiveNumber_(txt) {
  const n = parseFloat(String(txt || '').replace(",", "."));
  return isFinite(n) && n > 0 ? n : null;
}

function nOrZero_(v) {
  const n = typeof v === 'number' ? v : Number(String(v).replace(/[^\d.-]/g,''));
  return isFinite(n) ? n : 0;
}





