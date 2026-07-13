# WEBHOOK_SPECIFICATION.md

## Purpose

This document is the constitution for external webhook events in Unique Sky Way V2.

It defines how provider webhooks are verified, stored, deduplicated, processed, retried, audited, and recovered before money movement implementation begins.

It does not implement webhooks.
It does not approve a provider for production by itself.
It does not define UI.

## Authority

Webhook implementation must comply with:

- `FINANCIAL_INVARIANTS.md`
- `PAYMENT_ARCHITECTURE.md`
- `LEDGER_POSTING_RULES.md`
- `SECURITY.md`
- `DATABASE.md`
- `API_SPEC.md`
- `EMAIL_SYSTEM.md`
- `NOTIFICATION_SYSTEM.md`
- `FINANCIAL_TEST_MATRIX.md`

If this document conflicts with `FINANCIAL_INVARIANTS.md`, the invariants win and this document must be corrected before implementation continues.

## Provider Scope

Phase 7 target provider:

- Paystack.

Future provider candidates:

- Flutterwave.
- Stripe.

Paystack is the Phase 7 target for webhook specification and test planning. Production provider code still requires an accepted provider ADR before merge, as required by `PAYMENT_ARCHITECTURE.md`.

Adding Flutterwave, Stripe, or any other provider requires:

- Provider ADR.
- Provider-specific signature appendix.
- Event catalog.
- Retry policy review.
- Reconciliation policy.
- Security review.
- Test matrix expansion.

## Endpoint Policy

Payment webhooks use:

```text
POST /api/webhooks/payments/:provider
```

Paystack uses:

```text
POST /api/webhooks/payments/paystack
```

Webhook endpoints are server-only.

They must not:

- Depend on customer browser state.
- Use customer sessions.
- Expose provider secrets.
- Trust payload fields before signature verification.
- Trigger financial side effects before durable idempotency checks.

## Paystack Signature Verification

Paystack sends the webhook signature in:

```text
x-paystack-signature
```

Paystack's documented signature scheme is:

```text
HMAC SHA512(event payload, Paystack secret key)
```

Verification rules:

- Read the raw request body before JSON parsing.
- Compute HMAC SHA512 over the exact received payload bytes.
- Use the Paystack secret key from server-only environment configuration.
- Compare the computed digest to `x-paystack-signature` with constant-time comparison.
- Reject missing signatures.
- Reject malformed signatures.
- Reject mismatched signatures.
- Do not parse or process the event until signature verification passes.

Secret rules:

- Paystack secret key must never be exposed to client code.
- Paystack secret key must not be logged.
- Failed verification logs must not include the secret or computed digest.

## Timestamp And Replay Policy

Some providers include a signed timestamp. Paystack's documented webhook signature scheme does not define a dedicated signed timestamp header at this checkpoint.

For providers with signed timestamps:

- Enforce a maximum replay window of five minutes.
- Reject timestamps too far in the future.
- Reject timestamps older than the accepted replay window.
- Allow a maximum clock skew of five minutes unless an ADR changes it.

For Paystack:

- Replay defense is based on signature verification, event identity, payload hash, provider transaction verification, and permanent idempotency records.
- Duplicate verified events must resolve to a 200 no-op.
- Same event identity with a different payload hash must be treated as a security and reconciliation exception.
- Old but previously unseen events must not automatically post ledger entries until provider state is verified.

## Raw Payload Policy

The system must preserve enough webhook evidence for audit and dispute review.

Required evidence:

- Provider name.
- Canonical provider event ID.
- Event type.
- Payload hash.
- Received timestamp.
- Processing status.
- Error message when failed.

Raw payload policy:

- Phase 7 should store the raw payload or a secure immutable raw payload reference.
- If full raw payload storage is not used, the provider event record must store a payload hash and sanitized event summary.
- Raw payload storage must not expose secrets, full card numbers, full bank details, or sensitive authentication material to ordinary admin views.

## Event Identity

Every webhook must derive one canonical provider event ID before processing.

For Paystack:

- Prefer a provider event identifier if Paystack supplies one.
- Otherwise derive the canonical ID from event type plus the most stable provider object identifier.
- Deposit-related events should use event type plus Paystack transaction ID or transaction reference.
- Transfer-related events should use event type plus Paystack transfer ID or transfer reference.

Required uniqueness:

