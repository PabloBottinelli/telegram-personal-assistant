// ==== GASTO ====
function procesarGasto(chatId, lineas) {
  const [_, fechaTexto, montoTexto, monedaRaw, metodo, ahorroTexto, detalle, reintegrado] = lineas;

  const errores = [];
  // Fecha
  let fechaNorm = null;
  if (fechaTexto === "-") fechaNorm = _fmtFechaYMD_(new Date());
  else {
    const ymd = _parseFechaYyyymmdd_(fechaTexto);
    if (!ymd) errores.push(MSG.FECHA_INVALIDA);
    else fechaNorm = formatYmd_(ymd.y, ymd.m, ymd.d);
  }

  // Monto
  const monto = parseFloat(String(montoTexto).replace(",", "."));
  if (!isFinite(monto)) errores.push("💵 Monto inválido, que flasheaste. Debe ser número (ej: 1200.50)");

  // Moneda
  const moneda = String(monedaRaw || '').toUpperCase();
  if (!parseMoneda_(moneda)) errores.push("💱 Moneda inválida. Solo USD, USDT o ARS.");

  // Medio de pago
  if (!metodo || String(metodo).trim() === "") errores.push("💳 Medio de pago no puede estar vacío, ¿con qué pagaste, mercado pete?.");

  // Ahorro
  let ahorroValor = null;
  const pa = parseAhorro_(monto, ahorroTexto);
  if (pa.error) errores.push(pa.error); else ahorroValor = pa.valor;

  // Reintegrado
  const pr = parseReintegrado_(reintegrado);
  if (pr.error) errores.push(pr.error);
  const reintegradoVal = pr.error ? null : pr.valor;

  if (errores.length > 0) { sendTelegram(MSG.ERRORES_PREFIX + errores.join("\n")); return; }

  const userState = {
    tipo: "GASTO",
    datos: { fecha: fechaNorm, monto, moneda, metodo, ahorro: ahorroValor, detalle, reintegrado: reintegradoVal },
    esperandoCategoria: true,
    timestamp: Date.now()
  };
  saveState_(chatId, userState);
  pedirCategoria(chatId);
}

// ==== INGRESO ====
function procesarIngreso(chatId, lineas) {
  const [_, fechaTexto, montoTexto, monedaRaw, descripcion] = lineas;

  const errores = [];
  let fechaNorm = null;
  if (fechaTexto === "-") fechaNorm = _fmtFechaYMD_(new Date());
  else {
    const ymd = _parseFechaYyyymmdd_(fechaTexto);
    if (!ymd) errores.push(MSG.FECHA_INVALIDA);
    else fechaNorm = formatYmd_(ymd.y, ymd.m, ymd.d);
  }

  const moneda = String(monedaRaw || '').toUpperCase();
  if (!parseMoneda_(moneda)) errores.push("💱 Moneda inválida. Solo USD, USDT o ARS.");

  const monto = parseFloat(String(montoTexto).replace(",", "."));
  if (!isFinite(monto) || monto <= 0) errores.push("💵 Monto inválido, que flasheaste. Debe ser número positivo (ej: 1200.50)");

  if (errores.length > 0) { sendTelegram(MSG.ERRORES_PREFIX + errores.join("\n")); return; }

  const userState = {
    tipo: "INGRESO",
    datos: { fecha: fechaNorm, moneda, monto, descripcion },
    esperandoCategoria: true,
    timestamp: Date.now()
  };
  saveState_(chatId, userState);
  pedirCategoria(chatId);
}

