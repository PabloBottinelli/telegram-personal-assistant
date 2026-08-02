 var DebtValidator = {
    validate(input) {
        const errors = [];

        const debt = {
            monto: validateAmountInput(input.monto, errors),
            moneda: validateCoinInput(input.moneda, errors),
            detalle: validateDetailInput(input.detalle, errors),
        };

        if (errors.length > 0) {
            return {
                ok: false,
                errors
            };
        }

        return {
            ok: true,
            value: debt
        };
    }
};