```text
(provider, provider_event_id)
```

If a verified event cannot produce a stable provider event ID, it must be marked `ignored` or `failed` and must not create financial side effects.

## Paystack Event Catalog

Minimum Phase 7 Paystack events:

| Paystack Event | Platform Meaning | Financial Action |
| --- | --- | --- |
| `charge.success` | Deposit payment succeeded. | Verify transaction, then confirm deposit. |
| `charge.failed` | Deposit payment failed. | Mark matching pending deposit failed when verified. |
| `transfer.success` | Withdrawal payout succeeded. | Verify transfer, then mark withdrawal paid. |
| `transfer.failed` | Withdrawal payout failed. | Verify transfer, then release reserved funds. |
| `transfer.reversed` | Withdrawal payout was reversed. | Create reconciliation exception; do not auto-post without explicit reversal design. |

Unsupported verified events:

- Store event evidence.
- Mark `ignored`.
- Emit audit event.
- Return 200.
- Do not create ledger entries.

The provider ADR must confirm the final production event catalog before Paystack production code merges.

## Processing Lifecycle

Required processing order:

1. Receive request.
2. Read raw request body.
3. Extract provider from route.
4. Verify provider is enabled.
5. Verify signature.
6. Compute payload hash.
7. Parse JSON only after signature verification.
8. Derive canonical provider event ID.
9. Store provider event or detect duplicate.
10. For exact duplicate already processed events, return 200.
11. For duplicate events currently processing, return 200 or 202 without duplicate side effects.
12. Create audit event for verified receipt.
13. Process through payment application service.
14. Validate provider state against existing platform intent or withdrawal.
15. Execute financial mutation inside a transaction.
16. Post ledger entries according to `LEDGER_POSTING_RULES.md`.
17. Create post-commit outbox events.
18. Mark provider event `processed`, `failed`, or `ignored`.
19. Return provider-safe response.

Provider webhooks are inputs.

The platform ledger remains the source of truth.

## Response Policy

| Scenario | Response | Reason |
| --- | --- | --- |
| Missing signature | 401 | Reject unauthenticated event. |
| Invalid signature | 401 | Reject unauthenticated event. |
| Unsupported provider | 404 | No provider adapter exists. |
| Verified unsupported event | 200 | Stop provider retries after durable ignore record. |
| Exact duplicate processed event | 200 | Idempotent no-op. |
| Duplicate currently processing event | 200 or 202 | Avoid duplicate side effects. |
| Temporary database outage before durable store | 500 | Ask provider to retry because no durable event exists. |
| Processing failure after durable store | 500 or 200 with internal retry, chosen by provider ADR | Must remain idempotent either way. |
| Ledger already posted before response failure | 200 on retry | Ledger idempotency resolves duplicate safely. |

Provider-specific response requirements must be documented in the provider ADR.

## Retry Policy

Provider retry policy:

- The platform must tolerate duplicate provider delivery indefinitely.
- Provider retries must not duplicate ledger postings.
- Provider retry behavior must be documented in the provider ADR.

Internal retry policy:

- Retry only verified and durably stored events.
- Retry only idempotent processing.
- Use exponential backoff.
- Default maximum attempts: 10.
- Default backoff schedule: 1 minute, 5 minutes, 15 minutes, 30 minutes, 1 hour, then hourly until attempts are exhausted.
- Mark event `failed` after retry exhaustion.
- Create admin alert for failed financial webhook processing.
- Dead-lettered events require manual review before correction.

Email and notification retry:

- Email and notification retries use the transactional outbox rules.
- Email or notification failure must not roll back financial state.

## Duplicate Policy

An event is a duplicate when:

- The same `(provider, provider_event_id)` already exists.

Exact duplicate:

- Same provider.
- Same provider event ID.
- Same payload hash.

Exact duplicate behavior:

- Do not process financial side effects again.
- Return 200.
- Optionally update last-seen metadata if that update does not rewrite event evidence.

Conflicting duplicate:

- Same provider.
- Same provider event ID.
- Different payload hash.

Conflicting duplicate behavior:

- Do not process financial side effects.
- Create security audit event.
- Create reconciliation exception.
- Alert admins.
- Preserve both payload hashes or raw payload references where retention policy allows.

## Failure Recovery

Failure before durable event store:

