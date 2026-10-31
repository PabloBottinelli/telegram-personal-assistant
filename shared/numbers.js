function nOrZero_(v) {
  const n = typeof v === 'number' ? v : Number(String(v).replace(/[^\d.-]/g,''));
  return isFinite(n) ? n : 0;
}





