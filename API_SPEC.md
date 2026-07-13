# API_SPEC.md

## Purpose

This document defines the API contract for Unique Sky Way V2 before implementation.

The API should be boring, explicit, authenticated, permission-aware, idempotent where needed, and transport-independent from domain logic.

## API Principles

- JSON over HTTPS.
- Server-side authorization for every private endpoint.
- Idempotency keys for retryable mutations.
- Correlation IDs for observability.
- Consistent error envelopes.
- No financial mutation without an application service.
- No sensitive provider payloads returned to clients.

## Authentication

Recommended:

- Supabase Auth for customer and admin authentication.
- HTTP-only secure session cookies for web sessions.
- Bearer token verification only for trusted machine-to-machine or webhook flows.

Every authenticated request resolves:

- `actor_id`.
- `actor_type`.
- `user_id`.
- Roles and permissions.
- Request correlation ID.

## Permissions

Customer permissions:

- Read own profile.
- Update own profile fields.
- Read own investments.
- Create investment with own available wallet funds.
- Read own wallet activity.
- Request own withdrawal.
- Read own referrals.
- Manage own notification preferences.

Admin permissions:

- `admin.users.read`.
- `admin.users.restrict`.
- `admin.kyc.review`.
- `admin.deposits.review`.
- `admin.withdrawals.review`.
- `admin.investments.read`.
- `admin.investments.correct`.
- `admin.plans.manage`.
- `admin.settlements.read`.
- `admin.settlements.run`.
- `admin.ledger.read`.
- `admin.audit.read`.
- `admin.roles.manage`.

## Error Envelope

