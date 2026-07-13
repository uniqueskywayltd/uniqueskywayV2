# DEVELOPMENT_ROADMAP.md

## Purpose

This roadmap defines the official build order for Unique Sky Way V2.

It is intentionally conservative. A financial platform must be built from correctness outward:

1. Architecture.
2. Governance.
3. Persistence.
4. Identity.
5. Customer foundation.
6. Financial engine certification.
7. Money movement.
8. Admin operations.
9. Communications.
10. Public website.
11. Production hardening.
12. Final certification.

This document must stay consistent with:

- `FINANCIAL_INVARIANTS.md`
- `FINANCIAL_TEST_MATRIX.md`
- `CHANGELOG.md`
- `DECISIONS.md`
- `ENGINEERING_PRINCIPLES.md`

If this roadmap conflicts with those documents, stop and reconcile the documentation before implementation continues.

## Roadmap Rules

- `main` must remain stable and releasable.
- Active phase work must happen on a phase branch.
- Completed phases must be verified, committed, pushed, and tagged before merge.
- Architectural changes require an ADR in `DECISIONS.md`.
- Financial behavior must obey `FINANCIAL_INVARIANTS.md`.
- Phase scope must not bleed into later phases.
- V1 may be consulted only for business understanding; V1 code, schema, services, middleware, helpers, and architecture must not be copied.

## Current Release State

| Release / Phase | Status | Branch / Tag | Notes |
| --- | --- | --- | --- |
| v2.0.0 | Certified | `v2-phase5-certified` | Architecture through Customer Experience Foundation. |
| v2.0.1 | Certified | `v2.0.1` | Financial invariants constitution. |
| Phase 6.0 | Checkpoint Complete | `phase-6-investment-engine` | Investment engine core built, not merged. |
| Phase 6.1 | Complete | `phase-6-investment-engine` | Financial mathematics certified, not merged. |
| Phase 6.2 | Complete | `phase-6-investment-engine` | Financial concurrency certified, not merged. |
| Phase 6.3 | Complete | `phase-6-investment-engine` | Financial recovery certified, not merged. |
| Phase 6.4 | Next | `phase-6-investment-engine` | Investment engine final certification. |

`main` remains frozen at `v2.0.1` until Phase 6.4 passes and `v2.1.0` is tagged.

## Completed Foundation

### Phase 0 - Architecture Constitution

Status: Certified.

Delivered:

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

### Phase 0.5 - Architecture Review

Status: Certified.

Delivered:

- Independent review.
- Pass, warning, and fail assessment.
- Financial, security, performance, and maintainability scoring.

### Phase 0.6 - Final Architecture Certification

Status: Certified.

Delivered:

- Architecture certification.
- Leak audit.
- Final pre-implementation approval.

### Phase 0.7 - Governance

Status: Certified.

Delivered:

- `DECISIONS.md`.
- `GLOSSARY.md`.
- `CONTRIBUTING.md`.
- Governance consistency audit.

### Phase 1 - Engineering Foundation

Status: Certified.

Delivered:

- Next.js App Router.
- TypeScript strict mode.
- Tailwind CSS.
- ESLint and Prettier.
- Husky and lint-staged.
- shadcn/ui foundation.
- Drizzle ORM.
- Supabase abstractions.
- Resend abstraction.
- Vitest, Playwright, Testing Library.
- Environment validation.
- Error, logging, event, repository, service, email, notification, and job foundations.
- Health endpoint.
- Application shell.

### Phase 2 - Design System And UI Foundation

Status: Certified.

Delivered:

- Design token system.
- Reusable component library.
- Layout system.
- Navigation framework.
- Theme implementation.
- Component showcase.
- Accessibility and performance notes.

### Phase 3 - Domain Model And Database

Status: Certified.

Delivered:

- Drizzle schema.
- Migrations.
- Constraints and indexes.
- Repository implementations.
- Transaction wrapper.
- Ledger, wallet, investment, settlement, notification, email queue, audit, job, session, trusted device, setting, and feature-flag persistence.

### Phase 4 - Authentication And Identity

Status: Certified.

Delivered:

