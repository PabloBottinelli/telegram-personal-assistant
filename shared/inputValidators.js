function validateDateInput(dateString, errores) {
  const raw = String(dateString || '').trim();
  if (raw === "-") return todayNoon_();

  const d = parseDayMonthForTransaction_(raw);
  if (!d) {
    errores.push(MSG_ERRORS.FECHA_INVALIDA);
    return null;
  }
  return d;
}

function validateAmountInput(amountString, errores) {
  const str = String(amountString).trim().replace(",", ".");

  const monto = parseFloat(str);
  if (!isFinite(monto) || !/^\d+(\.\d+)?$/.test(str) || monto == 0) {
    errores.push(MSG_ERRORS.MONTO_INVALIDO);
    return null;
  }

  return monto;
}

function validateCoinInput(coin, errores) {
  const moneda = String(coin || '').toUpperCase();
  if (!(/^(USD|USDT|ARS)$/.test(String(moneda || '').toUpperCase()))) {
    errores.push(MSG_ERRORS.MONEDA_INVALIDA);
    return null;
  }
  return moneda;
}

function validateMethodInput(method, errores) {
  if (!method || String(method).trim() === "") {
    errores.push(MSG_ERRORS.METODO_INVALIDO);
    return null;
  }
  return method;
}

function validateSavingInput(montoBase, ahorroTexto, errores) {
  const s = String(ahorroTexto || '').trim();
  const esPorcentaje = /^\s*\d+(?:[.,]\d+)?\s*%$/.test(s);
  const esNumero = /^\s*\d+(?:[.,]\d+)?\s*$/.test(s);

  if (!s || (!esPorcentaje && !esNumero)) {
    errores.push(MSG_ERRORS.AHORRO_INVALIDO);
    return null;
  }

  if (esPorcentaje) {
    const porc = parseFloat(s.replace("%", "").replace(",", "."));
    if (!isFinite(porc) || porc <= 0) {
      errores.push(MSG_ERRORS.PORCENTAJE_INVALIDO);
      return null;
    }
    if (!isFinite(montoBase)) {
      errores.push(MSG_ERRORS.MONTO_BASE_INVALIDO);
      return null;
    }
    const valor = Number(((montoBase * porc) / 100).toFixed(2));
    return valor;
  } else {
    const num = parseFloat(s.replace(",", "."));
    if (!isFinite(num) || num < 0) {
      errores.push(MSG_ERRORS.AHORRO_INVALIDO);
      return null;
    }
    return Number(num.toFixed(2));
  }
}

function validateRefundInput(reintegrado, tipo, ahorro, errores) {
  const t = String(reintegrado || '').trim().toLowerCase();
  const tipoNorm = String(tipo || '').trim().toUpperCase();
  const ahorroNum = Number(ahorro) || 0;

  if (tipoNorm === "-") {
    if (ahorroNum > 0) {
      errores.push(MSG_ERRORS.REFUND_INPUT_INVALIDO_1);
      return null;
    }

    if (t !== "-") {
      errores.push(MSG_ERRORS.REFUND_INPUT_INVALIDO_2);
      return null;
    }

    return true;
  }

  if (tipoNorm === "D") {
    if (t !== "-" && t !== "si" && t !== "sí") {
      errores.push(MSG_ERRORS.REFUND_INPUT_INVALIDO_3);
      return null;
    }

    return true;
  }

  if (tipoNorm === "R") {
    if (ahorroNum <= 0) {
      errores.push(MSG_ERRORS.REFUND_INPUT_INVALIDO_4);
      return null;
    }

    if (t === "si" || t === "sí") return true;
    if (t === "no") return false;

    errores.push(MSG_ERRORS.REFUND_INPUT_INVALIDO_5);
    return null;
  }

  errores.push(MSG_ERRORS.VALOR_REINTEGRO_INVALIDO);
  return null;
}

function validateQuotaInput(cuotasTexto, errores) {
  const numCuotas = Number(cuotasTexto);
  if (!Number.isInteger(numCuotas) || numCuotas <= 0) {
    errores.push(MSG_ERRORS.CUOTAS_INVALIDO);
    return null;
  }
  return numCuotas;
}

function validateTypeInput(tipo, errores) {
  const t = String(tipo || '').toUpperCase();
  if (!(/^(D|R|-)$/.test(String(t || '').toUpperCase()))) {
    errores.push(MSG_ERRORS.TIPO_INVALIDO);
    return null;
  }
  return t;
}

function validateDetailInput(detalle, errores) {
  if (!detalle || String(detalle).trim() === "") {
    errores.push(MSG_ERRORS.DETALLE_VACIO);
    return null;
  }
  return String(detalle).trim();
}

