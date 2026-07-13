# LEDGER_POSTING_RULES.md

## Purpose

This document is the accounting specification for Unique Sky Way V2 ledger postings.

It defines which ledger accounts are debited and credited for each approved financial event, which references and idempotency keys are required, and which side effects must be emitted after commit.

It does not define UI, provider-specific payloads, or marketing language.

## Authority

Ledger implementation must comply with:

- `FINANCIAL_INVARIANTS.md`
- `PAYMENT_ARCHITECTURE.md`
- `WEBHOOK_SPECIFICATION.md`
- `DATABASE.md`
- `ROI_ENGINE.md`
- `EMAIL_SYSTEM.md`
- `NOTIFICATION_SYSTEM.md`
- `SECURITY.md`
- `FINANCIAL_TEST_MATRIX.md`

If this document conflicts with `FINANCIAL_INVARIANTS.md`, the invariants win and this document must be corrected before implementation continues.

## Posting Semantics

The V2 ledger balance view uses this sign convention:

- `credit` increases the target ledger account balance.
- `debit` decreases the target ledger account balance.
- Every ledger transaction must balance to zero per currency.
- Every entry amount must be a positive integer minor-unit amount.
- Negative amounts are forbidden.
- Ledger entries are immutable after commit.

This convention is already enforced by the database balance views and the certified Phase 6 ledger helpers.

## Account Types

Approved ledger account types:

| Account Type | Owner Type | Purpose |
| --- | --- | --- |
| `customer_pending_cash` | `user` | Customer funds not yet available. Reserved for future pending-deposit accounting. |
| `customer_available_cash` | `user` | Customer spendable wallet balance. |
| `customer_locked_principal` | `user` | Principal locked in active investments. |
| `customer_reserved_withdrawal` | `user` | Funds reserved for withdrawal. |
| `customer_withdrawn_cash` | `user` | Historical customer funds paid out. |
| `platform_cash` | `platform` | Platform cash or operating offset account. |
| `platform_roi_expense` | `platform` | Platform expense for ROI credits. |
| `platform_referral_expense` | `platform` | Platform expense for referral rewards. |
| `platform_rounding` | `platform` | Platform non-cash or cash rounding adjustments when explicitly approved. |
| `provider_cash_clearing` | `provider` | Provider-side clearing account for deposits, withdrawals, and external movement reconciliation. |

Adding a ledger account type requires an accepted ADR, schema migration, posting-rule update, and financial tests.

## Universal Posting Rules

Every ledger posting must:

- Execute inside a database transaction with its domain state change.
- Use one approved `ledger_transaction_type`.
- Include at least two ledger entries.
- Balance to zero per currency.
- Use whole minor units only.
- Use a stable idempotency key for retryable workflows.
- Include `reference_type` and `reference_id`.
- Include metadata sufficient for audit and reconciliation.
- Lock affected wallet/account/domain rows before consuming, reserving, releasing, or crediting customer funds.
- Emit side effects only through post-commit outbox events.

Repositories may persist ledger rows, but must not decide posting rules.

## Posting Matrix

| Event | Transaction Type | Debit | Credit | Reference | Idempotency Key |
| --- | --- | --- | --- | --- | --- |
| Deposit confirmed | `deposit_confirmation` | `provider_cash_clearing` | `customer_available_cash` | `deposit_intent` / deposit ID | `deposit_confirmation:{provider}:{provider_event_id}` |
| Deposit reversed | `deposit_reversal` | `customer_available_cash` | `provider_cash_clearing` | `deposit_intent` / deposit ID | `deposit_reversal:{provider}:{provider_event_id}` |
| Investment activated | `investment_funding` | `customer_available_cash` | `customer_locked_principal` | `investment` / investment ID | `investment_funding:{investment_id}` |
| Daily ROI settled | `roi_settlement` | `platform_roi_expense` | `customer_available_cash` | `settlement_item` / settlement item ID | `roi_settlement:{investment_id}:{earning_date}` |
| Maturity principal released | `maturity_principal_release` | `customer_locked_principal` | `customer_available_cash` | `investment` / investment ID | `maturity_principal_release:{investment_id}` |
| Withdrawal reserved | `withdrawal_reservation` | `customer_available_cash` | `customer_reserved_withdrawal` | `withdrawal_request` / withdrawal ID | `withdrawal_reservation:{withdrawal_id}` |
| Withdrawal paid | `withdrawal_payment` | `customer_reserved_withdrawal` | `customer_withdrawn_cash` | `withdrawal_request` / withdrawal ID | `withdrawal_payment:{withdrawal_id}:{provider_payout_reference}` |
| Withdrawal released | `withdrawal_release` | `customer_reserved_withdrawal` | `customer_available_cash` | `withdrawal_request` / withdrawal ID | `withdrawal_release:{withdrawal_id}:{release_reason}` |
| Referral reward posted | `referral_reward` | `platform_referral_expense` | `customer_available_cash` | `referral_reward` / referral reward ID | `referral_reward:{referral_reward_id}` |
| Ledger correction | `ledger_correction` | Case-specific approved account | Case-specific approved account | `ledger_correction` / correction ID | `ledger_correction:{correction_id}` |