- Supabase Auth integration.
- Register, login, logout, email verification, password reset, password change, session refresh.
- Trusted devices.
- Session management.
- Identity email outbox.
- Profile bootstrap after verification.
- Security audit events.

### Phase 4.5 - Architecture Certification And Leak Audit

Status: Certified.

Delivered:

- Phase 0 through Phase 4 certification.
- Architecture leak audit.
- Supabase adapter boundary correction.

### Phase 5 - Customer Experience Foundation

Status: Certified.

Delivered:

- Account shell.
- Customer profile foundation.
- Preferences foundation.
- Security settings surfaces.
- Activity and notification foundations.
- Error, maintenance, offline, and forbidden surfaces.

Explicitly not delivered:

- Wallet.
- Ledger UI.
- Investments.
- Deposits.
- Withdrawals.
- ROI.
- Referrals.
- Admin product features.

### v2.0.1 - Financial Constitution

Status: Certified.

Delivered:

- `FINANCIAL_INVARIANTS.md`.
- Phase 6 milestone order.
- Prohibition on deposits and withdrawals during Phase 6.

## Active Product Roadmap

## Phase 6 - Investment Engine

Status: In progress on `phase-6-investment-engine`.

Purpose:

Build and certify the investment engine before money movement exists.

Phase 6 does not implement:

- Deposits.
- Withdrawals.
- Payment providers.
- Customer financial UI.
- Admin financial override tools.
- Provider webhooks.

### Phase 6.0 - Investment Engine Core

Status: Checkpoint complete.

Delivered:

- Investment activation service.
- Investment term snapshotting.
- Principal locking through ledger postings.
- Integer-only ROI math.
- New York settlement calendar.
- Daily settlement engine.
- Idempotent completed-run replay.
- Investment row locking.
- Maturity principal release.
- Reconciliation helpers.
- Investment engine migration.
- ROI mathematical proof document.

Exit criteria:

- Typecheck, lint, tests, DB check, build, and E2E pass.
- No scope leak into deposits, withdrawals, provider workflows, customer financial UI, or admin financial features.

### Phase 6.1 - Financial Mathematics Certification

Status: Complete.

Delivered:

- 100,000 deterministic ROI simulations.
- Daily ROI bps sweep from `0` through `10,000`.
- Term sweep from `1` through `1,825` New York earning days.
- Tiny-principal coverage.
- Large-principal bigint coverage.
- Zero-ROI coverage.
- Capped ROI coverage.
- Uncapped fixed-term ROI coverage.
- New York DST, leap-year, month-boundary, and year-boundary coverage.
- Updated financial proof and test matrix.

Exit criteria:

- All Phase 6.1 rows in `FINANCIAL_TEST_MATRIX.md` are covered or explicitly deferred by ADR.
- Full verification passes.

### Phase 6.2 - Financial Concurrency Certification

Status: Complete.

Mission:

Prove the investment engine cannot apply correct math twice.

Required stress scenarios:

- Duplicate activation requests.
- Concurrent activation requests.
- Duplicate settlement jobs.
- Multiple settlement workers racing the same investment.
- Duplicate cron execution.
- Duplicate completed-run replay.
- Duplicate maturity execution.
- Concurrent ROI and maturity on the final earning date.
- Row-lock contention.
- Ledger idempotency collision.
- Serializable transaction retry.
- Simulated deadlock retry.
- Clock skew between workers.

Exit criteria:

- No duplicate investment funding.
- No duplicate ROI ledger posting.
- No duplicate settlement item.
- No duplicate ROI ledger entry.
- No duplicate maturity principal release.
- Unique constraints backstop application-level idempotency.
- Row locks protect spendable state and investment settlement state.
- Full verification passes.

### Phase 6.3 - Financial Recovery Certification

Status: Complete.

Mission:

Prove interrupted financial jobs resume without money loss or duplication.

Required recovery scenarios:

- Failure before settlement run creation.
- Failure after settlement run creation before item processing.
- Failure after one investment commits.
- Failure inside ROI settlement transaction.
- Failure during maturity principal release.
- Retry after database timeout.
- Retry after process interruption.
- Recovery reconciliation after resumed settlement.

Exit criteria:

