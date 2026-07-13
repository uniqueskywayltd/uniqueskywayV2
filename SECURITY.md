# SECURITY.md

## Purpose

This document designs the security architecture for Unique Sky Way V2.

Security is a product requirement, not an implementation detail.

## Security Principles

- Never build custom password storage.
- Least privilege everywhere.
- Defense in depth.
- Financial actions require server-side authorization.
- Admin actions require audit reasons.
- Secrets never reach the browser.
- Sensitive data is minimized.
- Every security-relevant event is logged.

## Authentication

Recommended:

- Supabase Auth initially.

Why:

- Managed authentication reduces risk.
- Integrates naturally with Supabase Postgres and RLS.
- Supports email verification and MFA patterns.

Rules:

- Email verification required before financial actions.
- MFA supported for customers and required for admins.
- Admin sessions have shorter lifetime.
- Password reset handled by auth provider.
- Auth callback handling is isolated from business logic.

Future option:

- Move to a dedicated enterprise auth provider if regulatory, enterprise SSO, or advanced device posture requirements outgrow Supabase Auth.

## Authorization

Authorization is application-owned.

Layers:

1. Route and layout guards for UX.
2. Application service permission checks for actual enforcement.
3. Database RLS for defense in depth.

Customer rules:

- Can read own resources.
- Cannot write ledger directly.
- Cannot modify investment terms.
- Cannot approve own withdrawals.

Admin rules:

- Role-based permissions.
- Sensitive actions require explicit permission.
- Financial mutations require an audit reason.
- Role grants require super admin permission.

## Trusted Devices

Purpose:

- Reduce friction for known devices while preserving step-up security.

Design:

- Issue opaque random device token after successful MFA or step-up.
- Store only hash of token.
- Bind token to user.
- Store label, created time, last used time, expiry, and revocation status.
- Rotate or expire tokens.

Rules:

- Device fingerprint is a signal, not an authenticator.
- Trusted device does not bypass admin MFA requirement for high-risk actions.
- User can revoke trusted devices.
- New trusted device triggers security email.

## Sessions

Rules:

- Secure HTTP-only cookies.
- SameSite strict or lax depending on auth flow.
- Shorter admin session lifetime.
- Rotate session after privilege changes.
- Revoke sessions on password reset, MFA reset, or account restriction.
- Step-up timestamp stored server-side or in trusted auth metadata.

## Step-Up Authentication

Required for:

- Withdrawal request.
- Adding payout destination.
- Changing email.
- Disabling MFA.
- Trusting a device.
- Admin financial approval.
- Admin role management.

Step-up validity:

- Short window, such as 10 minutes.
- Bound to actor and session.

## Rate Limiting

Rate limit dimensions:

- IP address.
- User id.
- Email address.
- Device token.
- Endpoint group.

Endpoint groups:

- Auth attempts.
- Password reset.
- Email verification resend.
- Deposit creation.
- Withdrawal creation.
- Referral claim.
- Upload signing.
- Admin mutation.
- Webhook endpoints.

Behavior:

- Return `429 RATE_LIMITED`.
- Include `Retry-After`.
- Log security event when threshold exceeded.

## Uploads

Rules:

- Uploads use signed URLs.
- File size limits per purpose.
- Allowed MIME types by purpose.
- Server validates claimed content type and actual file type where possible.
- Virus or malware scanning before admin/customer consumption.
- Private bucket for sensitive files.
- No direct public access to KYC or financial documents.
- File metadata stored in database.
- Files linked to owner and purpose.

Prohibited:

- Executable uploads.
- Public customer documents.
- Trusting file extension only.

## Secrets

Rules:

- No secrets committed to Git.
- `.env.example` contains names only, no real values.
- Server secrets are never prefixed for public client exposure.
- Separate development, staging, and production secrets.
- Rotate secrets after suspected exposure.
- Service role keys used only server-side.
- Webhook secrets stored as environment variables.

Secret categories:

- Supabase URL and anon key.
- Supabase service role key.
- Resend API key.
- Resend webhook secret.
- Payment provider keys.
- KYC provider keys.
- Internal job token.
- Encryption keys if needed.

## Environment Variables

Configuration should be typed and validated at startup.

Public variables:

- Browser-safe values only.

Server variables:

- Provider secrets.
- Service role keys.
- Internal job tokens.

Rules:

- Fail fast when required production variables are missing.
- Do not log secret values.
- Do not expose config endpoint containing secrets.

## Audit Logging

Audit logs required for:

- Login and logout.
- MFA changes.
- Trusted device changes.
- Account restrictions.
- Role grants and revocations.
- KYC decisions.
- Deposit manual actions.
- Withdrawal approvals and rejections.
- Investment corrections.
- Plan activation or retirement.
- Settlement manual runs.
- Ledger corrections.
- Email suppression overrides.
- Secret or environment changes where visible to app.

Audit log fields:

- Actor.
- Actor type.
- Action.
- Target.
- Reason.
- Metadata.
- Request id.
- IP hash.
- User agent hash.
- Timestamp.

Rules:

- Audit records are append-only.
- Admin financial actions require reason.
- Audit logs are searchable by authorized admins only.

## Webhook Security

Rules:

- Verify provider signatures.
- Reject stale timestamps where provider supports them.
- Store provider event id before processing.
- Deduplicate events.
- Do not trust webhook amount or status without matching existing intent.
- Log failed verification without exposing secret details.
- Follow `WEBHOOK_SPECIFICATION.md` for provider-specific verification, replay protection, duplicate policy, and recovery.

## Database Security

Rules:

- Enable RLS on customer-exposed tables.
- Keep sensitive operational tables private.
- Use service role only in server context.
- Use least-privilege database roles where possible.
- Use database constraints for financial integrity.
- Enable audit extensions or database-level logging where appropriate.

## Admin Security

Rules:

- MFA required.
- Trusted device required or step-up required for sensitive actions.
- IP allowlists optional for finance/platform admins.
- No shared admin accounts.
- Role review on a schedule.
- Emergency access account stored and monitored separately.

## Incident Response

Minimum runbooks:

- Suspected account takeover.
- Admin credential compromise.
- Webhook secret exposure.
- Ledger imbalance.
- Unauthorized withdrawal.
- Email provider compromise.
- Database restore.

## Compliance Note

Before production launch, the platform needs legal review for:

- Securities regulation.
- Investment advisor obligations.
- Money transmission.
- KYC and AML.
- Sanctions screening.
- Tax reporting.
- Referral and promotional rules.
- Data privacy obligations.

This document is a technical architecture, not legal advice.

## References

- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase token security guidance: https://supabase.com/docs/guides/auth/oauth-server/token-security
- Supabase Database Security Advisor: https://supabase.com/docs/guides/database/database-advisors
