# START_HERE_FOR_CODEX.md

# SheetsBot handoff

You are receiving a repository that has been developed iteratively through many ChatGPT conversations.

Start by reading:

1. `AGENTS.md`
2. `PROJECT_CONTEXT.md`
3. `PENDING_WORK.md`

Then inspect the actual repository.

## Important

`PENDING_WORK.md` contains tasks reconstructed from development chats.

It is possible that an older pending item was already implemented later.

Therefore:

**Do not assume a chat TODO is still pending just because it is listed.**

For each item:

1. search the current code,
2. inspect related tests,
3. run relevant tests,
4. compare current behavior with the stated intent,
5. either:
   - implement the missing change, or
   - mark the item as already resolved / obsolete.

## First target

The most recent unfinished work was the architecture step involving:

`DebtPaymentService.applyPayment()`

The desired rule is:

> Services do not send Telegram messages.

Start by checking whether `DebtPaymentService.applyPayment()` still calls Telegram directly and finish that refactor without changing debt-payment behavior.

After that, check the related callers/tests and then continue with `PENDING_WORK.md` in priority order.
