

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
    deudor: deuda.deudor,
    moneda: deuda.moneda,
    monto: montoPago,
    deudaId: deuda.id
  });

  const nuevoPendiente = pendienteActual - montoPago;

  DebtRepository.updatePendingAmount(deuda.id, nuevoPendiente);

  return {
    paymentId,
    deudaId: deuda.id,
    deudor: deuda.deudor,
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
    const deudor = String(d.deudor || "-").trim();
    const moneda = String(d.moneda || "ARS").trim().toUpperCase();
    const key = deudor + "|" + moneda;

    if (!groups[key]) {
      groups[key] = {
        deudor,
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
      `*${group.deudor}* debe en total ${fmtMoney_(group.moneda, group.total)}\n`;

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


function buildDebtPaymentSelectionMsg_(deudor, debts) {
  let msg =
    `${deudor} tiene varias deudas pendientes.\n` +
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

