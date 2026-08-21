# PROJECT_CONTEXT.md — SheetsBot

## What this project is

SheetsBot is a personal finance bot that receives Telegram commands and stores/manages data in Google Sheets.

The codebase has been progressively refactored from large procedural Google Apps Script files into clearer layers such as:

- parsers
- validators
- flows
- services
- repositories
- formatters
- policies/calculators
- command routing

The refactor is incremental, so legacy functions/adapters may coexist with newer components.

## Main functional areas

### Expenses

Supports standard expenses and quicker input formats.

Important concepts include:

- date
- amount
- currency
- category
- payment method
- saving/discount
- reimbursement/refund state
- own vs `Ajeno`
- associated debtor where applicable

### Income

Similar structured parsing/validation exists for income records.

Categories may be referenced from both expenses and incomes.

### Credit-card expenses

Credit-card expenses may create:

- expense records,
- installment records,
- card-debt relationships,
- `Gasto ID` links.

Be careful not to apply savings/discounts twice across the expense and installment/debt layers.

### Cards and statements

The `RESUMEN` / card-statement functionality determines which purchases/installments belong to the current or future statement based on card dates.

The project has discussed separating this area into repository/service/policy/calculator/formatter/command responsibilities.

### Debts and debtors

There are concepts for:

- debts,
- debtors,
- payment of debts,
- selecting a debt,
- recording a payment,
- updating pending debt,
- `Ajeno` expenses.

A recent architectural goal is keeping payment persistence/business rules in `DebtPaymentService.applyPayment()` and Telegram messaging in the caller flow.

### Categories

The category flow supports:

- listing categories,
- adding categories,
- renaming,
- deleting,
- replacing references when deleting a category in use.

Expected deletion behavior:

- `"Ajeno"` cannot be deleted.
- unused category → delete directly;
- used category → require another category as replacement;
- replacement updates both Expenses and Incomes;
- same category cannot replace itself;
- invalid selection should permit retry.

### Reminders

Reminder types have included:

- Weekly
- Monthly
- EveryNDays
- OnceDate
- MultipleWeekly

There have historically been regression tests around creating reminders from the bot and formatting their type correctly.

### Reimbursements

Known rule corrections included:

- filter based on reimbursement/debt type as appropriate,
- require saving/reimbursement amount > 0 where relevant.

## Main refactor direction

A recurring design objective is:

```text
Telegram update
   ↓
Parser / router
   ↓
Flow / command
   ↓
Validator
   ↓
Service
   ↓
Repository
   ↓
Google Sheets
```

Responses travel back through the Flow/Command and Formatter to Telegram.

Business/domain services should not send Telegram directly.

## Main.js refactor

A prior phase introduced or discussed:

- `doPost`
- `parseTelegramUpdate_`
- `isAuthorized_`
- `handleIncomingUpdate_`
- `handleLegacyState_`

`CANCELAR` was centralized.

When working in this area, inspect the current implementation before introducing additional routing/state abstractions.

## Selection helpers

Category and other flows have used concepts such as:

- `sendNumberedSelectionList()` — numbered list with special choices such as `NUEVA` / `CANCELAR`
- `sendSelectionList()` — numbered selection only

Preserve caller expectations when refactoring these helpers.

## Testing environment

The test stack uses:

- Vitest
- FakeSpreadsheet / fake Google Sheets environment

Historical test mistakes have included things such as:

- `lenght` instead of `length`
- comparing arrays incorrectly with `results == []`

Do not assume such historical bugs still exist; search first.

## Principle for Codex

The source code and passing tests are the current truth.

This documentation provides design intent and historical context, not permission to override current working behavior without evidence.
