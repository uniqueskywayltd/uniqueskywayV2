# PAYMENT_ARCHITECTURE.md

## Purpose

This document is the constitution for Unique Sky Way V2 money movement.

It defines how deposits, withdrawals, provider events, ledger postings, approvals, retries, notifications, and audits must behave before Phase 7 implementation begins.

It does not implement money movement.
It does not choose a payment provider.
It does not define UI layout.

## Authority

Payment implementation must comply with:

- `FINANCIAL_INVARIANTS.md`
- `LEDGER_POSTING_RULES.md`
- `DATABASE.md`
- `API_SPEC.md`
- `SECURITY.md`
- `EMAIL_SYSTEM.md`
- `NOTIFICATION_SYSTEM.md`
- `FINANCIAL_TEST_MATRIX.md`
- `GLOSSARY.md`

If this document conflicts with `FINANCIAL_INVARIANTS.md`, the invariants win and this document must be corrected before implementation continues.

## Phase 7 Scope

Phase 7 may implement only Money Movement:

- Deposit intent lifecycle.
- Payment provider adapter boundary.
- Provider webhook verification and ingestion.
- Deposit confirmation.
- Deposit failure, cancellation, and reversal handling.
- Withdrawal request lifecycle.
- Withdrawal reservation.
- Withdrawal approval and rejection.
- Withdrawal payout processing.
- Payout failure and cancellation handling.
- Ledger postings for deposits, withdrawals, releases, and reversals.
- Money movement audit events.
- Money movement email and notification events.
- Money movement reconciliation.

Phase 7 must not change:

- ROI formulas.
- New York settlement rules.
- Investment maturity rules.
- Investment plan snapshot rules.
- Certified investment engine state transitions.
- Customer dashboard redesign.
- Admin portal redesign beyond the minimum review surfaces required for money movement.
- Referral qualification or commission logic.

## Investment Engine Lock

The investment engine certified in `v2.1.0` is locked.

Allowed changes:

- Bug fixes.
- Security fixes.
- Performance improvements.
- Test-only improvements.
- Documentation clarifications that do not change behavior.

Forbidden without ADR, regression tests, and recertification:

- ROI formula changes.
- Settlement date rule changes.
- Residual rounding policy changes.
- Maturity rule changes.
- Principal lock or unlock rule changes.
- Investment lifecycle status changes.
- Ledger posting changes for investment funding, ROI settlement, or maturity release.

Money movement may call certified investment services only through approved application service contracts. It must not modify investment internals.

## Provider Policy

No payment provider is approved for production at this checkpoint.

Phase 7 must choose the first concrete provider through an accepted decision record before provider-specific production code merges.

Approved provider classes:

| Provider Class | Purpose | Production Status |
| --- | --- | --- |
| Deposit intent provider | Creates customer deposit instructions or hosted payment sessions. | Requires ADR |
| Payment webhook provider | Sends deposit confirmation, failure, reversal, or correction events. | Requires ADR |
| Payout provider | Sends withdrawals to approved customer destinations. | Requires ADR |
| Development test provider | Local and test-only deterministic provider simulation. | Allowed outside production only |

Provider selection must define:

- Provider name used in persisted records.
- Supported currencies.
- Supported countries or regions.
- Deposit methods.
- Withdrawal methods.
- Webhook signature algorithm.
- Event ID semantics.
- Retry behavior.
- Reversal and chargeback semantics.
- Settlement timing.
- Operational dashboard access.
- Secret storage requirements.
- Reconciliation exports or APIs.

The placeholder provider value `tbd` is allowed in architecture examples only. It must not be accepted in production requests.

## Currency Policy

Initial Phase 7 implementation should support USD only unless a currency expansion ADR is accepted.

Adding a currency requires:

- Currency minor-unit definition.
- Provider support confirmation.
- Ledger account coverage.
- Formatting rules.
- Deposit, withdrawal, reversal, and reconciliation tests.
- Admin review and reporting coverage.

## Deposit State Machine

Persisted deposit statuses must use the approved `deposit_status` values:

- `created`
- `pending`
- `confirmed`
- `failed`
- `cancelled`
- `reversed`

Allowed transitions:

| From | To | Trigger | Ledger Effect |
| --- | --- | --- | --- |
| none | `created` | Customer creates deposit intent. | None |
| `created` | `pending` | Provider accepts or awaits customer/provider action. | None |
| `created` | `cancelled` | Customer or system cancels before provider confirmation. | None |
| `pending` | `confirmed` | Verified provider confirmation and platform validation. | `deposit_confirmation` |
| `pending` | `failed` | Provider reports failure or intent expires. | None |
| `pending` | `cancelled` | Customer, provider, or system cancels before confirmation. | None |
| `confirmed` | `reversed` | Provider reversal, chargeback, correction, or confirmed failed settlement. | `deposit_reversal` |

Forbidden transitions:

- Any transition from `failed` to `confirmed` without a new deposit intent.
- Any transition from `cancelled` to `confirmed`.
- Any transition from `reversed` to `confirmed`.
- Any transition that credits available funds before provider confirmation.

## Deposit Ledger Sequence

Deposit creation does not create available balance.

Required confirmation sequence:

1. Verify webhook signature or trusted provider confirmation source.
2. Store provider event using `(provider, provider_event_id)` uniqueness.
3. Validate provider amount, currency, customer mapping, and intent state.
4. Start a database transaction.
5. Lock the deposit intent and affected wallet/account rows.
6. Mark the deposit as `confirmed`.
7. Post a balanced `deposit_confirmation` ledger transaction.
8. Update wallet projections from the ledger posting.
9. Create post-commit outbox events.
10. Commit.

Deposit reversal sequence:

1. Verify provider reversal event.
2. Store and deduplicate provider event.
3. Validate original confirmed deposit.
4. Start a database transaction.
5. Lock the deposit intent and affected wallet/account rows.
6. Mark the deposit as `reversed`.
7. Post a compensating `deposit_reversal` ledger transaction.
8. Update wallet projections from the ledger posting.
9. Create post-commit outbox events and admin alerts.
10. Commit.

Reversal handling must never delete, rewrite, or mutate the original confirmation ledger transaction.

## Withdrawal State Machine

Persisted withdrawal statuses must use the approved `withdrawal_status` values:

- `requested`
- `reserved`
- `under_review`
- `approved`
- `processing`
- `paid`
- `rejected`
- `failed`
- `cancelled`

Allowed transitions:

| From | To | Trigger | Ledger Effect |
| --- | --- | --- | --- |
| none | `requested` | Customer requests withdrawal. | None |
| `requested` | `reserved` | Available balance is reserved. | `withdrawal_reservation` |
| `reserved` | `under_review` | Risk, compliance, or amount requires manual review. | None |
| `reserved` | `approved` | Automated approval passes. | None |
| `under_review` | `approved` | Finance admin approves with reason. | None |
| `under_review` | `rejected` | Finance admin rejects with reason. | `withdrawal_release` |
| `reserved` | `cancelled` | Customer or system cancels before approval. | `withdrawal_release` |
| `approved` | `processing` | Payout request is sent to provider. | None |
| `processing` | `paid` | Provider confirms payout completion. | `withdrawal_payment` |
| `processing` | `failed` | Provider confirms payout failure. | `withdrawal_release` |

Forbidden transitions:

- Any withdrawal from locked principal.
- Any withdrawal from pending deposit funds.
- Any withdrawal from live earnings or unposted ROI.
- `requested` directly to `paid`.
- `approved` directly to `paid` without provider processing evidence.
- `rejected`, `failed`, or `cancelled` back to `paid`.
- More than one payout for the same withdrawal.

## Withdrawal Ledger Sequence

Withdrawal request sequence:

1. Validate authenticated customer and step-up authentication when required.
2. Validate amount, currency, destination, account status, risk status, and withdrawal limits.
3. Require an `Idempotency-Key`.
4. Start a database transaction.
5. Lock wallet and account rows for the customer and currency.
6. Confirm available balance excludes pending deposits, locked principal, reserved funds, live earnings, and unposted ROI.
7. Create the withdrawal request.
8. Post `withdrawal_reservation` moving funds from available cash to reserved withdrawal.
9. Update wallet projections from the ledger posting.
10. Create audit and outbox events.
11. Commit.

