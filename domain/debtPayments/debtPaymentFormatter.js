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
    }
}