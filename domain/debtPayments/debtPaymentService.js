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

    applyPayment(deuda, montoPago) {
        try {
            const result = registerDebtPayment_({
                deudaId: deuda.id,
                monto: montoPago,
                fecha: todayNoon_()
            });

            sendTelegram(
                `✅ Pago registrado.\n` +
                `Deudor: ${result.deudor}\n` +
                `Pago: ${fmtMoney_(result.moneda, result.montoPago)}\n` +
                `Pendiente nuevo: ${fmtMoney_(result.moneda, result.nuevoPendiente)}\n`
            );
        } catch (err) {
            sendTelegram("❌ No pude registrar el pago:\n" + err.message);
        }
    }
};