var CardStatementService = {
    build(card, closeDate) {
        const cardName = String(card.nombre || "").trim();
        const debts = CreditCardExpenseRepository.list();

        const cardDebts = debts.filter(debt =>
            CardStatementPolicy.belongsToCard(debt, cardName)
        );

        if (cardDebts.length === 0) {
            return {
                card,
                closeDate,
                items: [],
                totals: CardStatementCalculator.emptyTotals(),
                futureTotals: CardStatementCalculator.emptyTotals(),
                warnings: [],
                hasCardDebts: false
            };
        }

        const expensesById = ExpenseRepository.mapById();
        const items = [];
        const validEntries = [];
        const warnings = [];

        for (const debt of cardDebts) {
            const expenseId = String(debt.gastoId || "").trim();

            if (!expenseId) {
                warnings.push({
                    type: "MISSING_EXPENSE_ID",
                    cardName,
                    date: debt.fecha,
                    detail: debt.detalle
                });

                continue;
            }

            const expense = expensesById.get(expenseId);

            if (!expense) {
                warnings.push({
                    type: "EXPENSE_NOT_FOUND",
                    cardName,
                    expenseId,
                    detail: debt.detalle
                });

                continue;
            }

            validEntries.push({
                debt,
                expense
            });

            if (CardStatementPolicy.belongsToStatement(debt, cardName, closeDate)) {
                items.push(CardStatementCalculator.buildItem(debt, expense));
            }
        }

        return {
            card,
            closeDate,
            items,
            totals: CardStatementCalculator.calculateTotals(items),
            futureTotals: CardStatementCalculator.calculateFutureTotals(
                validEntries,
                cardName,
                closeDate
            ),
            warnings,
            hasCardDebts: true
        };
    },

    buildAll() {
        const cards = CreditCardRepository.list();
        const results = [];

        for (const card of cards) {
            const cardName = String(card.nombre || "").trim();

            if (!cardName) continue;

            const closeDate = CardStatementPolicy.selectCloseDate(card);

            if (!(closeDate instanceof Date)) {
                results.push({
                    card,
                    error: "CLOSE_DATE_NOT_FOUND"
                });

                continue;
            }

            results.push(CardStatementService.build(card, closeDate));
        }

        return results;
    },

    updateRemainingInstallments(cardName, closeDate) {
        const debts = CreditCardExpenseRepository.list();
        let changed = false;

        for (const debt of debts) {
            if (!CardStatementPolicy.belongsToStatement(debt, cardName, closeDate)) continue;

            const remainingInstallments = Number(debt.cuotasRestantes);
            const updated = CreditCardExpenseRepository.updateRemainingQuotas(debt.id, remainingInstallments - 1);

            if (updated) changed = true;
        }

        return changed;
    }
};