function processDateInput(dateString, errores) {
  const raw = String(dateString || '').trim();
  if (raw === "-") return todayNoon_();

  const d = ymdStringToLocalNoonDate_(raw); 
  if (!d) {
    errores.push(MSG_ERRORS.FECHA_INVALIDA); 
    return null;
  }
  return d; 
}

function processAmountInput(amountString, errores) {
  const str = String(amountString).trim().replace(",", ".");

  const monto = parseFloat(str);
  if (!isFinite(monto) || !/^-?\d+(\.\d+)?$/.test(str)) {
    errores.push(MSG_ERRORS.MONTO_INVALIDO);
    return null;
  }

  return monto;
}

function processCoinInput(coin, errores) {
    const moneda = String(coin || '').toUpperCase();
    if (!(/^(USD|USDT|ARS)$/.test(String(moneda || '').toUpperCase()))) {
        errores.push(MSG_ERRORS.MONEDA_INVALIDA);  
        return null;
    } 
    return moneda;
}

function processMethodInput(method, errores) {
    if (!method || String(method).trim() === "") {
        errores.push(MSG_ERRORS.METODO_INVALIDO);
        return null;
    }
    return method;
}

function processSavingInput(montoBase, ahorroTexto, errores) {
    const s = String(ahorroTexto || '').trim();
    const esPorcentaje = /^\s*\d+(?:[.,]\d+)?\s*%$/.test(s);
    const esNumero = /^\s*\d+(?:[.,]\d+)?\s*$/.test(s);

    if (!s || (!esPorcentaje && !esNumero)) {
        errores.push(MSG_ERRORS.AHORRO_INVALIDO);
        return null;
    }

    if (esPorcentaje) {
        const porc = parseFloat(s.replace("%","").replace(",", "."));
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

function processRefundInput(reintegrado, errores) {
    const t = String(reintegrado || '').trim().toLowerCase();
    if (t === "si" || t === "sí" || t === "-") return true;
    if (t === "no") return false;
    errores.push(MSG_ERRORS.VALOR_REINTEGRO_INVALIDO);
    return null;
}

function processQuotaInput(cuotasTexto, errores) {
    const numCuotas = Number(cuotasTexto);
    if (!Number.isInteger(numCuotas) || numCuotas <= 0){
        errores.push(MSG_ERRORS.CUOTAS_INVALIDO);
        return null;
    }
    return numCuotas;
}

function processDetailInput(detalle, errores) {
    if (!detalle || String(detalle).trim() === ""){
        errores.push(MSG_ERRORS.DETALLE_VACIO);
        return null;
    } 
    return String(detalle).trim();
}

        