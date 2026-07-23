var DebtPaymentCommand = {
    handle(chatId, parts) {
        const input = DebtPaymentParser.parse(parts);
        const result = DebtPaymentValidator.validate(input);

        if (!result.ok) {
            sendTelegram(MSG_ERRORS.ERRORES_PREFIX + result.errors.join("\n"));
            return;
        }

        DebtPaymentService.startPaymentFlow(chatId, result.value);
    }
}