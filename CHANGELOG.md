# Changelog

All notable project releases are recorded here.

Unique Sky Way V2 follows semantic versioning for certified phase releases:

- Major version: foundational platform generation or incompatible platform direction.
- Minor version: certified product phase completion.
- Patch version: fixes, documentation corrections, and certification-preserving maintenance.

Every release must be backed by a clean build, passing tests, an immutable Git commit, and a pushed Git tag.

## Unreleased

No unreleased changes.

## v2.1.0 - 2026-07-13

Status: Certified investment engine release.

Included:

- Added `ENGINEERING_PRINCIPLES.md` as the decision lens for future engineering trade-offs, code review, financial work, and Phase 6 boundaries.
- Added Phase 6 investment engine domain math, New York calendar handling, ledger posting validation, settlement reconciliation helpers, and mathematical ROI proof.
- Added Phase 6 investment engine application service for investment activation, ROI settlement, live earnings previews, maturity principal release, and reconciliation without deposits or withdrawals.
- Added Phase 6 database migration for investment term snapshots, investment idempotency, settlement residual explanation fields, and calculation versioning.
- Added financial tests for ROI residuals, promised ROI exactness, New York DST boundaries, ledger balancing, settlement orchestration, maturity release, idempotency, and reconciliation.
- Added `FINANCIAL_TEST_MATRIX.md` to define Phase 6.1 mathematics, Phase 6.2 concurrency, Phase 6.3 recovery, and Phase 6.4 certification coverage requirements.
- Added Phase 6.1 mathematics certification coverage for 100,000 deterministic ROI simulations, certified daily ROI bps sweep, certified term-duration sweep, zero ROI, capped ROI, uncapped fixed-term ROI, large-principal bigint safety, and New York leap/month/year boundaries.
- Reconciled `DEVELOPMENT_ROADMAP.md` with the certified Phase 0 through Phase 6.1 sequence and the Phase 6.2, 6.3, and 6.4 certification path.
- Added financial performance and impossibility targets to `FINANCIAL_TEST_MATRIX.md`.
- Added Phase 6.2 concurrency stress coverage for 500-worker duplicate activation, 500-worker available-balance lock contention, 500 duplicate cron settlement executions, 500 racing final-day settlement workers, and duplicate ledger idempotency collisions.
- Added PostgreSQL transaction retry handling and tests for serialization failures (`40001`) and deadlocks (`40P01`).
- Completed Phase 6.2 financial concurrency certification in the roadmap and financial test matrix.
- Added Phase 6.3 recovery certification coverage for failed run creation, pre-item interruption, partial committed runs, ROI transaction rollback, maturity rollback, timeout-like retry, process restart, failed-run inspection, and post-recovery reconciliation.
- Extended PostgreSQL transaction retry handling to query timeout failures (`57014`).
- Fixed settlement failure handling so errors after run creation but before item processing mark the settlement run as failed.
- Completed Phase 6.3 financial recovery certification in the roadmap and financial test matrix.
- Added Phase 6.4 certification reports for investment engine readiness, financial invariant coverage, performance certification, and final Phase 6 release readiness.
- Added Phase 6.4 investment engine performance benchmark coverage for activation service work, single settlement service work, and 10,000-investment settlement service work.
- Closed the Phase 6 financial test matrix certification gates for architecture boundaries, scope boundaries, invariant coverage, fixed fixtures, proof review, performance, documentation synchronization, and release readiness.
- Completed Phase 6.4 final verification on the phase branch: typecheck, lint, test, database check, build, and E2E.

Verification:

- Typecheck passed.
- Lint passed.
- Unit and integration tests passed: 29 test files, 98 tests.
- Database schema check passed.
- Production build passed.
- End-to-end tests passed: 8 tests.

Scope certification:

- No deposits, withdrawals, payment provider workflows, customer financial UI, admin financial operations, or financial override tools were implemented.
- Investment engine certification is backed by `INVESTMENT_ENGINE_CERTIFICATION.md`, `FINANCIAL_CERTIFICATION_REPORT.md`, `PERFORMANCE_CERTIFICATION.md`, and `PHASE_6_FINAL_REPORT.md`.

## v2.0.1 - 2026-07-13

Status: Financial governance patch.

Included:

- Added `FINANCIAL_INVARIANTS.md` as the permanent rulebook for ledger, wallet, investment, ROI, settlement, maturity, withdrawal, referral, concurrency, reconciliation, background job, and financial testing invariants.
- Defined Phase 6 internal milestone order and certification requirements.
- Explicitly prohibited deposits and withdrawals during Phase 6.

Verification:

- Typecheck passed.
- Lint passed.

## v2.0.0 - 2026-07-13

Status: Certified foundation release.

Certification tag: `v2-phase5-certified`

Included:

- Phase 0 - Architecture Constitution
- Phase 0.5 - Independent Architecture Review
- Phase 0.6 - Final Architecture Certification
- Phase 0.7 - Governance
- Phase 1 - Engineering Foundation
- Phase 2 - Design System and UI Foundation
- Phase 3 - Domain Model and Database
- Phase 4 - Authentication and Identity
- Phase 4.5 - Architecture Certification and Leak Audit
- Phase 5 - Customer Experience Foundation

Verification:

- Build passed.
- Typecheck passed.
- Lint passed.
- Unit tests passed.
- Database schema check passed.
- End-to-end tests passed.

Scope certification:

- No wallet, ledger, investment, deposit, withdrawal, ROI, referral, admin product surface, or financial workflow was implemented in Phase 5.
- Customer-facing account foundations are ready for future financial modules.

## Planned Releases

- v2.2.0 - Money Movement
- v2.3.0 - Admin Portal
- v2.4.0 - Communication System
- v2.5.0 - Public Website
- v2.6.0 - Production Hardening
- v2.7.0 - Final Production Certification