All API errors should use:

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "requestId": "string",
    "details": {}
  }
}
```

Common error codes:

- `UNAUTHENTICATED`.
- `FORBIDDEN`.
- `VALIDATION_FAILED`.
- `NOT_FOUND`.
- `CONFLICT`.
- `INVALID_STATE`.
- `IDEMPOTENCY_CONFLICT`.
- `RATE_LIMITED`.
- `PROVIDER_UNAVAILABLE`.
- `FINANCIAL_INTEGRITY_ERROR`.
- `INTERNAL_ERROR`.

## Common Headers

Request headers:

- `Authorization`: optional depending on cookie session strategy.
- `Idempotency-Key`: required for retryable mutations.
- `X-Request-Id`: optional client-provided correlation ID.

Response headers:

- `X-Request-Id`.
- `Retry-After` for rate limits.

## Public API

### `GET /api/health`

Purpose:

- Health check for hosting and uptime monitoring.

Auth:

- None.

Response:

```json
{
  "status": "ok",
  "time": "2026-07-12T00:00:00.000Z"
}
```

### `GET /api/public/investment-plans`

Purpose:

- Return public active plan summaries.

Auth:

- None.

Response:

```json
{
  "plans": [
    {
      "id": "plan_version_id",
      "slug": "starter",
      "name": "Starter",
      "currency": "USD",
      "minPrincipalMinor": 10000,
      "maxPrincipalMinor": 1000000,
      "termDays": 90,
      "dailyRoiBps": 50,
      "riskDisclosure": "string"
    }
  ]
}
```

## Customer API

### `GET /api/me`

Purpose:

- Return the current authenticated user's profile shell.

Auth:

- Customer or admin.

Response:

```json
{
  "user": {
    "id": "user_id",
    "email": "customer@example.com",
    "status": "active",
    "roles": []
  }
}
```

### `GET /api/customer/profile`

Purpose:

- Read customer profile.

Auth:

- Customer.

Response:

```json
{
  "profile": {
    "legalName": "string",
    "displayName": "string",
    "country": "US",
    "onboardingStatus": "complete",
    "kycStatus": "approved",
    "riskStatus": "normal"
  }
}
```

### `PATCH /api/customer/profile`

Purpose:

- Update editable profile fields.

Auth:

- Customer.

Request:

```json
{
  "displayName": "string",
  "phone": "string"
}
```

Response:

```json
{
  "profile": {
    "displayName": "string",
    "phone": "string",
    "updatedAt": "2026-07-12T00:00:00.000Z"
  }
}
```

### `POST /api/customer/terms/accept`

Purpose:

- Record acceptance of terms and disclosures.

Auth:

- Customer.

Request:

```json
{
  "termsVersion": "2026-07-12",
  "disclosureVersion": "2026-07-12"
}
```

Response:

```json
{
  "accepted": true,
  "acceptedAt": "2026-07-12T00:00:00.000Z"
}
```

### `GET /api/customer/wallet`

Purpose:

- Return wallet balances.

Auth:

- Customer.

Response:

```json
{
  "currency": "USD",
  "balances": {
    "availableMinor": 100000,
    "lockedMinor": 250000,
    "reservedMinor": 50000,
    "pendingMinor": 10000
  }
}
```

### `GET /api/customer/wallet/transactions`

Purpose:

- Return ledger-derived wallet activity.

Auth:

- Customer.

Query:

- `cursor`.
- `limit`.
- `type`.

Response:

```json
{
  "items": [
    {
      "id": "ledger_transaction_id",
      "type": "roi_settlement",
      "amountMinor": 1250,
      "currency": "USD",
      "postedAt": "2026-07-12T00:00:00.000Z",
      "description": "Daily ROI settlement"
    }
  ],
  "nextCursor": null
}
```

### `POST /api/customer/deposits`

Purpose:

- Create a deposit intent.

Auth:

- Customer.

Headers:

- `Idempotency-Key` required.

Request:

```json
{
  "amountMinor": 100000,
  "currency": "USD",
  "provider": "tbd"
}
```

Response:

```json
{
  "deposit": {
    "id": "deposit_intent_id",
    "status": "pending",
    "providerAction": {
      "type": "redirect",
      "url": "https://provider.example/checkout"
    }
  }
}
```

### `GET /api/customer/deposits`

Purpose:

- List own deposit intents.

Auth:

- Customer.

### `GET /api/customer/investment-plans`

Purpose:

- Return active plan versions available to the authenticated customer.

Auth:

- Customer.

### `POST /api/customer/investments`

Purpose:

- Create an investment using available wallet funds.

Auth:

- Customer.

Headers:

- `Idempotency-Key` required.

Request:

```json
{
  "planVersionId": "plan_version_id",
  "principalMinor": 250000,
  "currency": "USD",
  "acceptedDisclosureVersion": "2026-07-12"
}
```

Response:

```json
{
  "investment": {
    "id": "investment_id",
    "status": "active",
    "principalMinor": 250000,
    "startAt": "2026-07-12T00:00:00.000Z",
    "firstSettlementDate": "2026-07-13",
    "maturityDate": "2026-10-10"
  }
}
```

Errors:

- `INSUFFICIENT_AVAILABLE_BALANCE`.
- `PLAN_NOT_AVAILABLE`.
- `PROFILE_NOT_ELIGIBLE`.
- `DISCLOSURE_NOT_ACCEPTED`.

### `GET /api/customer/investments`

Purpose:

- List own investments.

Auth:

- Customer.

Query:

- `status`.
- `cursor`.
- `limit`.

### `GET /api/customer/investments/:investmentId`

Purpose:

- Read own investment detail.

Auth:

- Customer.

Response:

```json
{
  "investment": {
    "id": "investment_id",
    "status": "active",
    "principalMinor": 250000,
    "earnedRoiMinor": 12500,
    "termDays": 90,
    "settledDays": 10,
    "maturityDate": "2026-10-10"
  }
}
```

### `GET /api/customer/investments/:investmentId/settlements`

Purpose:

- Return daily settlement history for an investment.

Auth:

- Customer.

### `POST /api/customer/withdrawals`

Purpose:

- Request withdrawal of available funds.

Auth:

- Customer with step-up authentication when required.

Headers:

- `Idempotency-Key` required.

Request:

```json
{
  "amountMinor": 50000,
  "currency": "USD",
  "destinationId": "saved_destination_id"
}
```

Response:

```json
{
  "withdrawal": {
    "id": "withdrawal_request_id",
    "status": "under_review",
    "amountMinor": 50000,
    "createdAt": "2026-07-12T00:00:00.000Z"
  }
}
```

### `GET /api/customer/withdrawals`

Purpose:

- List own withdrawal requests.

Auth:

- Customer.

### `GET /api/customer/referrals`

Purpose:

- Return referral code, referral stats, and reward history.

Auth:

- Customer.

### `POST /api/customer/referrals/claim`

Purpose:

- Apply a referral code before the customer becomes ineligible.

Auth:

- Customer.

Request:

```json
{
  "code": "SKY123"
}
```

### `GET /api/customer/notifications`

Purpose:

- List in-app notifications.

Auth:

- Customer.

### `PATCH /api/customer/notifications/:notificationId`

Purpose:

- Mark notification read or unread.

Auth:

- Customer.

Request:

```json
{
  "read": true
}
```

### `POST /api/customer/uploads/sign`

Purpose:

- Create a signed upload target for allowed documents.

Auth:

- Customer.

Request:

```json
{
  "purpose": "kyc_supporting_document",
  "fileName": "statement.pdf",
  "contentType": "application/pdf",
  "sizeBytes": 2000000
}
```

Response:

```json
{
  "upload": {
    "url": "https://storage.example/upload",
    "expiresAt": "2026-07-12T00:10:00.000Z"
  }
}
```

## Admin API

### `GET /api/admin/overview`

Purpose:

- Return operational dashboard counts.

Permission:

- `admin.users.read` plus operational read permissions.

### `GET /api/admin/users`

Purpose:

- Search users.

Permission:

- `admin.users.read`.

Query:

- `q`.
- `status`.
- `kycStatus`.
- `cursor`.
- `limit`.

### `GET /api/admin/users/:userId`

Purpose:

- View user operational detail.

Permission:

- `admin.users.read`.

### `PATCH /api/admin/users/:userId/status`

Purpose:

- Restrict, unrestrict, or close a user.

Permission:

- `admin.users.restrict`.

Request:

```json
{
  "status": "restricted",
  "reason": "Suspicious activity review"
}
```

### `PATCH /api/admin/users/:userId/kyc`

Purpose:

- Update KYC status after review or provider callback.

Permission:

- `admin.kyc.review`.

Request:

```json
{
  "kycStatus": "approved",
  "reason": "Provider verification passed"
}
```

### `GET /api/admin/investment-plans`

Purpose:

- List plans and versions.

Permission:

- `admin.plans.manage`.

### `POST /api/admin/investment-plans`

Purpose:

- Create a draft investment plan.

Permission:

- `admin.plans.manage`.

Headers:

- `Idempotency-Key` required.

### `POST /api/admin/investment-plans/:planId/versions`

Purpose:

- Create immutable plan version.

Permission:

- `admin.plans.manage`.

### `PATCH /api/admin/investment-plan-versions/:versionId/status`

Purpose:

- Activate or retire a plan version.

Permission:

- `admin.plans.manage`.

Request:

```json
{
  "status": "active",
  "reason": "Approved launch terms"
}
```

### `GET /api/admin/investments`

Purpose:

- Search investments.

Permission:

- `admin.investments.read`.

### `GET /api/admin/investments/:investmentId`

Purpose:

- View investment detail, settlements, and ledger links.

Permission:

- `admin.investments.read`.

### `GET /api/admin/deposits`

Purpose:

- Review deposits.

Permission:

- `admin.deposits.review`.

### `POST /api/admin/deposits/:depositId/approve`

Purpose:

- Manually approve a deposit where policy allows.

Permission:

- `admin.deposits.review`.

Headers:

- `Idempotency-Key` required.

Request:

```json
{
  "reason": "Manual bank confirmation"
}
```

### `POST /api/admin/deposits/:depositId/reject`

Purpose:

- Reject a pending deposit.

Permission:

- `admin.deposits.review`.

### `GET /api/admin/withdrawals`

Purpose:

- Review withdrawal queue.

Permission:

- `admin.withdrawals.review`.

### `POST /api/admin/withdrawals/:withdrawalId/approve`

Purpose:

- Approve withdrawal and create payout instruction.

Permission:

- `admin.withdrawals.review`.

Headers:

- `Idempotency-Key` required.

Request:

```json
{
  "reason": "Review passed"
}
```

### `POST /api/admin/withdrawals/:withdrawalId/reject`

Purpose:

- Reject withdrawal and release reserved funds.

Permission:

- `admin.withdrawals.review`.

Request:

```json
{
  "reason": "Destination verification failed"
}
```

### `GET /api/admin/ledger/transactions`

Purpose:

- Search ledger transactions.

Permission:

- `admin.ledger.read`.

### `GET /api/admin/settlements/runs`

Purpose:

- List settlement runs.

Permission:

- `admin.settlements.read`.

### `POST /api/admin/settlements/run`

Purpose:

- Trigger settlement for a New York date or catch-up range.

Permission:

- `admin.settlements.run`.

Headers:

- `Idempotency-Key` required.

Request:

```json
{
  "settlementDate": "2026-07-12",
  "runType": "manual_replay",
  "reason": "Operations replay after failed worker"
}
```

### `GET /api/admin/outbox-events`

Purpose:

- Inspect failed or pending side effects.

Permission:

- Platform admin.

### `POST /api/admin/outbox-events/:eventId/retry`

Purpose:

- Retry failed side effect.

Permission:

- Platform admin.

### `GET /api/admin/audit-logs`

Purpose:

- Search audit records.

Permission:

- `admin.audit.read`.

## Webhook API

### `POST /api/webhooks/payments/:provider`

Purpose:

- Receive payment provider events.

Auth:

- Provider signature verification.

Behavior:

- Verify signature.
- Store provider event id.
- Deduplicate.
- Process through payment application service.
- Return 2xx for already processed duplicate.
- Follow `WEBHOOK_SPECIFICATION.md` for provider-specific signature, retry, duplicate, and failure behavior.

### `POST /api/webhooks/resend`

Purpose:

- Receive email delivery events.

Auth:

- Resend webhook signature verification.

Behavior:

- Verify signature.
- Deduplicate using webhook id.
- Update `email_messages`.

### `POST /api/webhooks/kyc/:provider`

Purpose:

- Receive KYC provider status updates.

Auth:

- Provider signature verification.

## Machine/Internal API

### `POST /api/internal/jobs/process-outbox`

Purpose:

- Process pending outbox events.

Auth:

- Internal job token or platform scheduler identity.

### `POST /api/internal/jobs/run-settlement`

Purpose:

- Scheduled daily settlement trigger.

Auth:

- Internal job token or platform scheduler identity.

Request:

```json
{
  "asOf": "2026-07-12T05:10:00.000Z"
}
```

Rules:

- The service computes eligible New York dates.
- The endpoint does not trust client-provided financial results.

## API Versioning

Initial version:

- Unversioned internal web app API while the web client and server deploy together.

Future external API:

- `/api/v1/...`.
- Explicit backwards compatibility policy.
- Schema-driven contract tests.

## References

- Next.js Route Handlers: https://nextjs.org/docs/app/getting-started/route-handlers
- Next.js route file convention: https://nextjs.org/docs/app/api-reference/file-conventions/route
