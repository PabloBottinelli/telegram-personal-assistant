# PENDING_WORK.md — Backlog reconstructed from project chats

This file is intentionally a **working backlog**, not a guaranteed statement of the current source tree.

For every item, Codex must first inspect the current implementation and tests. If already solved, mark it resolved instead of reimplementing it.

Priority is based mainly on how recently the item appeared in development conversations.

---

## P0 — Most recent / verify first

### 1. Finish architecture cleanup for `DebtPaymentService.applyPayment()`

**Latest known state:** discussed on 2026-08-21.

Goal:

- `DebtPaymentService.applyPayment()` must not send Telegram messages.
- It should only perform validation/business logic/persistence and return structured data.
- The Flow/Command that invoked the service should decide what Telegram message to send.

Check for:

- `sendTelegram()` inside `DebtPaymentService`,
- Telegram-specific text construction inside the service,
- tests that expect Telegram side effects from the service,
- callers that need to send the returned result themselves.

Expected implementation direction:

```text
Debt payment Flow
    ↓
DebtPaymentService.applyPayment(...)
    ↓
DebtPaymentRepository.append(...)
DebtRepository.updatePendingAmount(...)
    ↓
return result
    ↓
Flow formats/sends Telegram response
```

Add/update unit and regression tests so this responsibility split is enforced.

### 2. Apply the same responsibility rule to `sendCardDates`

Recent review identified that `sendCardDates` mixes functionality that may belong in another layer.

Inspect whether it:

- reads sheets directly,
- calculates card-domain state,
- formats output,
- sends Telegram,

all in one function.

Refactor toward:

- repository/service for data/business behavior,
- formatter for output,
- command/flow for Telegram send.

Do not change externally visible behavior unless tests demonstrate a bug.

### 3. Review naming/layer inconsistencies across the current repository

A review around 2026-08-10 flagged inconsistent naming and functions living in questionable layers.

Known theme:

- normalize `categorie` vs `category` naming where safe,
- prefer `CategoryService`-style naming,
- identify functions that should move between Flow / Service / Repository / Formatter.

Before renaming anything, search all production/test references.

Do this incrementally. Avoid a repository-wide rename mixed with behavior changes.

---

## P1 — Category deletion flow

Verify that the following tests exist and pass:

- `Se puede eliminar una categoría reemplazándola por otra`
- `Al eliminar una categoría se actualizan los gastos que la usaban`
- `Al eliminar una categoría se actualizan los ingresos que la usaban`
- `No se puede usar como reemplazo la misma categoría que se elimina`
- `Una selección de reemplazo inválida permite reintentar`
- `No se puede eliminar la categoría Ajeno`

Also verify the requested behavior:

### Unused category

If a category has never been referenced by either expenses or incomes:

- delete it directly,
- do not force selection of a replacement.

### Used category

If referenced:

- require replacement,
- update all relevant Expenses,
- update all relevant Incomes,
- prevent replacement by itself,
- allow retry after invalid selection.

Check state cleanup on success and on `CANCELAR`.

---

## P1 — Reminder regression failures

Historical evidence from a prior captured test run showed failures in:

- `crearRecordatorioSemanalDesdeBot`
- `crearRecordatorioMensualDesdeBot`

The tests expected output containing:

- `Tipo: Semanal`
- `Tipo: Mensual`

Inspect the current regression suite before changing anything.

If these are still failing:

1. determine whether the production formatter or test expectation is wrong,
2. preserve the intended user-visible reminder type,
3. add/fix focused tests.

---

## P1 — Card statement correctness and regression coverage

A number of card-statement issues were discussed. Some may already be solved.

Verify behavior/tests for:

### Closing-date selection

- last due date not passed → use last closing;
- due date passed → use next closing;
- non-determinable closing date → clear notice per card.

### Inclusion policy

Test `belongsToFutureStatement(...)` and related logic with:

- date before/equal/after closing,
- `cuotasRestantes == 1`,
- multiple remaining installments,
- wrong/missing card/payment method,
- invalid date.

### Totals

Verify:

- current vs future statement totals,
- own vs `Ajeno`,
- ARS vs USD / transaction currency,
- no double counting,
- agreed rounding behavior.

### Installments

Verify:

- displayed current installment number,
- no mutation merely from building/viewing a statement,
- old purchases,
- remaining installments,
- links through `Gasto ID`.

### Defensive cases

Tests were proposed for:

