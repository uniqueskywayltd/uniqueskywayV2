# WEBHOOK_SECURITY_AUDIT.md

## Result

PASS — Webhook handling matches `WEBHOOK_SPECIFICATION.md` for Paystack.

## Controls

| Control | Status | Evidence |
| --- | --- | --- |
| Raw body read before trust | PASS | Webhook route uses `request.text()` |
| Signature before financial work | PASS | Engines verify HMAC before processing |
| Constant-time compare | PASS | `timingSafeEqual` |
| Invalid signature rejection | PASS | `AUTHORIZATION_ERROR` |
| Event identity uniqueness | PASS | `(provider, provider_event_id)` |
| Payload hash conflict | PASS | Conflict audit + no financial side effects |
| Exact duplicate handling | PASS | `processed`/`ignored` → duplicate response |
| Concurrent claim | PASS | `processing` claim prevents double work |
| Secret hygiene | PASS | Secret server-only; logger redaction configured |
| `transfer.reversed` exception | PASS | Audit/outbox only; no auto ledger post |

## Events

| Event | Action |
| --- | --- |
| `charge.success` | Verify + confirm deposit |
| `charge.failed` | Fail pending deposit |
| `transfer.success` | Verify + mark withdrawal paid |
| `transfer.failed` | Release reserved funds |
| `transfer.reversed` | Reconciliation exception only |
| Other | Stored and ignored |
