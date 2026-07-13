# Changelog

All notable project releases are recorded here.

Unique Sky Way V2 follows semantic versioning for certified phase releases:

- Major version: foundational platform generation or incompatible platform direction.
- Minor version: certified product phase completion.
- Patch version: fixes, documentation corrections, and certification-preserving maintenance.

Every release must be backed by a clean build, passing tests, an immutable Git commit, and a pushed Git tag.

## Unreleased

Added:

- Added `ENGINEERING_PRINCIPLES.md` as the decision lens for future engineering trade-offs, code review, financial work, and Phase 6 boundaries.
- Added Phase 6 investment engine domain math, New York calendar handling, ledger posting validation, settlement reconciliation helpers, and mathematical ROI proof.
- Added Phase 6 investment engine application service for investment activation, ROI settlement, live earnings previews, maturity principal release, and reconciliation without deposits or withdrawals.
- Added Phase 6 database migration for investment term snapshots, investment idempotency, settlement residual explanation fields, and calculation versioning.
- Added financial tests for ROI residuals, promised ROI exactness, New York DST boundaries, ledger balancing, settlement orchestration, maturity release, idempotency, and reconciliation.
- Added `FINANCIAL_TEST_MATRIX.md` to define Phase 6.1 mathematics, Phase 6.2 concurrency, Phase 6.3 recovery, and Phase 6.4 certification coverage requirements.

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

- v2.1.0 - Investment Engine
- v2.2.0 - Money Movement
- v2.3.0 - Admin Portal
- v2.4.0 - Communication System
- v2.5.0 - Public Website
- v2.6.0 - Production Hardening
- v2.7.0 - Final Production Certification
