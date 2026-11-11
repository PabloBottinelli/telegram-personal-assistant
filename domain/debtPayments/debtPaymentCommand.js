var DebtPaymentCommand = {
    handle(chatId, parts) {
        handleValidatedCommand_(chatId, parts, DebtPaymentParser, DebtPaymentValidator, (chatId, value) => {
            DebtPaymentService.startPaymentFlow(chatId, value);
        });
    }
}