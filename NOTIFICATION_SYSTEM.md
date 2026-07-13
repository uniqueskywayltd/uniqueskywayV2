# NOTIFICATION_SYSTEM.md

## Purpose

This document designs the notification engine for Unique Sky Way V2.

Notifications include:

- In-app notifications.
- Email.
- Future SMS.
- Future push.

The system should be event-driven and channel-agnostic.

## Principles

- Domain events trigger notification decisions.
- Notification policy decides channels.
- Channel delivery is asynchronous.
- Each channel has idempotency.
- Users have preferences where legally appropriate.
- Critical operational notifications bypass marketing preferences but still respect safety and compliance rules.

## Architecture

Flow:

```text
Domain Use Case
  -> Outbox Event
  -> Notification Policy Handler
  -> Notification Records
  -> Channel Dispatch Jobs
  -> Provider Webhooks
  -> Delivery Status Updates
```

## Event Types

Customer events:

- `user.created`.
- `security.new_login`.
- `profile.kyc_submitted`.
- `profile.kyc_approved`.
- `profile.kyc_rejected`.
- `deposit.created`.
- `deposit.confirmed`.
- `deposit.failed`.
- `investment.created`.
- `investment.roi_posted`.
- `investment.matured`.
- `withdrawal.requested`.
- `withdrawal.approved`.
- `withdrawal.paid`.
- `withdrawal.rejected`.
- `referral.applied`.
- `referral.reward_posted`.

Admin events:

- `admin.withdrawal_pending`.
- `admin.deposit_review_required`.
- `settlement.failed`.
- `settlement.completed_with_warnings`.
- `ledger.integrity_alert`.
- `outbox.dead_lettered`.
- `security.admin_suspicious_login`.

## Notification Policy

Notification policy maps events to channels.

Example:

| Event | In-App | Email | SMS Future | Push Future |
| --- | --- | --- | --- | --- |
| `deposit.confirmed` | Yes | Yes | Optional | Optional |
| `investment.roi_posted` | Yes | Preference | No | Preference |
| `investment.matured` | Yes | Yes | Optional | Optional |
| `withdrawal.paid` | Yes | Yes | Optional | Optional |
| `settlement.failed` | Admin | Admin | Future critical | Future critical |
| `ledger.integrity_alert` | Admin | Admin | Future critical | Future critical |

## In-App Notifications

Purpose:

- Persistent customer and admin notification center.

Rules:

- Stored in database.
- Read/unread status per user.
- Link to relevant resource.
- Safe to create even if email fails.
- Can be generated from the same notification event as email.

Priority levels:

- `info`.
- `success`.
- `warning`.
- `critical`.

Retention:

- Customer notifications retained according to product policy.
- Financial notifications should remain available as part of account history.

## Email Notifications

Purpose:

- Transactional messages and operational alerts.

Rules:

- Sent through Resend.
- Idempotency key required.
- Delivery webhook updates status.
- Templates versioned.
- Email failure does not rollback financial state.

## Future SMS

Purpose:

- High-priority security, withdrawal, and operational notifications.

Design now:

- Add `notification_channel_preferences` table with SMS disabled until provider chosen.
- Store phone verification status separately from profile phone.
- Require opt-in where legally required.
- Support quiet hours for non-critical messages.

Possible provider adapter:

- Twilio or another SMS provider.

## Future Push

Purpose:

- Mobile and browser push notifications.

Design now:

- Use channel abstraction.
- Store push subscriptions separately.
- Allow per-device revocation.
- Do not put sensitive financial details in push body.

## Notification Preferences

Customer preferences:

- Daily ROI email on/off.
- Investment maturity email on/off, but default on.
- Referral updates on/off.
- Product updates on/off.

Non-optional:

- Security alerts.
- Financial confirmations.
- Terms or policy notices.
- Withdrawal status.

Admin preferences:

- Admins can tune non-critical digest frequency.
- Critical alerts remain mandatory for assigned roles.

## Idempotency

Notification event idempotency key:

```text
{event_type}:{aggregate_id}:{recipient_id}:{channel}
```

Examples:

- `investment.matured:inv_123:user_456:email`.
- `deposit.confirmed:dep_123:user_456:in_app`.

Rules:

- Duplicate domain events must not create duplicate notifications.
- Retried channel dispatch must not send duplicate provider messages.

## Failure Handling

In-app failure:

- Usually database issue.
- Retry through outbox.
- Alert if persistent.

Email failure:

- Retry transient failures.
- Suppress hard bounce or complaint.
- Admin can retry after correction.

SMS future failure:

- Retry transient provider failures.
- Fall back to email for non-critical messages.
- Escalate critical admin alerts when repeated.

Push future failure:

- Remove invalid subscriptions.
- Retry transient failures.

## Admin Visibility

Admins should see:

- Notification generated.
- Channels selected.
- Delivery status.
- Provider message id.
- Error reason.
- Retry count.
- Last attempt time.

## Privacy

Rules:

- Do not include full account numbers.
- Do not include KYC document data.
- Do not include sensitive admin notes.
- Avoid detailed financial values in SMS or push unless explicitly approved.
- Email can include amounts for transactional records, but should be restrained.

## Future Queue Migration

Initial implementation:

- PostgreSQL outbox table.
- Scheduled worker route or Node worker.

Future implementation:

- Dedicated queue.
- Same event contracts.
- Same channel adapters.

