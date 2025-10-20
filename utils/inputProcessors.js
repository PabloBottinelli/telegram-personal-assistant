function processDateInput_(dateString, errores) {
  if (dateString === "-") return fmtFechaYMD_(new Date());

  const ymd = parseFechaYyyymmdd_(dateString);
  if (!ymd) {
    errores.push(MSG.FECHA_INVALIDA);
    return null;
  }
  return formatYmd_(ymd.y, ymd.m, ymd.d);
}

function processAmountInput_(amountString, errores) {
    const monto = parseFloat(String(amountString).replace(",", "."));
    if (!isFinite(monto)) {
        errores.push(MSG.MONTO_INVALIDO);
        return null;
    };
    return monto;
}

function processCoinInput_(coin, errores) {
    const moneda = String(coin || '').toUpperCase();
    if (!(/^(USD|USDT|ARS)$/.test(String(moneda || '').toUpperCase()))) {
        errores.push(MSG.MONEDA_INVALIDA);  
        return null;
    } 
    return moneda;
}

function processMethodInput_(method, errores) {
    if (!method || String(method).trim() === "") {errores.push(MSG.METODO_INVALIDO);
        errores.push(MSG.METODO_INVALIDO);
        return null;
    }
    return method;
}

function processSavingInput_(montoBase, ahorroTexto, errores) {
    const s = String(ahorroTexto || '').trim();
    const esPorcentaje = /^\s*\d+(?:[.,]\d+)?\s*%$/.test(s);
    const esNumero = /^\s*\d+(?:[.,]\d+)?\s*$/.test(s);

    if (!s || (!esPorcentaje && !esNumero)) {
        errores.push(MSG.AHORRO_INVALIDO);
        return null;
    }

    if (esPorcentaje) {
        const porc = parseFloat(s.replace("%","").replace(",", "."));
        if (!isFinite(porc) || porc <= 0) {
            errores.push(MSG.PORCENTAJE_INVALIDO);
            return null;
        }
        if (!isFinite(montoBase)) {
            errores.push(MSG.MONTO_BASE_INVALIDO);
            return null;
        }
        const valor = Number(((montoBase * porc) / 100).toFixed(2));
        return valor;
    } else {
        const num = parseFloat(s.replace(",", "."));
        if (!isFinite(num) || num < 0) {
            errores.push(MSG.AHORRO_INVALIDO);
            return null;
        }
        return Number(num.toFixed(2));
    }
}

function processRefundInput_(reintegrado, errores) {
    const t = String(reintegrado || '').trim().toLowerCase();
    if (t === "si" || t === "sí" || t === "-") return true;
    if (t === "no") return false;
    errores.push(MSG.VALOR_REINTEGRO_INVALIDO);
    return null;
}

function processQuotaInput_(cuotasTexto, errores) {
    const numCuotas = Number(cuotasTexto);
    if (!Number.isInteger(numCuotas) || numCuotas <= 0){
        errores.push(MSG.CUOTAS_INVALIDO);
        return null;
    }
    return numCuotas;
}

function processDetailInput_(detalle, errores) {
    if (!detalle || String(detalle).trim() === ""){
        errores.push(MSG.DETALLE_VACIO);
        return null;
    } 
    return String(detalle).trim();
}

        