- card with no purchases,
- invalid card,
- invalid debt next to a valid one,
- deterministic clock/date handling in tests.

Do not add all of these blindly if equivalent coverage already exists.

---

## P2 — Card/credit-card architecture, historical refactor items

Older chats identified the following architecture work. Validate against current code.

Potentially pending:

- `CreditCardRepository.list()`
- complete repository abstraction for cards,
- ensure parser/validator/service/flow/repository pieces are loaded in Apps Script runtime,
- validator uses the actual input date (`input.fecha`) correctly,
- remove card business logic from legacy `cards.js` after migration,
- ensure `CreditCardExpenseService` correctly handles:
  - payment method,
  - `cuotasRestantes`,
  - `Gasto ID`,
  - debtor / `Ajeno`,
  - savings/reimbursements,
- separate card statement policy/calculator/service/formatter/command,
- avoid double application of discounts/savings.

### Cards maintenance trigger

Historical target:

- migrate maintenance logic toward `CreditCardRepository.moveExpiredCycles()` plus statement service/formatter,
- update installments only at the correct stage,
- stop using legacy `buildCardStatement_()` once the replacement path is proven.

Only remove compatibility functions after regression tests pass.

---

## P2 — Totals architecture

Historical refactor plan:

- add/verify `IncomeRepository.list()`,
- separate totals into something resembling:
  - Parser
  - Service
  - Calculator
  - Formatter
  - Command
- migrate `COMMANDS["TOTALES"]`,
- preserve the rule involving `monto - ahorro`,
- add unit tests,
- remove old `domain/summary/totals.js` or adapters only after regression coverage confirms equivalence.

Also verify the business definition of totals is consistent:
- gross amount,
- effective cost,
- reimbursements,
- consumption vs cash-flow semantics.

If current code already settled these definitions, document the current rule instead of reopening them.

---

## P2 — Debt flow / state cleanup

Older debt-flow work included:

- separate “create debt” from “pay debt” handlers,
- migrate `PAGO DEUDA` to a clearer flow/step/data structure,
- maintain legacy compatibility while migrating,
- avoid unnecessary global `statesReset()` behavior,
- correctly handle `esperandoDeudaParaPagar` and debtor-selection states.

The most recent `DebtPaymentService.applyPayment()` cleanup takes precedence over older architectural sketches.

---

## P3 — Older regression/test backlog

These items were raised earlier and may already be covered.

### Credit-card expense tests

Historical TODO areas:

- invalid date,
- invalid installments,
- invalid saving/discount,
- percentage/currency combinations,
- defaults in quick format,
- creating category/card/debtor from a flow,
- cancel and state cleanup,
- IDs and relational links,
- reimbursements,
- `Ajeno` combined with discount/reimbursement.

Search existing tests before adding duplicates.

### Parser / dates

Older concerns:

- comma decimal parsing,
- use real dates consistently,
- avoid locale/date ambiguity.

### Installment idempotency

Verify that repeated processing/building summaries does not incorrectly advance or duplicate installments.

### Reimbursements

Older rule checks:

- correct filtering by `R/D`,
- savings/reimbursement amount > 0,
- correct acceptance/rejection of `-` according to type.

---

## P4 — Longer-term ideas from older chats

These are not necessarily active implementation tasks and should NOT distract from current regressions/refactors.

Potential future work:

- declarative router,
- further `parse / validate / save` separation,
- repository completion,
- indexes/lookup by name,
- aliases and historical filters,
- richer shared/installment debt support,
- reminder pause/start,
- investments,
- broader CRUD/listing features,
- Telegram inline `/menu` with guided buttons.

Treat these as future ideas unless there is already unfinished code/tests for them.

---

# Recommended Codex execution order

1. Run current tests and record failures.
2. Inspect `DebtPaymentService.applyPayment()` and finish Telegram/service separation.
3. Inspect callers and add regression coverage.
4. Inspect `sendCardDates` for the same layering violation.
5. Run tests.
6. Verify category deletion tests/behavior.
7. Run tests.
8. Investigate any reminder regression failures that still exist.
9. Review cardStatement coverage and only add missing cases.
10. Review naming/layer inconsistencies.
11. Only then revisit older architectural TODOs.

# Definition of done for each backlog item

A task is done when:

- current implementation matches intended behavior,
- responsibilities belong to the correct layer,
- focused tests pass,
- regression tests pass,
- no duplicate implementation is left accidentally active,
- historical TODO is marked resolved/obsolete if the code had already fixed it.
