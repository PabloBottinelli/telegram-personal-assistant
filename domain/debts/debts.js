function createDebt_(data) {
  const monto = nOrZero_(data.monto);

  if (!data.persona || String(data.persona).trim() === "") {
    throw new Error("La deuda necesita una persona/entidad.");
  }

  if (monto <= 0) {
    throw new Error("El monto de la deuda debe ser mayor a 0.");
  }

  const debt = {
    fecha: data.fecha || todayNoon_(),
    persona: data.persona,
    moneda: data.moneda || "ARS",
    monto: monto,
    montoPendiente: monto,
    detalle: data.detalle || "-",
    estado: "Pendiente",
    gastoId: data.gastoId || ""
  };

  return DebtRepository.append(debt);
}

function processDebt(chatId, lineas) {
  const [, montoTexto, monedaRaw, detalleRaw] = lineas;

  const errores = [];

  const monto = processAmountInput(montoTexto, errores);
  const moneda = processCoinInput(monedaRaw, errores);
  const detalle = processDetailInput(detalleRaw, errores);

  if (errores.length > 0) {
    sendTelegram(MSG_ERRORS.ERRORES_PREFIX + errores.join("\n"));
    return;
  }

  const userState = {
    tipo: "DEUDA",
    datos: {
      monto,
      moneda,
      detalle
    },
    esperandoDeudor: true,
    timestamp: Date.now()
  };

  saveState_(chatId, userState);
  DebtorCommand.sendSelectionList();
}

function registerDebtPayment_(data) {
  const deuda = DebtRepository.findById(data.deudaId);

  if (!deuda) {
    throw new Error(`No encontré la deuda ${data.deudaId}.`);
  }

  const montoPago = nOrZero_(data.monto);

  if (montoPago <= 0) {
    throw new Error("El monto del pago debe ser mayor a 0.");
  }

  const pendienteActual = nOrZero_(deuda.montoPendiente);

  if (montoPago > pendienteActual) {
    throw new Error(
      `El pago supera el monto pendiente. Pendiente actual: ${fmtMoney_(deuda.moneda, pendienteActual)}.`
    );
  }

  const paymentId = DebtPaymentRepository.append({
    fecha: data.fecha || todayNoon_(),
    persona: deuda.persona,
    moneda: deuda.moneda,
    monto: montoPago,
    deudaId: deuda.id
  });

  const nuevoPendiente = pendienteActual - montoPago;

  DebtRepository.updatePendingAmount(deuda.id, nuevoPendiente);

  return {
    paymentId,
    deudaId: deuda.id,
    persona: deuda.persona,
    moneda: deuda.moneda,
    montoPago,
    nuevoPendiente
  };
}

function sendDebts() {
  const debts = DebtRepository.listPending();

  if (debts.length === 0) {
    sendTelegram("No hay deudas pendientes 🎉");
    return;
  }

  const groups = {};

  debts.forEach(d => {
    const persona = String(d.persona || "-").trim();
    const moneda = String(d.moneda || "ARS").trim().toUpperCase();
    const key = persona + "|" + moneda;

    if (!groups[key]) {
      groups[key] = {
        persona,
        moneda,
        total: 0,
        debts: []
      };
    }

    const pendiente = nOrZero_(d.montoPendiente);

    groups[key].total += pendiente;
    groups[key].debts.push(d);
  });

  const blocks = Object.values(groups).map(group => {
    const header =
      `*${group.persona}* debe en total ${fmtMoney_(group.moneda, group.total)}\n`;

    const detailLines = group.debts.map((d, idx) => {
      const fecha = d.fecha instanceof Date ? dateToStringDM_(d.fecha) : "-";
      const detalle = String(d.detalle || "-");
      const pendiente = nOrZero_(d.montoPendiente);

      return (
        `${idx + 1}. ${fmtMoney_(d.moneda, pendiente)}\n` +
        `   Fecha: ${fecha}\n` +
        `   Detalle: ${detalle}\n` +
        `   ID: ${d.id}`
      );
    });

    return header + "\n" + detailLines.join("\n\n");
  });

  sendTelegram(blocks.join("\n\n----------------\n\n"));
}

