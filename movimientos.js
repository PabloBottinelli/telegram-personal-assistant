function appendGastoRow_(gasto) {
  const sh = getSheet_(SHEET_MOVIMIENTOS);
  const rowIndex = findNextRowInTable_(sh, SHEET_MOVIMIENTOS);

  const d = ymdStringToLocalNoonDate_(gasto.fecha) || (function(){ const x=new Date(); x.setHours(12,0,0,0); return x; })();

  const cat = String(gasto.categoria || "").trim();
  const isAjeno = (cat.toLowerCase() === "ajeno");
  const devuelto = isAjeno ? false : true; // NUEVO: Devuelto? (ajeno = false, resto = true)

  const row = [
    d,
    gasto.categoria,
    gasto.metodo,
    gasto.monto,
    gasto.moneda,
    gasto.ahorro ?? '',
    gasto.detalle ?? '',
    gasto.reintegrado === true,
    devuelto
  ];

  const range = sh.getRange(rowIndex, TABLA_GASTOS.startCol, 1, TABLA_GASTOS.headers.length);
  range.setValues([row]);

  sortTableByDate_(sh, TABLA_GASTOS);
}


function appendIngresoRow_(ing) {
  const sh = getSheet_(SHEET_MOVIMIENTOS);
  const rowIndex = findNextRowInTable_(sh, SHEET_MOVIMIENTOS);

  const d = ymdStringToLocalNoonDate_(ing.fecha) || (function(){ const x=new Date(); x.setHours(12,0,0,0); return x; })();

  const row = [ d, ing.monto, ing.moneda, ing.categoria, ing.descripcion ?? '' ];

  const range = sh.getRange(rowIndex, TABLA_INGRESOS.startCol, 1, TABLA_INGRESOS.headers.length);
  range.setValues([row]);

  sortTableByDate_(sh, TABLA_INGRESOS);
}

function appendCuotaRow_(estado) {
  const sh = getSheet_(SHEET_CUOTAS);
  if (sh.getLastRow() === 0) {
    sh.appendRow(["Fecha", "Medio de pago", "Moneda", "Monto", "#Cuotas", "#CuotasRestantes", "Detalle"]);
  }
  const dTC = ymdStringToLocalNoonDate_(estado.datos.fecha) || (function(){ const x=new Date(); x.setHours(12,0,0,0); return x; })();
  sh.appendRow([ dTC, estado.metodo || "-", estado.datos.moneda, estado.datos.monto, estado.datos.cuotas, estado.datos.cuotas, estado.datos.detalle ]);

  sortTableByDate_(sh, TABLA_DEUDAS);
}