## Event Rules

### Deposit Confirmed

Purpose:

- Credit confirmed external funds to customer available balance.

Posting:

- Debit provider `provider_cash_clearing`.
- Credit customer `customer_available_cash`.

Required domain state:

- Deposit intent moves to `confirmed`.
- Provider event is verified and deduplicated.
- Amount and currency match the deposit intent.

Side effects after commit:

- Audit: `deposit.confirmed`.
- Outbox event: `deposit.confirmed`.
- Customer notification: deposit confirmed.
- Customer email: deposit confirmed.

### Deposit Reversed

Purpose:

- Reverse a previously confirmed deposit through compensating entries.

Posting:

- Debit customer `customer_available_cash`.
- Credit provider `provider_cash_clearing`.

Required domain state:

- Deposit intent moves to `reversed`.
- Provider reversal event is verified and deduplicated.
- Original deposit confirmation exists.

Insufficient available balance:

- The posting must not create a negative available balance.
- If available balance is insufficient, the reversal must enter manual financial exception handling.
- Manual exception handling requires an approved correction workflow before production use.

Side effects after commit:

- Audit: `deposit.reversed`.
- Outbox event: `deposit.reversed`.
- Customer notification: deposit reversed.
- Customer email: deposit reversed.
- Admin notification: deposit reversal detected.

### Investment Activated

Purpose:

- Lock customer principal for an active investment.

Posting:

- Debit customer `customer_available_cash`.
- Credit customer `customer_locked_principal`.

Required domain state:

- Investment terms are snapshotted.
- Available balance is locked and sufficient.
- Investment moves to `active`.

Side effects after commit:

- Audit: `investment.activated`.
- Outbox event: `investment.activated`.

This posting is certified in `v2.1.0` and is locked by `DEC-0016`.

### Daily ROI Settled

Purpose:

- Credit settled ROI to customer available balance.

Posting:

- Debit platform `platform_roi_expense`.
- Credit customer `customer_available_cash`.

Required domain state:

- Settlement date is a completed New York earning date.
- Settlement item is unique for `(investment_id, earning_date)`.
- ROI ledger entry records calculation evidence.

Side effects after commit:

- Audit: `roi.settled`.
- Outbox event: `roi.settled`.
- Customer notification policy may aggregate daily ROI to avoid noisy messaging.

This posting is certified in `v2.1.0` and is locked by `DEC-0016`.

### Maturity Principal Released

Purpose:

- Return locked principal to available balance after final settlement.

Posting:

- Debit customer `customer_locked_principal`.
- Credit customer `customer_available_cash`.

Required domain state:

- Final eligible earning date has settled or been skipped by approved zero-amount policy.
- Investment maturity is idempotent.

Side effects after commit:

- Audit: `investment.matured`.
- Outbox event: `investment.matured`.
- Customer notification: investment matured.
- Customer email: investment matured.

This posting is certified in `v2.1.0` and is locked by `DEC-0016`.

### Withdrawal Reserved

Purpose:

- Move spendable customer funds out of available balance while withdrawal review or payout is pending.

Posting:

- Debit customer `customer_available_cash`.
- Credit customer `customer_reserved_withdrawal`.

Required domain state:

- Withdrawal request exists.
- Available balance is sufficient.
- Pending deposits, locked principal, live earnings, unposted ROI, and maturity projections are excluded.
- Withdrawal moves to `reserved` or `under_review`.

Side effects after commit:

- Audit: `withdrawal.reserved`.
- Outbox event: `withdrawal.reserved`.
- Customer notification: withdrawal requested.
- Customer email: withdrawal requested.

### Withdrawal Paid

Purpose:

- Mark reserved funds as paid out after verified provider completion.

Posting:

- Debit customer `customer_reserved_withdrawal`.
- Credit customer `customer_withdrawn_cash`.

Required domain state:

- Withdrawal is approved and processing.
- Provider payout completion is verified and deduplicated.
- Provider payout reference is stored.

Side effects after commit:

- Audit: `withdrawal.paid`.
- Outbox event: `withdrawal.paid`.
- Customer notification: withdrawal paid.
- Customer email: withdrawal paid.

Provider settlement and bank cash reconciliation may also use `provider_cash_clearing`, but Phase 7 must not add extra cash-movement postings without updating this document and tests.

### Withdrawal Released

Purpose:

- Return reserved funds to available balance after rejection, cancellation, expiry, or payout failure.

Posting:

- Debit customer `customer_reserved_withdrawal`.
- Credit customer `customer_available_cash`.

Required domain state:

- Withdrawal is reserved and not paid.
- Release reason is recorded.
- Admin rejection requires admin ID and reason.

Side effects after commit:

- Audit: `withdrawal.released`.
- Outbox event: `withdrawal.released`.
- Customer notification: withdrawal rejected, failed, or cancelled.
- Customer email: withdrawal rejected, failed, or cancelled.

### Referral Reward Posted

Purpose:

- Credit a qualified referral reward as platform expense.

Posting:

- Debit platform `platform_referral_expense`.
- Credit customer `customer_available_cash`.

Required domain state:

- Referral qualification is explicit.
- One reward per qualifying event.
- Reward is not funded from referred customer principal, ROI, or wallet balance.

Side effects after commit:

- Audit: `referral.reward_posted`.
- Outbox event: `referral.reward_posted`.
- Customer notification: referral reward credited.
- Customer email: referral reward credited.

Referral reward implementation is future scope unless explicitly included in a later phase.

### Ledger Correction

Purpose:

- Correct a financial mistake through compensating entries without rewriting history.

Posting:

- Case-specific debit and credit accounts approved by finance and engineering.

Required domain state:

- Correction record exists.
- Reason is recorded.
- Actor is authorized.
- Related original transaction is referenced.
- Correction is reviewed before posting.

Side effects after commit:

- Audit: `ledger.corrected`.
- Outbox event: `ledger.corrected`.
- Admin notification: ledger correction posted.

Ledger corrections are operationally sensitive and must not be implemented as a casual admin shortcut.

## Entry Ordering

Posting helpers should return entries in this order:

1. Debit entries.
2. Credit entries.

Entry order must not be used to determine correctness. Balance validation and account typing determine correctness.

## Metadata Requirements

Every ledger transaction metadata object must include:

- `calculationVersion` when calculation is involved.
- `source` such as `customer`, `admin`, `provider_webhook`, `settlement_job`, or `system`.
- `idempotencyKey`.
- Provider references when provider-driven.
- Admin reason when admin-driven.
- Relevant New York financial date when settlement-related.

Metadata must not contain secrets, raw provider signatures, full card or bank details, or sensitive authentication material.

## Idempotency Requirements

Ledger transaction idempotency keys must be deterministic.

They must include:

- Workflow name.
- Domain object ID or provider event ID.
- Financial date when date-specific.
- Release or reversal reason when multiple distinct compensations are possible.

Idempotency keys must not include random values for retryable workflows.

## Audit Requirements

Every ledger posting must have an associated audit event or be reconstructable from an audit-linked domain event.

Audit evidence must identify:

- Actor type.
- Actor ID when available.
- Domain object.
- Ledger transaction.
- Idempotency key.
- Reason when applicable.
- Provider reference when applicable.
- UTC commit timestamp.

## Email And Notification Rules

Emails and notifications are side effects.

They must:

- Be emitted through outbox events after the ledger transaction commits.
- Be idempotent.
- Never block the financial transaction on provider delivery.
- Never roll back a committed ledger transaction if delivery fails.

## Unsupported Postings

The following are forbidden until explicitly designed and certified:

- Direct wallet balance edits.
- Negative-balance deposits or withdrawals.
- Reversal postings that create customer deficits.
- Investment ROI corrections that rewrite settlement history.
- Provider dashboard adjustments without platform records.
- Cross-currency postings without per-currency balancing rules.
- Cash postings with sub-minor amounts.
- Any posting type not listed in this document.

## Testing Requirements

Every posting rule requires tests proving:

- Entries balance to zero.
- Amounts are positive minor units.
- Account types match the approved matrix.
- Wallet projection changes match expected balances.
- Idempotency prevents duplicate posting.
- Transaction rollback leaves no partial domain or ledger state.
- Audit, email, and notification events are emitted only after commit.

## Maintenance Rules

- New posting type: ADR required.
- New account type: ADR required.
- New reversal or correction behavior: ADR required.
- New provider settlement behavior: update this document and `PAYMENT_ARCHITECTURE.md`.
- Production financial incident: add a regression row to `FINANCIAL_TEST_MATRIX.md`.