// ==== TC ====
function procesarTC(chatId, lineas) {
  const [_, fechaTexto, montoTexto, monedaRaw, ahorroTexto, cuotasTexto, detalle, reintegrado] = lineas;

  const errores = [];
  let fechaNorm = null;
  if (fechaTexto === "-") fechaNorm = _fmtFechaYMD_(new Date());
  else {
    const ymd = _parseFechaYyyymmdd_(fechaTexto);
    if (!ymd) errores.push(MSG.FECHA_INVALIDA);
    else fechaNorm = formatYmd_(ymd.y, ymd.m, ymd.d);
  }

  const monto = parseFloat(String(montoTexto).replace(",", "."));
  if (!isFinite(monto) || monto <= 0) errores.push("💵 Monto inválido. Debe ser número positivo (ej: 1200.50)");

  const moneda = String(monedaRaw || "").toUpperCase();
  if (!parseMoneda_(moneda)) errores.push("💱 Moneda inválida. Solo USD, USDT o ARS.");

  const numCuotas = Number(cuotasTexto);
  if (!Number.isInteger(numCuotas) || numCuotas <= 0) errores.push("🧮 #Cuotas inválido. Debe ser un entero positivo (ej: 12)");

  if (!detalle || String(detalle).trim() === "") errores.push("📌 Descripción no puede estar vacía.");

  const pa = parseAhorro_(monto, ahorroTexto);
  let ahorroValor = null;
  if (pa.error) errores.push(pa.error); else ahorroValor = pa.valor;

  const pr = parseReintegrado_(reintegrado);
  if (pr.error) errores.push(pr.error);
  const reintegradoVal = pr.error ? null : pr.valor;

  if (errores.length > 0) { sendTelegram(MSG.ERRORES_PREFIX + errores.join("\n")); return; }

  const userState = {
    tipo: "TC",
    datos: { fecha: fechaNorm, monto, moneda, ahorro: ahorroValor, cuotas: numCuotas, detalle, reintegrado: reintegradoVal },
    esperandoCategoria: true,
    esperandoMetodo: true,
    timestamp: Date.now()
  };
  saveState_(chatId, userState);
  pedirCategoria(chatId);
}

// ==== CATEGORÍA ====
function pedirCategoria(chatId) {
  const categorias = obtenerCategorias();
  let mensaje = MSG.CATEGORIA_LISTA_HEADER;
  categorias.forEach((cat, i) => mensaje += `${i + 1}. ${cat}\n`);
  mensaje += MSG.CATEGORIA_LISTA_FOOTER;
  sendTelegram(mensaje);
}

function handleCategoryResponse(chatId, message, userState) {
  const categorias = obtenerCategorias();

  if (message.toUpperCase().startsWith("NUEVA ")) {
    const nuevaCategoria = message.substring(6).trim();
    if (!nuevaCategoria) { sendTelegram("Tenés que poner un nombre después de NUEVA 🙄"); pedirCategoria(chatId); return; }
    guardarCategoria(nuevaCategoria);
    userState.categoria = nuevaCategoria;
  } else {
    const numero = parseInt(message.trim(), 10);
    if (!isNaN(numero) && numero >= 1 && numero <= categorias.length) {
      userState.categoria = categorias[numero - 1];
    } else if (categorias.includes(message.trim())) {
      userState.categoria = message.trim();
    } else {
      sendTelegram("❌ Categoría no válida. Elegí un número de la lista o creá una NUEVA.");
      pedirCategoria(chatId); return;
    }
  }

  userState.esperandoCategoria = false;

  if (userState.tipo === "TC" && (userState.esperandoMetodo || !userState.metodo)) {
    saveState_(chatId, userState);
    sendTelegram(`✅ Categoría "${userState.categoria}" guardada. Ahora elegí el método de pago.`);
    pedirMetodo(chatId);
    return;
  }

  guardarRegistroCompleto(chatId, userState);
  sendTelegram(`✅ Registro completado con categoría "${userState.categoria}".`);
  clearState_(chatId);
}

// ==== MÉTODO ====
function pedirMetodo(chatId) {
  const metodos = obtenerMetodos();
  let mensaje = "Seleccioná un método escribiendo el NÚMERO:\n\n";
  metodos.forEach((m, i) => mensaje += `${i + 1}. ${m}\n`);
  mensaje += MSG.METODO_LISTA_FOOTER;
  sendTelegram(mensaje);
}

function handleMethodResponse(chatId, message, userState) {
  const metodos = obtenerMetodos();

  if (message.toUpperCase().startsWith("NUEVA ")) {
    const nuevoMetodo = message.substring(6).trim();
    if (!nuevoMetodo) { sendTelegram("Tenés que poner un nombre después de NUEVA 🙄"); pedirMetodo(chatId); return; }
    guardarMetodo(nuevoMetodo);
    userState.metodo = nuevoMetodo;
  } else {
    const numero = parseInt(message.trim(), 10);
    if (!isNaN(numero) && numero >= 1 && numero <= metodos.length) {
      userState.metodo = metodos[numero - 1];
    } else {
      sendTelegram("❌ Número de método inválido. Probá otra vez 🙃");
      pedirMetodo(chatId); return;
    }
  }

  userState.esperandoMetodo = false;

  if (userState.esperandoCategoria || !userState.categoria) {
    saveState_(chatId, userState);
    sendTelegram(`✅ Método seleccionado: "${userState.metodo}". Ahora elegí la categoría.`);
    pedirCategoria(chatId);
    return;
  }

  guardarRegistroCompleto(chatId, userState);
  sendTelegram(`✅ Registro completado con método "${userState.metodo}" y categoría "${userState.categoria}".`);
  clearState_(chatId);
}

