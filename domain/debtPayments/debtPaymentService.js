var DebtPaymentService = {
    startPaymentFlow(chatId, debtPayment) {
        saveState_(chatId, {
            flow: "PAY_DEBT",
            step: "WAITING_DEBTOR",
            data: debtPayment,
            timestamp: Date.now()
        });

        DebtorCommand.sendExistingSelectionList();
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

        const nuevoPendiente = pendienteActual - montoPago;

        if (!DebtRepository.updatePendingAmount(deuda.id, nuevoPendiente)) {
            throw new Error(
                `No se pudo actualizar el monto pendiente.`
            );
        };

        let paymentId;

        try {
            paymentId = DebtPaymentRepository.append({
                fecha: data.fecha || todayNoon_(),
                deudor: deuda.deudor,
                moneda: deuda.moneda,
                monto: montoPago,
                deudaId: deuda.id
            });
        } catch (error) {
            let restored = false;

            try {
                restored = DebtRepository.updatePendingAmount(deuda.id, pendienteActual);
            } catch (rollbackError) {
                throw new Error(`Falló el registro del pago y no se pudo restaurar el saldo: ${rollbackError.message}`);
            }

            if (!restored) {
                throw new Error(`Falló el registro del pago y no se pudo restaurar el saldo de la deuda ${deuda.id}.`);
            }

            throw error;
        }

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