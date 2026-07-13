# DEPOSIT_ENGINE_AUDIT.md

## Result

PASS — Phase 7.1 deposit engine is implemented and covered by automated tests.

## Checklist

| Item | Status | Evidence |
| --- | --- | --- |
| Deposit Intent | PASS | `DepositEngineService.createDepositIntent` |
| Deposit Creation | PASS | Customer `POST /api/customer/deposits` |
| Reference Generation | PASS | `USWDEP-{userPrefix}-{uuid}` |
| Deposit Repository | PASS | `PaymentRepository` deposit methods |
| Application Service | PASS | `src/application/payments/deposit-engine-service.ts` |
| API Routes | PASS | Customer + admin deposit routes |
| Validation | PASS | Zod schemas; verified active customer required |
| State Machine | PASS | `deposit-state-machine.ts` + tests |
| Paystack Initialize | PASS | `PaystackPaymentProvider.initializeDeposit` |
| Webhook Verification | PASS | Raw body + HMAC before trust |
| HMAC SHA512 | PASS | Constant-time compare in provider |
| Replay Protection | PASS | `(provider, provider_event_id)` uniqueness + payload hash conflict handling |
| Duplicate Protection | PASS | Processed/ignored short-circuit; confirmation idempotency |
| Idempotency | PASS | Customer `Idempotency-Key`; ledger keys per posting rules |
| Deposit Approval | PASS | Provider confirm + admin approve path |
| Ledger Posting | PASS | `deposit_confirmation` / `deposit_reversal` |
| Audit Events | PASS | Customer/system/admin audits |
| Notification Events | PASS | Outbox + in-app notifications |
| Email Events | PASS | Outbox-enqueued emails |
| Transaction Boundaries | PASS | Confirm/fail/cancel/reverse in DB transactions with locks |
| Repository Boundaries | PASS | Routes remain thin wrappers |
| Recovery | PASS | `recoverProviderEvents` |
| Retry Handling | PASS | Certified backoff schedule |
| Dead Letter Handling | PASS | Max attempts → dead letter + admin alert outbox |

## Known Certified Limits

- KYC provider webhooks are out of Phase 7 scope; eligibility currently requires verified email + active customer account.
- Deposit UI redesign is intentionally excluded.
