# DEVELOPMENT_ROADMAP.md

## Purpose

This roadmap defines the recommended order to build Unique Sky Way V2 from architecture to production.

The order is intentionally conservative. Financial platforms should be built from correctness outward, not from screens inward.

## Phase 0: Architecture

Status:

- Current phase.

Deliverables:

- Product constitution.
- Architecture design.
- Folder structure design.
- Database design.
- API specification.
- ROI engine design.
- Email system design.
- Notification system design.
- Security design.
- Performance design.
- Deployment design.
- Testing strategy.

Exit criteria:

- Business owner approves core workflows.
- Open assumptions are answered or explicitly deferred.
- Legal/compliance review path is identified.

## Phase 1: Project Foundation

Build:

- Next.js App Router project.
- TypeScript configuration.
- Formatting and linting.
- Test framework.
- Environment validation.
- Basic CI pipeline.
- Empty route groups.
- Design system foundation.

Do not build:

- Investment features yet.
- Payment features yet.
- Admin financial controls yet.

Exit criteria:

- App builds.
- Tests run.
- CI passes.
- Environment config fails safely when missing.

## Phase 2: Domain Core

Build:

- Domain modules for money, dates, investment terms, investment lifecycle, ledger posting rules, settlement calculation, referral eligibility.
- Pure unit tests.
- Financial fixture runner.

Exit criteria:

- ROI fixtures pass.
- Maturity fixtures pass.
- Rounding fixtures pass.
- New York date fixtures pass.
- Domain code has no framework or database dependency.

## Phase 3: Database Foundation

Build:

- Initial Supabase schema.
- RLS strategy.
- Ledger tables.
- Investment plan tables.
- Investment tables.
- Settlement tables.
- Outbox tables.
- Audit tables.
- Repository implementations.

Exit criteria:

- Migrations apply cleanly.
- Integration tests pass.
- Ledger balancing enforced through posting path.
- RLS tests pass.

## Phase 4: Authentication and User Foundation

Build:

- Supabase Auth integration.
- Session handling.
- Customer profile.
- Admin profile and roles.
- MFA requirement for admins.
- Trusted device model.
- Audit logging for auth/security events.

Exit criteria:

- Customer can sign up and sign in.
- Admin can sign in with MFA.
- Authorization checks work.
- Session and restriction tests pass.

## Phase 5: Wallet and Ledger

Build:

- Ledger posting service.
- Wallet read models.
- Balance snapshots if needed.
- Wallet activity API.
- Admin ledger viewer.
- Ledger reconciliation checks.

Exit criteria:

- Balances derive from ledger.
- No direct wallet balance mutation.
- Reconciliation test passes.

## Phase 6: Investment Plans and Investments

Build:

- Admin plan management.
- Customer plan browsing.
- Investment creation from wallet funds.
- Principal locking.
- Investment dashboard.
- Investment detail.

Exit criteria:

- Plan versions are immutable after activation.
- Customer investment snapshots terms.
- Principal lock posts through ledger.
- Insufficient balance is rejected.

## Phase 7: Settlement Engine

Build:

- Daily settlement service.
- Settlement run records.
- Settlement item records.
- Catch-up settlement.
- Maturity processing.
- Admin settlement monitor.
- Internal scheduled endpoint.

Exit criteria:

- Daily settlement works.
- Catch-up works.
- Duplicate runs do not double credit.
- Maturity releases principal correctly.
- Admin can inspect failures.

## Phase 8: Deposits and Withdrawals

Build:

- Payment provider abstraction.
- Deposit intent flow.
- Payment webhook handling.
- Withdrawal request flow.
- Admin withdrawal review.
- Payout provider abstraction.
- Reversals and failures.

Exit criteria:

- Duplicate webhooks are idempotent.
- Deposits credit only after confirmation.
- Withdrawal reservation works.
- Rejection releases funds.
- Approval creates auditable payout path.

## Phase 9: Referrals

Build:

- Referral codes.
- Referral attribution.
- Qualification policy.
- Reward calculation.
- Reward ledger posting.
- Referral dashboard.

Exit criteria:

- Self-referral impossible.
- One referrer per referred user.
- Rewards are idempotent.
- Rewards post from platform expense.

## Phase 10: Notifications and Email

Build:

- Outbox processor.
- In-app notifications.
- Resend email adapter.
- Email templates.
- Resend webhook handling.
- Admin delivery visibility.

Exit criteria:

- Events produce correct notifications.
- Email retries are idempotent.
- Webhook delivery statuses update.
- Financial flows do not depend on email success.

## Phase 11: Admin Operations

Build:

- Admin overview.
- User review.
- Deposit review.
- Withdrawal review.
- Settlement monitor.
- Outbox monitor.
- Audit log search.
- Role management.

Exit criteria:

- Admin actions are permission-gated.
- Admin financial actions require reason.
- Audit trail is complete.

## Phase 12: Security Hardening

Build:

- Rate limiting.
- Upload signing and scanning flow.
- Security event monitoring.
- Session revocation.
- Step-up auth.
- Secret review.
- RLS audit.

Exit criteria:

- Security tests pass.
- Admin MFA enforced.
- Webhook signatures verified.
- Sensitive data exposure review complete.

## Phase 13: Performance and Reliability

Build:

- Query optimization.
- Bundle analysis.
- Caching decisions.
- Health checks.
- Monitoring.
- Alerting.
- Backup restore drill.
- Settlement throughput tests.

Exit criteria:

- Performance budgets met.
- Restore drill completed.
- Alerts configured.
- Runbooks written.

## Phase 14: Production Certification

Build:

- Staging environment.
- Production environment.
- Release checklist.
- Legal/compliance signoff workflow.
- Final smoke tests.
- Rollback plan.

Exit criteria:

- Functional certification pass.
- Financial certification pass.
- Security certification pass.
- Operations certification pass.
- Business owner production approval.

## Recommended Build Order Summary

1. Architecture approval.
2. Project foundation.
3. Domain and financial core.
4. Database and ledger.
5. Auth and authorization.
6. Wallet.
7. Investments.
8. Settlement.
9. Payments.
10. Referrals.
11. Notifications and email.
12. Admin operations.
13. Security hardening.
14. Performance certification.
15. Production launch.

