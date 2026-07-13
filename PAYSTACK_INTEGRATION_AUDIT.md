# PAYSTACK_INTEGRATION_AUDIT.md

## Result

PASS — Paystack is the sole certified Phase 7 provider under DEC-0021.

## Checklist

| Capability | Status | Evidence |
| --- | --- | --- |
| Provider ADR | PASS | `DECISIONS.md` DEC-0021 |
| Transaction Initialize | PASS | `POST /transaction/initialize` |
| Verify Transaction | PASS | `GET /transaction/verify/:reference` |
| Transfer Initiate | PASS | `POST /transfer` |
| Transfer Verify | PASS | `GET /transfer/verify/:reference` |
| Webhooks | PASS | `/api/webhooks/payments/paystack` |
| Signature Verification | PASS | HMAC SHA512 + timing-safe compare |
| Retry | PASS | Internal backoff + recovery replay |
| Replay Protection | PASS | Unique provider event identity |
| Duplicate Protection | PASS | Processed event no-op |
| Provider Mapping | PASS | Charge → deposit; transfer → withdrawal |
| Failure Recovery | PASS | Failed event retry / dead letter |
| Disabled-without-secret | PASS | `DisabledPaystackPaymentProvider` fails closed |

## Explicit Non-Goals

- Flutterwave: not implemented.
- Stripe: not implemented.
- Multi-currency: USD only.
