# WITHDRAWAL_ENGINE_AUDIT.md

## Result

PASS — Phase 7.2 withdrawal engine is implemented and covered by automated tests.

## Checklist

| Item | Status | Evidence |
| --- | --- | --- |
| Withdrawal Request | PASS | `WithdrawalEngineService.createWithdrawalRequest` |
| Validation | PASS | USD + `paystack_recipient` destination schema |
| Available Balance Check | PASS | Locked wallet + `availableBalanceMinor` comparison |
| Pending Withdrawal Rules | PASS | One open withdrawal per currency |
| Admin Review | PASS | All new withdrawals enter `under_review` |
| Approve | PASS | Finance admin gated approve route |
| Reject | PASS | Reject releases reserved funds via ledger |
| Queue | PASS | Admin queue initiates Paystack transfer |
| Ledger Posting | PASS | reservation / payment / release helpers |
| Audit Events | PASS | Admin + customer audits |
| Email | PASS | Outbox templates for request/approve/reject/paid/failed/cancelled |
| Notification | PASS | In-app + outbox events |
| Idempotency | PASS | Customer key + ledger posting keys |
| Recovery | PASS | Transfer webhook claim/retry/dead-letter path shared with deposits |

## State Machine

`requested → reserved → under_review → approved → processing → paid`

Release paths: `rejected`, `cancelled` (from `reserved`), `failed` (from `processing`).

## Known Certified Limits

- Customer cancel is allowed only from `reserved`, not from `under_review`.
- `transfer.reversed` does not auto-post ledger entries (DEC-0021).
