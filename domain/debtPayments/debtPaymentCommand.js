var DebtPaymentCommand = {
    handle(chatId, parts) {
        handleValidatedCommand_(chatId, parts, DebtPaymentParser, DebtPaymentValidator, (chatId, value) => {
            DebtPaymentService.startPaymentFlow(chatId, value);
        });
    },

    list(parts) {
        listPageWithFormat_(parts, SHEET_PAGOS_DEUDAS.name, DebtPaymentMapper, DebtPaymentFormatter)
    }
}