// ==== MÉTODO PARA FECHA TARJETA ====
function pedirMetodoTarjetaFecha_(chatId) {
  const metodos = obtenerMetodos();
  let mensaje = MSG.METODO_TARJETA_LISTA_HEADER;
  metodos.forEach((m, i) => mensaje += `${i + 1}. ${m}\n`);
  mensaje += "\nO escribí NUEVA seguido del nombre para agregar una tarjeta nueva (ej: NUEVA Galicia Visa)";
  sendTelegram(mensaje);
}

function handleMethodForDateResponse_(chatId, message, userState) {
  const metodos = obtenerMetodos();

  if (_norm_(message).startsWith("NUEVA ")) {
    const nombre = message.substring(6).trim();
    if (!nombre) { sendTelegram("Tenés que poner un nombre después de NUEVA 🙄"); pedirMetodoTarjetaFecha_(chatId); return; }
    guardarMetodo(nombre);
    userState.metodoFecha = nombre;
  } else {
    const numero = parseInt(message.trim(), 10);
    if (!isNaN(numero) && numero >= 1 && numero <= metodos.length) {
      userState.metodoFecha = metodos[numero - 1];
    } else if (metodos.includes(message.trim())) {
      userState.metodoFecha = message.trim();
    } else {
      sendTelegram("❌ Número de método inválido. Probá otra vez 🙃");
      pedirMetodoTarjetaFecha_(chatId); return;
    }
  }

  try {
    setFechaTarjeta_(userState.metodoFecha, userState.campoFecha, userState.valorFecha);
  } catch (e) {
    sendTelegram("❌ No pude actualizar la fecha: " + e.message);
    clearState_(chatId); return;
  }

  sendTelegram(`✅ Guardado: ${userState.campoFecha.replace('_',' ')} = ${userState.valorFecha} para "${userState.metodoFecha}".`);
  clearState_(chatId);
}

// ==== PERSISTENCIA FINAL ====
function guardarRegistroCompleto(chatId, estado) {
  if (estado.tipo === "GASTO") {
    appendGastoRow_({
      fecha: estado.datos.fecha,
      categoria: estado.categoria,
      metodo: estado.datos.metodo,
      monto: estado.datos.monto,
      moneda: estado.datos.moneda,
      ahorro: estado.datos.ahorro,
      detalle: estado.datos.detalle,
      reintegrado: estado.datos.reintegrado
    });
  } else if (estado.tipo === "INGRESO") {
    appendIngresoRow_({
      fecha: estado.datos.fecha,
      monto: estado.datos.monto,
      moneda: estado.datos.moneda,
      categoria: estado.categoria,
      descripcion: estado.datos.descripcion
    });
  } else if (estado.tipo === "TC") {
    appendGastoRow_({
      fecha: estado.datos.fecha,
      categoria: estado.categoria,
      metodo: estado.metodo || "-",
      monto: estado.datos.monto,
      moneda: estado.datos.moneda,
      ahorro: estado.datos.ahorro,
      detalle: estado.datos.detalle,
      reintegrado: estado.datos.reintegrado
    });
    appendCuotaRow_(estado);
  }
}

function enviarTotales_(chatId) {
  const sh = getSheet_(SHEET_MOVIMIENTOS);
  // Columna R = 18; filas 3..6
  const values = sh.getRange(3, 19, 4, 1).getValues(); // [[R3],[R4],[R5],[R6]]
  const r3 = _nOrZero_(values[0][0]); // Gastos ARS
  const r4 = _nOrZero_(values[1][0]); // Gastos USD
  const r5 = _nOrZero_(values[2][0]); // Ingresos ARS
  const r6 = _nOrZero_(values[3][0]); // Ingresos USD

  const msg =
    `Gastos del mes en pesos: ${_fmtARS_(r3)}\n` +
    `Gastos del mes en USD: ${_fmtUSDplain_(r4)} USD\n` +
    `Ingresos del mes en pesos: ${_fmtARS_(r5)}\n` +
    `Ingresos del mes en USD: ${_fmtUSDplain_(r6)} USD`;

  sendTelegram(msg);
}

