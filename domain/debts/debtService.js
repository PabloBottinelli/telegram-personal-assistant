var DebtService = {
    startCreateFlow(chatId, debt) {
        saveState_(chatId, {
            flow: "CREATE_DEBT",
            step: "WAITING_DEBTOR",
            data: debt,
            timestamp: Date.now()
        });

        DebtorCommand.sendSelectionList();
    },

    create(debt) {
        const id = generateId_("DEU");
        const monto = nOrZero_(debt.monto);

        DebtRepository.append({
            id: id,
            fecha: debt.fecha || todayNoon_(),
            deudor: debt.deudor,
            moneda: debt.moneda || "ARS",
            monto: monto,
            montoPendiente: monto,
            detalle: debt.detalle || "-",
            estado: "Pendiente",
            gastoId: debt.gastoId || ""
        });

        return id;
    },

    groupPendingByDebtorAndCurrency(debts) {
        const groups = {};

        debts.forEach(d => {
            const deudor = String(d.deudor || d.persona || "-").trim();
            const moneda = String(d.moneda || "ARS").trim().toUpperCase();
            const key = deudor + "|" + moneda;

            if (!groups[key]) {
                groups[key] = {
                    deudor,
                    moneda,
                    total: 0,
                    debts: []
                };
            }

            const pendiente = nOrZero_(d.montoPendiente);

            groups[key].total += pendiente;
            groups[key].debts.push(d);
        });

        return Object.values(groups);
    }
};