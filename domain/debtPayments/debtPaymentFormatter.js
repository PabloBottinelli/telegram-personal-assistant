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

    formatTransactionList(debtPayments, pageNumber) {
        return formatPaginatedList_(debtPayments, pageNumber, "Estos son los pagos de deuda", "No hay pagos de deudas guardados.", debtPayment => this.formatTransaction(debtPayment))
    },

    formatTransaction(debtPayment) {
        return [
            `Fecha: ${dateToStringDM_(debtPayment.fecha)}` +
            `Deudor: ${String(debtPayment.deudor)}` +
            `Moneda: ${String(debtPayment.moneda)}` +
            `Monto: ${fmtMoney_(debtPayment.moneda, debtPayment.monto)}`
        ].join("\n")
    }
}