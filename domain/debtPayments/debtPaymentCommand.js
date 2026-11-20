var DebtPaymentCommand = {
    handle(chatId, parts) {
        handleValidatedCommand_(chatId, parts, DebtPaymentParser, DebtPaymentValidator, (chatId, value) => {
            DebtPaymentService.startPaymentFlow(chatId, value);
        });
    },

    list(parts) {
        const pageNumber = parts[1] ? validatePositiveNumber(parts[1]) : 1
        const debtPayments = listSheetValuesByPage_(SHEET_PAGOS_DEUDAS.name, DebtPaymentMapper, pageNumber, 10)
        const msg = DebtPaymentFormatter.formatDebtPaymentList(debtPayments, pageNumber)
        sendTelegram(msg)
    }
}