Withdrawal payout sequence:

1. Confirm withdrawal is approved and reserved.
2. Send payout request using provider adapter idempotency key.
3. Store provider payout reference.
4. On verified provider completion, start a transaction.
5. Lock the withdrawal and affected wallet/account rows.
6. Mark withdrawal as `paid`.
7. Post `withdrawal_payment` moving reserved funds to withdrawn/provider clearing.
8. Update wallet projections from the ledger posting.
9. Create audit and outbox events.
10. Commit.

Withdrawal rejection, cancellation, or payout failure sequence:

1. Verify the withdrawal is reserved and not paid.
2. Start a database transaction.
3. Lock the withdrawal and affected wallet/account rows.
4. Mark withdrawal as `rejected`, `cancelled`, or `failed`.
5. Post `withdrawal_release` moving reserved funds back to available cash.
6. Update wallet projections from the ledger posting.
7. Create audit and outbox events.
8. Commit.

## Webhook Lifecycle

Webhook endpoints must be server-side only.

Required order:

1. Read raw request body.
2. Verify provider signature before trusting payload fields.
3. Reject invalid signatures.
4. Extract provider event ID and event type.
5. Store provider event with `(provider, provider_event_id)` uniqueness.
6. Return success for already processed duplicate events.
7. Process new events through the payment application service.
8. Mark provider event `processed`, `failed`, or `ignored`.
9. Emit post-commit outbox events for notifications and admin visibility.

Provider webhook payloads are evidence, not source of truth.

The platform ledger remains authoritative.

## Provider Event Statuses

Persisted provider event statuses must use the approved `payment_provider_event_status` values:

- `received`
- `processing`
- `processed`
- `failed`
- `ignored`

`ignored` is allowed only for verified events that are irrelevant, stale, unsupported, or already represented by a more authoritative event.

Invalid signatures must not be stored as trusted provider events. They should be audit/security events instead.

## Idempotency Rules

Idempotency is mandatory for:

- Deposit intent creation.
- Deposit confirmation.
- Deposit reversal.
- Withdrawal request.
- Withdrawal reservation.
- Withdrawal approval.
- Withdrawal rejection.
- Payout creation.
- Payout completion.
- Payout failure.
- Provider webhook processing.
- Email and notification side effects.

Required idempotency sources:

| Workflow | Idempotency Source |
| --- | --- |
| Customer deposit creation | `Idempotency-Key` header |
| Provider deposit confirmation | `(provider, provider_event_id)` plus provider intent ID |
| Provider reversal | `(provider, provider_event_id)` plus original provider reference |
| Customer withdrawal request | `Idempotency-Key` header |
| Admin withdrawal decision | Admin action idempotency key plus withdrawal ID |
| Provider payout | Provider payout idempotency key plus withdrawal ID |
| Provider payout webhook | `(provider, provider_event_id)` |
| Email/notification | Outbox event ID and notification idempotency key |

Idempotency must be enforced by application services and database uniqueness.

## Approval Rules

Customer permissions:

- Create own deposit intent.
- View own deposit history.
- Create own withdrawal request.
- View own withdrawal history.
- Cancel eligible own withdrawal before payout processing.

Customer restrictions:

- Email must be verified before financial actions.
- Account must be active.
- Customer profile, onboarding, KYC, and risk state must satisfy Phase 7 eligibility rules.
- Step-up authentication is required for sensitive withdrawal actions when configured.

Admin permissions:

- `admin.deposit.read`: view deposit queue.
- `admin.deposit.review`: review flagged deposits.
- `admin.withdrawal.read`: view withdrawal queue.
- `admin.withdrawal.approve`: approve eligible withdrawals.
- `admin.withdrawal.reject`: reject withdrawals with reason.
- `admin.payment.reconcile`: view and act on reconciliation exceptions.
- `admin.audit.read`: inspect money movement audit events.

Admin restrictions:

- Admins may not edit ledger entries.
- Admins may not manually change wallet balances.
- Admins may not bypass domain services.
- Admin financial actions require a reason.
- High-risk actions require step-up authentication.
- Provider dashboard actions must be mirrored by platform records and reconciliation.