- Already committed settlement items replay as no-ops.
- Unprocessed investments resume safely.
- Rollbacks leave no partial settlement, ROI ledger, ledger transaction, or maturity state.
- Failed settlement runs are inspectable.
- Reconciliation passes after recovery.
- Full verification passes.

### Phase 6.4 - Investment Engine Certification

Status: Pending.

Mission:

Certify the investment engine as production-grade and prepare the `v2.1.0` release.

Exit criteria:

- Phase 6.1 mathematics certification complete.
- Phase 6.2 concurrency certification complete.
- Phase 6.3 recovery certification complete.
- Performance targets in `FINANCIAL_TEST_MATRIX.md` reviewed.
- Documentation consistency audit complete.
- Architecture and scope leak audit complete.
- Full verification passes.
- Branch merges to `main`.
- Tag `v2.1.0` is created and pushed.

## Phase 7 - Money Movement

Status: Pending.

Build only after Phase 6 certification:

- Payment provider abstraction.
- Deposit intent flow.
- Provider webhook handling.
- Deposit confirmation.
- Withdrawal request flow.
- Withdrawal reservation.
- Withdrawal approval and rejection.
- Payout provider abstraction.
- Reversals and failures.

Exit criteria:

- Duplicate provider webhooks are idempotent.
- Deposits credit only after confirmation.
- Withdrawal reservation is ledger-backed.
- Withdrawal rejection releases funds through ledger.
- Payout retries cannot pay twice.

## Phase 8 - Admin Portal

Status: Pending.

Build:

- Admin overview.
- User review.
- Deposit review.
- Withdrawal review.
- Settlement monitor.
- Ledger viewer.
- Outbox monitor.
- Audit log search.
- Role and permission management.

Exit criteria:

- Admin actions are permission-gated.
- Admin financial actions require reason.
- Admin workflows never bypass domain services, ledger postings, audit logs, transactions, or idempotency.

## Phase 9 - Communication System

Status: Pending.

Build:

- Outbox processor.
- In-app notifications.
- Resend email adapter production workflows.
- Email templates.
- Resend webhook handling.
- Delivery visibility.
- Future SMS and push extension points.

Exit criteria:

- Events produce correct notifications.
- Email retries are idempotent.
- Webhook delivery statuses update.
- Financial flows do not depend on email success.

## Phase 10 - Public Website

Status: Pending.

Build:

- Public marketing website.
- Plan education content.
- Compliance-friendly product explanations.
- Contact and support entry points.
- SEO and metadata.

Exit criteria:

- Public website is fast, accessible, brand-consistent, and does not expose authenticated or financial internals.

## Phase 11 - Production Hardening

Status: Pending.

Build:

- Rate limiting.
- Upload signing and scanning flow.
- Security monitoring.
- Session revocation checks.
- Step-up auth for sensitive operations.
- Secret review.
- RLS audit.
- Query optimization.
- Bundle analysis.
- Health checks.
- Monitoring and alerting.
- Backup restore drill.
- Runbooks.

Exit criteria:

- Security tests pass.
- Performance budgets pass.
- Restore drill completes.
- Alerts and runbooks are ready.

## Phase 12 - Final Production Certification

Status: Pending.

Build:

- Staging certification.
- Production environment certification.
- Release checklist.
- Legal and compliance signoff workflow.
- Final smoke tests.
- Rollback plan.

Exit criteria:

- Functional certification passes.
- Financial certification passes.
- Security certification passes.
- Operations certification passes.
- Business owner approves production launch.

## Planned Release Tags

| Tag | Meaning |
| --- | --- |
| `v2.0.0` | Certified foundation through Phase 5. |
| `v2.0.1` | Financial constitution patch. |
| `v2.1.0` | Investment engine certified. |
| `v2.2.0` | Money movement certified. |
| `v2.3.0` | Admin portal certified. |
| `v2.4.0` | Communication system certified. |
| `v2.5.0` | Public website certified. |
| `v2.6.0` | Production hardening certified. |
| `v3.0.0` | Final production certification. |

## Current Build Order Summary

1. Keep `main` frozen at `v2.0.1`.
2. Complete Phase 6.4 investment engine certification.
3. Merge and tag `v2.1.0`.
4. Begin Phase 7 money movement.
