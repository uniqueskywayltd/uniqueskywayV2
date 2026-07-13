# EMAIL_SYSTEM.md

## Purpose

This document defines the email system for Unique Sky Way V2.

Email is a side effect. It should be event-driven, idempotent, retryable, and observable.

Recommended provider:

- Resend.

## Email Principles

- Email sends must be triggered by domain events through the outbox.
- Email templates receive prepared data and do not query the database.
- Every send has an idempotency key.
- Delivery webhooks update email status.
- Critical financial state must not depend on email success.
- Sensitive data in email should be minimized.

## Email Lifecycle

1. Domain event is written to `outbox_events`.
2. Notification handler decides whether email is required.
3. `email_messages` record is created.
4. Email provider send is attempted with idempotency key.
5. Provider message id is stored.
6. Webhooks update delivered, bounced, complained, or failed status.
7. Retries occur for transient failures.
8. Permanent failures are surfaced to admin operations.

## Retry Strategy

Default retry schedule:

- Attempt 1: immediate.
- Attempt 2: 1 minute.
- Attempt 3: 5 minutes.
- Attempt 4: 30 minutes.
- Attempt 5: 2 hours.

Rules:

- Retry only transient provider or network failures.
- Do not retry hard bounces.
- Do not retry suppressed addresses.
- Do not send duplicate emails for the same idempotency key.

## Failure Behavior

Financial events:

- Ledger state remains committed.
- Email failure is recorded.
- Admin operations can retry eligible emails.

Authentication emails:

- User can request resend with rate limits.

Security emails:

- Failure creates a high-priority operational signal if repeated.

## Email Catalog

### `auth.email_verification`

Trigger:

- User creates account or changes email.

Purpose:

- Verify ownership of email address.

Recipient:

- Customer or admin user.

Template:

- Verification link, expiration, support contact.

Retry:

- Provider managed or app retry depending on auth provider integration.

Failure:

- User remains unverified and can request resend.

### `auth.password_reset`

Trigger:

- User requests password reset.

Purpose:

- Allow secure password reset.

Recipient:

- Account email.

Template:

- Reset link, expiration, security warning.

Retry:

- Limited retry through auth provider.

Failure:

- User can request again after rate limit window.

### `security.new_login`

Trigger:

- Login from new device, location, or risk signal.

Purpose:

- Alert user to account access.

Recipient:

- Customer or admin.

Template:

- Time, approximate location if available, device label, support path.

Retry:

- Standard transient retry.

Failure:

- Record security event.

### `security.mfa_enabled`

Trigger:

- User enables MFA.

Purpose:

- Confirm security setting change.

Recipient:

- User.

Template:

- MFA enabled confirmation.

Retry:

- Standard.

Failure:

- Log only.

### `security.trusted_device_added`

Trigger:

- User trusts a new device.

Purpose:

- Alert user to trusted device change.

Recipient:

- User.

Template:

- Device label, time, revoke guidance.

Retry:

- Standard.

Failure:

- Log security event.

### `profile.kyc_submitted`

Trigger:

- Customer submits KYC.

Purpose:

- Confirm review started.

Recipient:

- Customer.

Template:

- Review status and expected next steps.

Retry:

- Standard.

Failure:

- Non-blocking.

### `profile.kyc_approved`

Trigger:

- KYC approved.

Purpose:

- Tell customer they can perform eligible financial actions.

Recipient:

- Customer.

Template:

- Approval confirmation.

Retry:

- Standard.

Failure:

- Non-blocking, visible in notification center.

### `profile.kyc_rejected`

Trigger:

- KYC rejected.

Purpose:

- Tell customer review did not pass and next steps.

Recipient:

- Customer.

Template:

- Rejection status, support path, no sensitive internal reason.

Retry:

- Standard.

Failure:

- Admin-visible.

### `wallet.deposit_created`

Trigger:

- Deposit intent created.

Purpose:

- Confirm deposit was initiated.

Recipient:

- Customer.

Template:

- Amount, currency, status, next step.

Retry:

- Standard.

Failure:

- Non-blocking.

### `wallet.deposit_confirmed`

Trigger:

- Provider confirms deposit and ledger credit posts.

Purpose:

- Confirm funds are available.

Recipient:

- Customer.

Template:

- Amount, currency, wallet link.

Retry:

- Standard.

Failure:

- Admin-visible after retries.

### `wallet.deposit_failed`

Trigger:

- Deposit fails or is cancelled.

