 var DebtPaymentValidator = {
    validate(input) {
        const errors = [];

        const debtPayment = {
            monto: validateAmountInput(input.monto, errors),
        };

        if (errors.length > 0) {
            return {
                ok: false,
                errors
            };
        }

        return {
            ok: true,
            value: debtPayment
        };
    }
};