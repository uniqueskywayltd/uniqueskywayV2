# LEDGER_POSTING_AUDIT.md

## Result

PASS — Money-movement postings match `LEDGER_POSTING_RULES.md`.

## Posting Matrix

| Event | Type | Debit | Credit | Idempotency Key |
| --- | --- | --- | --- | --- |
| Deposit confirmed | `deposit_confirmation` | `provider_cash_clearing` | `customer_available_cash` | `deposit_confirmation:{provider}:{provider_event_id}` |
| Deposit reversed | `deposit_reversal` | `customer_available_cash` | `provider_cash_clearing` | `deposit_reversal:{provider}:{provider_event_id}` |
| Withdrawal reserved | `withdrawal_reservation` | `customer_available_cash` | `customer_reserved_withdrawal` | `withdrawal_reservation:{withdrawal_id}` |
| Withdrawal paid | `withdrawal_payment` | `customer_reserved_withdrawal` | `customer_withdrawn_cash` | `withdrawal_payment:{withdrawal_id}:{provider_payout_reference}` |
| Withdrawal released | `withdrawal_release` | `customer_reserved_withdrawal` | `customer_available_cash` | `withdrawal_release:{withdrawal_id}:{release_reason}` |

## Integrity Controls

- Domain state mutation and ledger posting occur in the same DB transaction.
- Wallet rows are locked before balance-sensitive postings.
- Deposit reversal refuses insufficient available balance instead of creating a negative balance.
- Side effects (email/notification) are outbox-driven after financial commit paths.
- Investment posting helpers remain untouched.
