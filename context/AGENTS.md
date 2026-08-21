# AGENTS.md — SheetsBot

## Purpose

This repository contains **SheetsBot**, a Telegram bot implemented primarily in JavaScript / Google Apps Script and backed by Google Sheets.

When modifying the project, prefer preserving the existing architecture and regression behavior over introducing unrelated redesigns.

## Core architecture

Use these responsibilities consistently:

- **Flow / Command / Handler**
  - Owns Telegram interaction.
  - Sends messages to Telegram.
  - Manages conversational state and retries.
  - Converts user interaction into calls to services.

- **Service**
  - Owns business logic.
  - Coordinates repositories and domain calculations.
  - MUST NOT call Telegram functions such as `sendTelegram`.
  - Returns structured results that the Flow/Command formats or sends.

- **Repository**
  - Reads/writes Google Sheets.
  - Does not own Telegram interaction.
  - Avoid business rules that belong in services/policies.

- **Formatter**
  - Produces display strings.
  - Does not mutate business state.

- **Validator**
  - Validates and normalizes input.
  - Prefer the existing `*validator*` naming convention.

## Critical rule

**Services must not send Telegram messages.**

Example:

`DebtPaymentService.applyPayment()`

must:
- validate/apply the payment,
- persist payment data,
- update the debt,
- return a result,

and must NOT:
- call `sendTelegram()`,
- decide the final Telegram wording.

The caller Flow/Command owns that responsibility.

The same separation should be applied to other business/domain functions, including card-related functionality such as `sendCardDates` if it currently mixes business logic and Telegram output.

## Current domain concepts

Sheets / domains include:

- Gastos
- Ingresos
- Deudas Tarjeta
- Recordatorios
- Categorías
- Tarjetas
- Cuotas
- Deudores

Known ID prefixes:

- `GAS-`
- `ING-`
- `DT-`
- `TAR-`
- `CAT-`

`Deudas Tarjeta` includes a `Gasto ID` relation.

## Important behavior

### Categories

- Category `"Ajeno"` cannot be deleted.
- A category that is not used by any expense or income may be deleted without replacement.
- A category that is in use requires a replacement category.
- The replacement cannot be the same category being deleted.
- When replacing a category, both expenses and incomes that reference it must be updated.
- Invalid replacement selection should allow retrying instead of corrupting state.

### Card statement

Known behavior that should remain covered by tests:

- No cards: respond with `"No hay tarjetas cargadas."`
- If a closing date cannot be determined, report it for that card.
- If the last due date has not passed, use the last closing date.
- If it has passed, use the next closing date.
- Installments displayed should reflect the current installment, e.g. `(3/6) dd/mm · $X`.
- Future statement logic distinguishes own and third-party (`Ajeno`) expenses.
- Monetary totals should remain separated by currency where appropriate.

Known policy shape:

`belongsToFutureStatement(debt, cardName, closeDate)`

should validate the date and card/payment method relationship and treat a debt with:
- `fecha <= cierre`
- `cuotasRestantes == 1`

as not belonging to the future statement.

## Telegram commands

The project has used commands including:

- COMANDOS
- CATEGORIAS
- TARJETAS
- TOTALES
- REINTEGROS
- MARCAR REINTEGRADO
- FECHAS
- GASTO
- INGRESO
- TC
- RESUMEN
- DEUDA
- DEUDAS
- DEUDORES
- PAGO DEUDA

Do not silently break existing command aliases or regression behavior.

## Legacy conversational state

Legacy states have included:

- `esperandoReintegroIdx`
- `esperandoCategoria`
- `esperandoMetodo`
- `esperandoFecha`
- `esperandoTipoDeRecordatorio`
- `esperandoDiasSemana`
- `esperandoMultiples`
- `esperandoCadaNDias`
- `esperandoDiaMes`
- `esperandoFechaUnica`
- `esperandoHoraRecordatorio`
- `esperandoDeudaParaPagar`
- `esperandoDeudor`

`CANCELAR` was centralized during the main-flow refactor.

When touching state handling, do not add another parallel state system unless necessary.

## Validation

Validators have covered:

- date
- amount
- coin/currency
- payment method
- saving
- type (`D/R/-`)
- refunded (`Sí/No/-`)
- installments

Known error constants include:

- `FECHA_INVALIDA`
- `MONTO_INVALIDO`
- `MONEDA_INVALIDA`
- `METODO_INVALIDO`
- `AHORRO_INVALIDO`
- `PORCENTAJE_INVALIDO`
- `MONTO_BASE_INVALIDO`
- `TIPO_INVALIDO`
- `REFUND_INPUT_INVALIDO_1..5`
- `CUOTAS_INVALIDO`
- `DETALLE_VACIO`
- `NUMERO_INVALIDO`

## Tests

The project uses **Vitest** and a fake spreadsheet environment.

Before considering a change complete:

1. Run the relevant focused tests.
2. Run the regression suite.
3. Run the full test suite if practical.
4. Do not “fix” a failing test by weakening valid business behavior.
5. Add regression coverage for every bug/refactor completed.

Inspect `package.json` and the test directory to determine the exact available commands instead of assuming them.

## Working with PENDING_WORK.md

`PENDING_WORK.md` was reconstructed from prior development chats.

Important:
- Newer entries have priority over older ones.
- Some old TODOs may already be implemented.
- Do NOT blindly implement every historical item.
- For each task:
  1. inspect current code,
  2. inspect current tests,
  3. determine whether it is still pending,
  4. only then modify code.

When a historical TODO is already solved, mark it as verified/resolved rather than reimplementing it.

## Change style

Prefer:
- small changes,
- explicit responsibilities,
- tests before broad cleanup,
- compatibility with current sheet layouts,
- removing dead compatibility code only after regression tests prove it is safe.

Avoid:
- combining Telegram UI with business services,
- sweeping renames without updating all callers/tests,
- duplicated domain implementations,
- premature deletion of legacy adapters while they are still used.