Purpose:

- Notify customer no funds were credited.

Recipient:

- Customer.

Template:

- Amount, status, retry guidance.

Retry:

- Standard.

Failure:

- Non-blocking.

### `investment.created`

Trigger:

- Investment activated and principal locked.

Purpose:

- Confirm investment start.

Recipient:

- Customer.

Template:

- Plan name, principal, start date, first settlement date, maturity date.

Retry:

- Standard.

Failure:

- Admin-visible after retries.

### `investment.daily_roi_posted`

Trigger:

- Daily ROI settlement posts.

Purpose:

- Optional customer update.

Recipient:

- Customer if preference enabled.

Template:

- Daily ROI amount, investment link.

Retry:

- Low priority standard.

Failure:

- Do not alert unless systemic.

### `investment.matured`

Trigger:

- Investment reaches maturity and principal release posts.

Purpose:

- Notify customer funds are available according to plan policy.

Recipient:

- Customer.

Template:

- Principal, total ROI, maturity date, available balance.

Retry:

- Standard.

Failure:

- Admin-visible after retries.

### `withdrawal.requested`

Trigger:

- Customer requests withdrawal and funds are reserved.

Purpose:

- Confirm request.

Recipient:

- Customer.

Template:

- Amount, destination label, status.

Retry:

- Standard.

Failure:

- Non-blocking.

### `withdrawal.approved`

Trigger:

- Admin approves withdrawal or automated approval passes.

Purpose:

- Inform customer payout is processing.

Recipient:

- Customer.

Template:

- Amount, estimated processing timing.

Retry:

- Standard.

Failure:

- Admin-visible.

### `withdrawal.paid`

Trigger:

- Payout provider confirms payment.

Purpose:

- Confirm withdrawal completed.

Recipient:

- Customer.

Template:

- Amount, paid date.

Retry:

- Standard.

Failure:

- Admin-visible.

### `withdrawal.rejected`

Trigger:

- Admin rejects withdrawal and funds are released.

Purpose:

- Tell customer request was rejected.

Recipient:

- Customer.

Template:

- Amount, status, support path.

Retry:

- Standard.

Failure:

- Admin-visible.

### `referral.applied`

Trigger:

- Referred customer applies code.

Purpose:

- Confirm referral attribution.

Recipient:

- Referred customer.

Template:

- Referral confirmation.

Retry:

- Standard.

Failure:

- Non-blocking.

### `referral.reward_posted`

Trigger:

- Referral reward ledger posting completes.

Purpose:

- Notify referrer of reward.

Recipient:

- Referrer.

Template:

- Reward amount, referred customer masked identifier, wallet link.

Retry:

- Standard.

Failure:

- Admin-visible after retries.

### `admin.withdrawal_pending`

Trigger:

- Withdrawal enters review queue.

Purpose:

- Alert finance admins.

Recipient:

- Finance admins.

Template:

- Withdrawal amount, age, risk signals, admin link.

Retry:

- Standard.

Failure:

- Operational alert if repeated.

### `admin.settlement_failed`

Trigger:

- Settlement run fails.

Purpose:

- Alert operations and finance admins.

Recipient:

- Finance and platform admins.

Template:

- Settlement date, run id, error summary, runbook link.

Retry:

- Aggressive retry and secondary alert channel when available.

Failure:

- Page or high-priority alert through future incident system.

### `admin.ledger_integrity_alert`

Trigger:

- Ledger imbalance, failed posting, or reconciliation mismatch.

Purpose:

- Immediate operational awareness.

Recipient:

- Platform and finance admins.

Template:

- Severity, affected ids, runbook link.

Retry:

- Aggressive retry.

Failure:

- Escalate through non-email channel when available.

## Templates

Template requirements:

- Plain text and HTML versions.
- Accessible markup.
- No sensitive secrets.
- No full KYC data.
- No full payment account data.
- Include support contact and legal footer.
- Include unsubscribe or preference link where appropriate for non-transactional categories.

## Suppression

The system should suppress:

- Hard-bounced addresses.
- Complaint addresses.
- Manually suppressed addresses.

Critical security emails may require alternate delivery or support workflow when suppressed.

## References

- Resend idempotency keys: https://resend.com/docs/dashboard/emails/idempotency-keys
- Resend webhook storage and retries: https://resend.com/docs/dashboard/webhooks/how-to-store-webhooks-data
- Resend webhook ingester idempotency: https://resend.com/docs/webhooks/ingester