- No financial mutation is allowed.
- Return retryable failure.
- Provider retry may create the event later.

Failure after event store but before ledger posting:

- Event remains `received`, `processing`, or `failed`.
- Retry may resume from stored event.
- No ledger entry exists unless transaction committed.

Failure during ledger transaction:

- Transaction rollback must remove domain mutation and ledger mutation together.
- Retry must be safe.

Failure after ledger commit but before provider response:

- Provider retry must hit idempotency records.
- No duplicate ledger posting is allowed.
- Return success for duplicate replay.

Failure after ledger commit but before email or notification:

- Financial state remains committed.
- Outbox retry handles side effects.
- No financial rollback is allowed.

Provider outage:

- Do not mark customer funds confirmed or paid based only on local assumptions.
- Queue verification or reconciliation.
- Surface admin alert when provider outage blocks money movement.

## Security Rules

Webhook implementation must protect against:

- Forged events.
- Replay attacks.
- Duplicate delivery.
- Payload mutation under same event ID.
- Clock skew for providers with timestamps.
- Expired signed timestamps for providers with timestamps.
- Provider outage.
- Secret leakage.
- Log injection through payload fields.
- Oversized payload denial of service.

Required controls:

- Signature verification before JSON parsing.
- Constant-time signature comparison.
- Server-only secrets.
- Request body size limit.
- Rate limiting per provider endpoint.
- Structured logging with sanitized fields only.
- Audit event for invalid signatures without sensitive details.
- Permanent idempotency records.
- Provider event reconciliation.

IP allowlisting may be used as defense in depth, but it must not replace signature verification.

## Audit Events

Webhook audit events are required for:

- Webhook received.
- Signature verification failed.
- Provider event stored.
- Duplicate event ignored.
- Conflicting duplicate detected.
- Unsupported event ignored.
- Provider event processing started.
- Provider event processed.
- Provider event failed.
- Provider event dead-lettered.
- Ledger posting triggered by webhook.
- Reconciliation exception created.

Audit events must include:

- Provider.
- Canonical provider event ID when available.
- Event type.
- Payload hash.
- Actor type `system`.
- Request timestamp.
- Processing status.
- Error code when applicable.

## Email And Notification Events

Webhook processing may produce customer or admin communications only after durable financial state commits.

Required examples:

- Deposit confirmed.
- Deposit failed.
- Deposit reversed.
- Withdrawal paid.
- Withdrawal failed.
- Provider event failed after retries.
- Reconciliation exception created.

Emails and notifications must be emitted through the transactional outbox.

## Testing Requirements

Phase 7 webhook certification requires tests for:

- Missing signature.
- Invalid signature.
- Valid Paystack signature.
- Raw body preservation.
- Payload hash creation.
- Event ID derivation.
- Exact duplicate event replay.
- Conflicting duplicate event detection.
- Unsupported verified event ignored safely.
- `charge.success` deposit confirmation.
- `charge.failed` deposit failure.
- `transfer.success` withdrawal payment.
- `transfer.failed` withdrawal release.
- Provider event failure before ledger posting.
- Failure during ledger transaction.
- Failure after ledger commit before response.
- Email failure after ledger commit.
- Notification failure after ledger commit.
- Internal retry exhaustion.
- Dead-letter visibility.
- Provider outage verification path.
- Request body size limit.
- Rate limiting.
- No raw secret leakage in logs.

## Launch Gate

Provider webhook implementation cannot merge into `main` unless:

- Provider ADR is accepted.
- Paystack signature verification passes tests.
- Raw body handling is tested.
- Event identity rules are implemented.
- Duplicate and conflicting duplicate policies are tested.
- Webhook-triggered ledger postings match `LEDGER_POSTING_RULES.md`.
- Failure recovery tests pass.
- Audit, email, and notification outbox behavior is tested.
- Reconciliation exception path exists.
- Security tests pass.
- Full verification passes.

## Maintenance Rules

- New provider: ADR and provider appendix required.
- New event type: update this document and tests before implementation.
- New signature scheme: update this document and security tests.
- New webhook failure mode: add a regression row to `FINANCIAL_TEST_MATRIX.md`.
- Provider documentation change: review this document before relying on old assumptions.

## Source Notes

Paystack webhook signature details were checked against Paystack Developer Documentation on 2026-07-13:

- `https://paystack.com/docs/payments/webhooks/`