function enviarReintegros_() {
  const sh = getSheet_(SHEET_MOVIMIENTOS);
  const values = getTableValues_(sh, TABLA_GASTOS);

  if (!hasData_(values)) { sendTelegram("No hay reintegros pendientes 🎉"); return; }

  const lines = [];
  for (let i = 0; i < values.length; i++) {
    const [fecha, categoria, medio, monto, moneda, ahorro, detalle, reintegrado, devuelto] = values[i];
    if (!(fecha instanceof Date)) continue;

    const fechaStr = _fmtFechaYMD_(fecha);
    const det = String(detalle || "-");
    const isReintegroPend = (reintegrado !== true);
    const isDevolPend = (devuelto !== true);

    // REINTEGROS PENDIENTES
    if (isReintegroPend) {
      // Formato requerido:
      // medio de pago te debe ahorro por compra del fecha
      // Descripcion: descripcion
      const med = String(medio || "").trim();
      lines.push(
        `${med || "Medio"} te debe ${_fmtMoney_(moneda, ahorro)} por compra del ${fechaStr}\n` +
        `Descripcion: ${det}`
      );
    }

    // DEVOLUCIONES PENDIENTES
    if (isDevolPend) {
      // Formato requerido:
      // No te devolvieron la compra del fecha
      // Descripcion: descripcion
      // Monto: monto  Ahorro: ahorro  Total: monto-ahorro
      const total = _nOrZero_(monto) - _nOrZero_(ahorro);
      lines.push(
        `No te devolvieron la compra del ${fechaStr}\n` +
        `Descripcion: ${det}\n` +
        `Monto: ${_fmtMoney_(moneda, monto)}  Ahorro: ${_fmtMoney_(moneda, ahorro)}  Total: ${_fmtMoney_(moneda, total)}`
      );
    }
  }

  if (lines.length === 0) {
    sendTelegram("No hay reintegros pendientes 🎉");
  } else {
    // salto de línea entre cada item
    sendTelegram(lines.join("\n\n"));
  }
}


// Considera TRUE solo si es booleano true
function reintragradoEsTrue_(v) {
  return v === true; // todo lo demás (FALSE, "", null, "-", "no") cuenta como NO marcado
}

function iniciarMarcarReintegrado_(chatId) {
  const sh = getSheet_(SHEET_MOVIMIENTOS);
  const values = getTableValues_(sh, TABLA_GASTOS);

  if (!hasData_(values)) { sendTelegram("No hay reintegros pendientes 🎉"); return; }

  const pendientes = []; // {row, kind:'reintegro'|'devolucion', moneda, monto, ahorro, detalle, fecha, medio}
  for (let i = 0; i < values.length; i++) {
    const [fecha, categoria, medio, monto, moneda, ahorro, detalle, reintegrado, devuelto] = values[i];
    if (!(fecha instanceof Date)) continue;

    // Reintegro pendiente
    if (reintegrado !== true) {
      pendientes.push({
        row: START_ROW + i,
        kind: 'reintegro',
        moneda, monto, ahorro, detalle, fecha,
        medio: String(medio || "").trim()
      });
    }

    // Devolución pendiente
    if (devuelto !== true) {
      pendientes.push({
        row: START_ROW + i,
        kind: 'devolucion',
        moneda, monto, ahorro, detalle, fecha,
        medio: String(medio || "").trim()
      });
    }
  }

  if (pendientes.length === 0) { sendTelegram("No hay reintegros pendientes 🎉"); return; }

  // Armamos el listado numerado con texto según tipo
  const lines = pendientes.map((p, idx) => {
    const fechaStr = _fmtFechaYMD_(p.fecha);
    const det = p.detalle || "-";
    if (p.kind === 'reintegro') {
      return `${idx + 1}. ${p.medio || "Medio"} te debe ${_fmtMoney_(p.moneda, p.ahorro)} por compra del ${fechaStr}\n` +
             `   Descripcion: ${det}`;
    } else {
      const total = _nOrZero_(p.monto) - _nOrZero_(p.ahorro);
      return `${idx + 1}. No te devolvieron la compra del ${fechaStr}\n` +
             `   Descripcion: ${det}\n` +
             `   Monto: ${_fmtMoney_(p.moneda, p.monto)}  Ahorro: ${_fmtMoney_(p.moneda, p.ahorro)}  Total: ${_fmtMoney_(p.moneda, total)}`;
    }
  });

  const st = {
    esperandoReintegroIdx: true,
    reintegrosPendientes: pendientes,
    timestamp: Date.now()
  };
  saveState_(chatId, st);

  sendTelegram(lines.join("\n\n") + "\n\nRespondé el NÚMERO a marcar como resuelto, o escribí CANCELAR.");
}