## Failure And Recovery

Every money movement workflow must be restartable.

Failure policy:

- Request failure before transaction commit leaves no financial mutation.
- Failure after provider side effect but before platform commit must be recoverable through webhook or reconciliation.
- Failure after platform commit but before email dispatch must not roll back financial state.
- Failed provider events must preserve error details and be retryable by operations.
- Dead-lettered events require admin visibility and runbook steps.

Retry policy:

- Retry only idempotent operations.
- Backoff must be bounded and observable.
- Retried provider requests must reuse the same provider idempotency key.
- Retried database workflows must preserve the same platform idempotency key.
- Reconciliation must detect missing, duplicated, delayed, and reversed provider movements.

## Reconciliation

Money movement reconciliation must compare:

- Deposit intents.
- Withdrawal requests.
- Provider events.
- Provider settlement reports or APIs.
- Ledger transactions.
- Wallet projections.

Reconciliation may identify exceptions, but it must not rewrite ledger history.

Corrections require compensating ledger entries and audit records.

## Audit Events

Audit events are required for:

- Deposit intent created.
- Deposit provider action generated.
- Deposit confirmed.
- Deposit failed.
- Deposit cancelled.
- Deposit reversed.
- Provider event received.
- Provider event ignored.
- Provider event failed.
- Withdrawal requested.
- Withdrawal reserved.
- Withdrawal entered review.
- Withdrawal approved.
- Withdrawal rejected.
- Withdrawal cancelled.
- Withdrawal payout sent.
- Withdrawal paid.
- Withdrawal failed.
- Reconciliation exception created.
- Admin payment action performed.

Audit records must include actor, actor type, target, action, timestamp, idempotency key, reason when applicable, and provider reference when applicable.

## Email Events

Money movement emails must be emitted through the transactional outbox.

Required customer emails:

- Deposit initiated.
- Deposit confirmed.
- Deposit failed.
- Deposit reversed.
- Withdrawal requested.
- Withdrawal approved.
- Withdrawal processing.
- Withdrawal paid.
- Withdrawal rejected.
- Withdrawal failed.
- Withdrawal cancelled.

Required admin emails:

- Deposit requires review.
- Deposit reversal detected.
- Provider event processing failed after retries.
- Withdrawal requires review.
- Withdrawal payout failed.
- Reconciliation exception detected.

Email failure must not roll back financial state.

## Notification Events

In-app notifications are required for customer-visible money movement status changes.

Notification events must be idempotent and generated from committed domain events.

Future SMS and push channels may subscribe to the same events, but must not become required for financial correctness.

## Testing Requirements

Phase 7 cannot be certified without:

- Deposit state-machine tests.
- Withdrawal state-machine tests.
- Ledger posting tests for confirmation, reversal, reservation, payment, and release.
- Provider webhook signature tests.
- Provider webhook duplicate-delivery tests.
- Provider event replay tests.
- Idempotency tests for all retryable commands.
- Transaction rollback tests.
- Provider-side-effect recovery tests.
- Reconciliation tests.
- Admin permission tests.
- Customer permission tests.
- Email and notification outbox tests.
- E2E tests for customer deposit and withdrawal flows.
- Security tests for webhook secrets, signature verification, and admin step-up actions.

## Launch Gate

Money movement cannot merge into `main` unless:

- A concrete provider ADR is accepted.
- Provider secrets are documented in environment configuration.
- Webhook verification is implemented and tested.
- Deposit and withdrawal state machines match this document.
- All ledger postings balance.
- Reversals use compensating entries.
- Duplicate provider events are idempotent.
- Withdrawals reserve only available balance.
- Admin actions are permission-gated and audited.
- Email and notification side effects are outbox-driven.
- Reconciliation coverage exists.
- Full verification passes.

## Maintenance Rules

- Any new provider requires an ADR.
- Any new payment status requires an ADR, schema migration, API update, and tests.
- Any new ledger transaction type requires an ADR and financial certification update.
- Any payment incident must add a regression row to `FINANCIAL_TEST_MATRIX.md`.
- Provider behavior discovered during integration must update this document before code relies on it.