function finishDebtFlow_(chatId, userState) {
  if (userState.tipo === "DEUDA") {
    const deudaId = createDebt_({
      fecha: todayNoon_(),
      persona: userState.deudor,
      moneda: userState.datos.moneda,
      monto: userState.datos.monto,
      detalle: userState.datos.detalle,
      gastoId: ""
    });

    sendTelegram(
      `✅ Deuda creada.\n` +
      `Persona/Entidad: ${userState.deudor}\n` +
      `Monto: ${fmtMoney_(userState.datos.moneda, userState.datos.monto)}\n` +
      `Detalle: ${userState.datos.detalle}\n` +
      `ID: ${deudaId}`
    );

    statesReset();
    return;
  }

  if (userState.tipo === "PAGO_DEUDA") {
    finishDebtPaymentDebtorSelected_(chatId, userState);
    return;
  }

  sendTelegram("❌ Estado de deuda no reconocido.");
  statesReset();
}

function processDebtPaymentStart(chatId, lineas) {
  const [, montoTexto] = lineas;

  const errores = [];
  const monto = processAmountInput(montoTexto, errores);

  if (errores.length > 0) {
    sendTelegram(MSG_ERRORS.ERRORES_PREFIX + errores.join("\n"));
    return;
  }

  const userState = {
    tipo: "PAGO_DEUDA",
    datos: {
      monto
    },
    esperandoDeudor: true,
    timestamp: Date.now()
  };

  saveState_(chatId, userState);
  DebtorCommand.sendSelectionList();
}

function finishDebtPaymentDebtorSelected_(chatId, userState) {
  const debts = DebtRepository.listPendingByPerson(userState.deudor);

  if (debts.length === 0) {
    sendTelegram(`No hay deudas pendientes para ${userState.deudor}.`);
    statesReset();
    return;
  }

  if (debts.length === 1) {
    applyDebtPaymentAndRespond_(chatId, debts[0], userState.datos.monto);
    statesReset();
    return;
  }

  userState.esperandoDeudaParaPagar = true;
  userState.deudasDisponibles = debts.map(d => d.id);

  saveState_(chatId, userState);

  sendTelegram(buildDebtPaymentSelectionMsg_(userState.deudor, debts));
}

function handleDebtToPayResponse(chatId, message, userState) {
  const msg = String(message || "").trim();

  const idx = parseInt(msg, 10);

  if (isNaN(idx) || idx < 1 || idx > userState.deudasDisponibles.length) {
    sendTelegram("Número inválido. Elegí una deuda de la lista o escribí CANCELAR.");
    saveState_(chatId, userState);
    sendDebtPaymentSelectionMsg_(userState);
    return;
  }

  const deudaId = userState.deudasDisponibles[idx - 1];
  const deuda = DebtRepository.findById(deudaId);

  if (!deuda) {
    sendTelegram("❌ No encontré esa deuda. Volvé a intentar.");
    statesReset();
    return;
  }

  applyDebtPaymentAndRespond_(chatId, deuda, userState.datos.monto);
  statesReset();
}

function applyDebtPaymentAndRespond_(chatId, deuda, montoPago) {
  try {
    const result = registerDebtPayment_({
      deudaId: deuda.id,
      monto: montoPago,
      fecha: todayNoon_()
    });

    sendTelegram(
      `✅ Pago registrado.\n` +
      `Persona/Entidad: ${result.persona}\n` +
      `Pago: ${fmtMoney_(result.moneda, result.montoPago)}\n` +
      `Pendiente nuevo: ${fmtMoney_(result.moneda, result.nuevoPendiente)}\n`
    );
  } catch (err) {
    sendTelegram("❌ No pude registrar el pago:\n" + err.message);
  }
}

function buildDebtPaymentSelectionMsg_(persona, debts) {
  let msg =
    `${persona} tiene varias deudas pendientes.\n` +
    `Elegí cuál querés pagar:\n\n`;

  debts.forEach((d, idx) => {
    const fecha = d.fecha instanceof Date ? dateToStringDM_(d.fecha) : "-";
    const pendiente = nOrZero_(d.montoPendiente);

    msg +=
      `${idx + 1}. ${fmtMoney_(d.moneda, pendiente)}\n` +
      `   Fecha: ${fecha}\n` +
      `   Detalle: ${d.detalle || "-"}\n\n`;
  });

  msg += "O escribí CANCELAR para abortar.";

  return msg;
}

function debtsFromPaymentState_(userState) {
  return (userState.deudasDisponibles || [])
    .map(id => DebtRepository.findById(id))
    .filter(Boolean);
}

function sendDebtPaymentSelectionMsg_(userState) {
  const debts = debtsFromPaymentState_(userState);
  sendTelegram(buildDebtPaymentSelectionMsg_(userState.deudor, debts));
}