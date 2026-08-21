var DebtPaymentService = {
    startPaymentFlow(chatId, debtPayment) {
        saveState_(chatId, {
            flow: "PAY_DEBT",
            step: "WAITING_DEBTOR",
            data: debtPayment,
            timestamp: Date.now()
        });

        DebtorCommand.sendSelectionList();
    },


    register(data) {
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
    },
};