function handleMarcarReintegroResponse_(chatId, message, userState) {
  const txt = String(message || "").trim().toUpperCase();
  if (txt === "CANCELAR") {
    clearState_(chatId);
    sendTelegram("Operación cancelada.");
    return;
  }

  const idx = parseInt(message, 10);
  const lista = userState.reintegrosPendientes || [];
  if (!Number.isInteger(idx) || idx < 1 || idx > lista.length) {
    sendTelegram("❌ Número inválido. Probá otra vez o escribí CANCELAR.");
    return;
  }

  const elegido = lista[idx - 1]; // {row, kind, ...}
  const sh = getSheet_(SHEET_MOVIMIENTOS);

  // Columnas H e I según offsets configurados
  const colReintegro = TABLA_GASTOS.startCol + (TABLA_GASTOS.checkboxColOffset - 1); // H
  const colDevuelto  = TABLA_GASTOS.startCol + (TABLA_GASTOS.devueltoColOffset  - 1); // I
  const colTarget = (elegido.kind === 'devolucion') ? colDevuelto : colReintegro;

  sh.getRange(elegido.row, colTarget).setValue(true);

  const fechaStr = _fmtFechaYMD_(elegido.fecha);
  const det = elegido.detalle || "-";
  let resumen;
  if (elegido.kind === 'reintegro') {
    resumen = `${(elegido.medio || "Medio")} te debía ${_fmtMoney_(elegido.moneda, elegido.ahorro)} por ${det} del ${fechaStr}`;
    sendTelegram(`✅ Marcado como reintegrado:\n${resumen}`);
  } else {
    const total = _nOrZero_(elegido.monto) - _nOrZero_(elegido.ahorro);
    resumen = `Compra del ${fechaStr}\nDescripcion: ${det}\nMonto: ${_fmtMoney_(elegido.moneda, elegido.monto)}  Ahorro: ${_fmtMoney_(elegido.moneda, elegido.ahorro)}  Total: ${_fmtMoney_(elegido.moneda, total)}`;
    sendTelegram(`✅ Marcado como devuelto:\n${resumen}`);
  }

  clearState_(chatId);
}


function enviarFechasTarjetas_() {
  const sh = getSheet_(SHEET_LISTAS);
  const values = getTableValues_(sh, TABLA_TARJETAS);

  if (!hasData_(values)) {
    sendTelegram("Fechas de Tarjetas\n(no hay tarjetas cargadas)");
    return;
  }

  const fmtDate = (v) => v instanceof Date
    ? _fmtFechaYMD_(v)
    : "-";

  const bloques = [];
  for (let i = 0; i < values.length; i++) {
    const [nombre, uc, uv, pc, pv] = values[i];
    const nombreStr = String(nombre || "").trim();
    if (!nombreStr) continue;

    const line1 = nombreStr;
    const line2 = `FUC: ${fmtDate(uc)} | FUV: ${fmtDate(uv)} | FPC: ${fmtDate(pc)} | FPV: ${fmtDate(pv)}`;
    bloques.push(line1 + "\n" + line2);
  }

  if (bloques.length === 0) {
    sendTelegram("Fechas de Tarjetas\n(no hay tarjetas cargadas)");
  } else {
    // Salto de línea entre cada tarjeta (línea en blanco)
    sendTelegram("Fechas de Tarjetas\n\n" + bloques.join("\n\n"));
  }
}

