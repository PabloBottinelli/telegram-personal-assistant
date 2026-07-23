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
            persona: debt.persona,
            moneda: debt.moneda || "ARS",
            monto: monto,
            montoPendiente: monto,
            detalle: debt.detalle || "-",
            estado: "Pendiente",
            gastoId: debt.gastoId || ""
        });

        return id;
    }
};