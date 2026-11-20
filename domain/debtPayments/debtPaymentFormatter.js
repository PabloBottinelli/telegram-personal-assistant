var DebtPaymentFormatter = {
    formatPaymentSuccess(result) {
        return (
            `✅ Pago registrado.\n` +
            `Deudor: ${result.deudor}\n` +
            `Pago: ${fmtMoney_(result.moneda, result.montoPago)}\n` +
            `Pendiente nuevo: ${fmtMoney_(result.moneda, result.nuevoPendiente)}`
        );
    },

    formatPaymentError(error) {
        return `❌ No pude registrar el pago:\n${error.message}`;
    },

    formatDebtPaymentList(debtPayments, pageNumber) {
        if (debtPayments.length === 0) { return "No hay pagos de deudas guardados." }

        const blocks = debtPayments.map(debtPayment => {
            const block =
                `Fecha: ${dateToStringDM_(debtPayment.fecha)}\n` +
                `Deudor: ${String(debtPayment.deudor)}\n` +
                `Moneda: ${String(debtPayment.moneda)}\n` +
                `Monto: ${fmtMoney_(debtPayment.moneda, debtPayment.monto)}\n`

            return block
        })

        return `Estos son los pagos de deuda de la página ${pageNumber}:\n\n` + blocks.join("\n\n")
    }
}