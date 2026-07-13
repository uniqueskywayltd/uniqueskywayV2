# TESTING.md

## Purpose

This document defines the testing strategy for Unique Sky Way V2.

The platform handles financial workflows, so testing must prove correctness, not just component rendering.

## Testing Principles

- Domain logic is tested without framework dependencies.
- Financial tests use fixed deterministic fixtures.
- Integration tests verify database constraints.
- Critical workflows are tested end to end.
- Security tests are part of release certification.
- Production launch requires a certification suite.

## Unit Tests

Scope:

- Pure domain logic.
- Value objects.
- State machines.
- Policies.
- ROI formulas.
- Rounding.
- Date calculations.
- Permission decision helpers.

Examples:

- Investment first settlement date.
- Maturity date calculation.
- ROI rounding residual carry.
- Referral self-referral rejection.
- Withdrawal state transitions.
- Plan availability policy.

Rules:

- No database.
- No network.
- No real clock.
- No random values without seeded generator.

## Integration Tests

Scope:

- Repositories.
- Database constraints.
- RLS policies.
- Transaction handling.
- Ledger posting.
- Outbox writes.
- Webhook idempotency.

Examples:

- Ledger transaction must balance.
- Duplicate settlement item rejected.
- Duplicate provider event ignored.
- Customer cannot read another customer's investment through RLS.
- Withdrawal reservation and rejection occur in one transaction.

## Financial Tests

Financial tests are the highest priority.

Required fixture categories:

- Simple daily ROI.
- Rounding residual over many days.
- Final maturity residual behavior.
- DST start and end in New York.
- Leap year.
- Investment activated before midnight New York.
- Investment activated after midnight New York.
- Missed settlement catch-up.
- Duplicate settlement run.
- ROI cap.
- Referral reward.
- Withdrawal reserve and release.

Fixture format:

- Human-readable JSON or YAML.
- Inputs.
- Expected ledger entries.
- Expected settlement items.
- Expected balances.

Rule:

- Any change to ROI behavior requires updating fixtures through explicit review.

## Regression Tests

Purpose:

- Prevent previously fixed financial or security defects from returning.

Examples:

- Duplicate webhook created duplicate deposit credit.
- Settlement run skipped DST date.
- Withdrawal rejection failed to release funds.
- Plan version change altered active investment terms.

Rule:

- Every production financial incident creates a regression test.

## API Contract Tests

Scope:

- Request validation.
- Response shape.
- Error mapping.
- Auth requirements.
- Permission requirements.
- Idempotency behavior.

Critical endpoints:

- Create deposit.
- Create investment.
- Request withdrawal.
- Admin withdrawal approve/reject.
- Payment webhook.
- Settlement trigger.
- Resend webhook.

## End-to-End Tests

Customer journeys:

- Sign up, verify email, accept terms.
- Deposit confirmed through mocked provider webhook.
- Create investment.
- Run settlement.
- See ROI in dashboard.
- Mature investment.
- Request withdrawal.
- See notification history.

Admin journeys:

- Admin login with MFA.
- Review user.
- Review withdrawal.
- Run settlement replay.
- Inspect ledger transaction.
- Retry failed outbox event.

Rules:

- Use test users and test providers.
- Do not depend on real payment movement.
- Use deterministic time.

## Security Tests

Required tests:

- Unauthenticated private API access rejected.
- Customer cannot access another customer's data.
- Admin without permission cannot perform restricted action.
- Service role key never exposed to client bundle.
- Upload rejects disallowed file type and size.
- Webhook signature verification required.
- Rate limiting triggers.
- Session revocation works after account restriction.
- Step-up required for withdrawal.

## Performance Tests

Required tests before production:

- Customer dashboard query performance.
- Wallet transaction pagination.
- Admin withdrawal queue.
- Settlement throughput.
- Outbox processing throughput.
- Cold start or startup time for chosen host.
- Bundle size check.

Load scenarios:

- Many small investments.
- Few large investments.
- High notification volume.
- Webhook burst.
- Admin search over growing audit logs.

## Accessibility Tests

Required:

- Keyboard navigation.
- Form labels and errors.
- Color contrast.
- Focus states.
- Screen reader names for controls.
- Reduced motion support where relevant.

## Production Certification

Production launch requires a signed certification checklist:

### Functional

- Customer onboarding works.
- Deposits work with provider sandbox.
- Investment creation works.
- Daily settlement works.
- Catch-up settlement works.
- Maturity works.
- Withdrawals work.
- Referrals work.
- Notifications work.

### Financial

- Ledger balances reconcile.
- Financial fixtures pass.
- No unbalanced ledger transaction possible through application services.
- Duplicate settlement does not double credit.
- Duplicate webhook does not double credit.

### Security

- Admin MFA enabled.
- RLS policies tested.
- Rate limits enabled.
- Secrets reviewed.
- Upload restrictions tested.
- Webhooks signed.

### Operations

- Backups enabled.
- Restore drill completed.
- Monitoring enabled.
- Runbooks written.
- Alert recipients configured.
- Rollback process tested.

## Test Data

Rules:

- No production PII in tests.
- No real bank or payment details.
- Synthetic users only.
- Financial fixtures must be reviewable by humans.

## Test Ownership

Recommended ownership:

- Domain tests owned by engineering.
- Financial fixtures reviewed by product/finance.
- Security tests reviewed by engineering and security advisor.
- Production certification reviewed by engineering lead and business owner.

