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
9. Customer Experience Platform (Milestone 5 / `v3.0.0`).
10. Production hardening.
11. Final launch certification.

This document must stay consistent with:

- `FINANCIAL_INVARIANTS.md`
- `FINANCIAL_TEST_MATRIX.md`
- `PAYMENT_ARCHITECTURE.md`
- `LEDGER_POSTING_RULES.md`
- `WEBHOOK_SPECIFICATION.md`
- `CHANGELOG.md`
- `DECISIONS.md`
- `ENGINEERING_PRINCIPLES.md`
- `LEGACY_FEATURE_EXTRACTION.md`

If this roadmap conflicts with those documents, stop and reconcile the documentation before implementation continues.

## Roadmap Rules

- `main` must remain stable and releasable.
- Active phase work must happen on a phase branch.
- Completed phases must be verified, committed, pushed, and tagged before merge.
- Architectural changes require an ADR in `DECISIONS.md`.
- Financial behavior must obey `FINANCIAL_INVARIANTS.md`.
- Phase scope must not bleed into later phases.
- V1 may be consulted only as a **screen reference library** when a specific page is about to be designed. Extract journey, copy hierarchy, and useful flows only. V1 code, schema, services, middleware, helpers, theme markup, and architecture must never be copied.
- For Milestone 5 waves, **no implementation begins until that wave’s UX specification is approved** (`DEC-0027`, `EP-026`).

## Current Release State

| Release / Phase | Status | Branch / Tag | Notes |
| --- | --- | --- | --- |
| v2.0.0 | Certified | `v2-phase5-certified` | Architecture through Customer Experience Foundation. |
| v2.0.1 | Certified | `v2.0.1` | Financial invariants constitution. |
| v2.1.0 | Certified | `v2.1.0` | Investment engine certified. |
| v2.2.0 | Certified | `v2.2.0` | Money movement certified. |
| v2.3.0 | Certified / Frozen | `v2.3.0` | Administrative platform certified. Locked by `DEC-0025`. |
| Phase 6.0 | Included | `v2.1.0` | Investment engine core certified. |
| Phase 6.1 | Included | `v2.1.0` | Financial mathematics certified. |
| Phase 6.2 | Included | `v2.1.0` | Financial concurrency certified. |
| Phase 6.3 | Included | `v2.1.0` | Financial recovery certified. |
| Phase 6.4 | Included | `v2.1.0` | Investment engine final certification verified. |
| Payment Architecture | Complete | `main` | Phase 7 money movement governance checkpoint. |
| Ledger Posting Rules | Complete | `main` | Accounting specification for approved financial postings. |
| Webhook Specification | Complete | `main` | External provider webhook constitution. |
| Phase 7 | Certified / Frozen | `v2.2.0` | Deposit engine, withdrawal engine, Paystack provider, money-movement certification. Locked by `DEC-0022`. |
| Phase 8 | Certified / Frozen | `v2.3.0` | Administrative platform. Locked by `DEC-0025`. |
| Milestone 5 | Certified / Frozen | `v3.0.0` | Wave A public trust. Locked by `DEC-0029` after Wave A.5 PASS. |

After `v2.3.0` is tagged, `main` becomes the stable recovery checkpoint for **Milestone 5 — Customer Experience Platform (`v3.0.0`)**.

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

Status: Certified for `v2.1.0`.

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

Status: Complete.

Mission:

Certify the investment engine as production-grade and prepare the `v2.1.0` release.

Exit criteria:

- Phase 6.1 mathematics certification complete.
- Phase 6.2 concurrency certification complete.
- Phase 6.3 recovery certification complete.
- Performance targets in `FINANCIAL_TEST_MATRIX.md` reviewed.
- Documentation consistency audit complete.
- Architecture and scope leak audit complete.
- Certification reports created:
  - `INVESTMENT_ENGINE_CERTIFICATION.md`.
  - `FINANCIAL_CERTIFICATION_REPORT.md`.
  - `PERFORMANCE_CERTIFICATION.md`.
  - `PHASE_6_FINAL_REPORT.md`.
- Full verification passed on `phase-6-investment-engine`.
- Branch merges to `main`.
- Full verification passes on `main`.
- Tag `v2.1.0` is created and pushed.

## Phase 7 - Money Movement

Status: Certified.

Build only after Phase 6 certification, `PAYMENT_ARCHITECTURE.md` approval, `LEDGER_POSTING_RULES.md` approval, and `WEBHOOK_SPECIFICATION.md` approval.

### Phase 7.0 - Webhook Constitution

Status: Complete.

Delivered:

- Paystack-targeted webhook specification.
- Future provider extension rules for Flutterwave and Stripe.
- Signature verification policy.
- Replay and duplicate policy.
- Failure recovery policy.
- Webhook security and testing requirements.

### Phase 7.1 - Deposit Engine

Status: Complete.

Delivered:

- Payment provider abstraction.
- Deposit intent flow.
- Provider webhook handling.
- Deposit confirmation, cancellation, reversal, recovery, retry, and dead-letter handling.

### Phase 7.2 - Withdrawal Engine

Status: Complete.

Delivered:

- Withdrawal request flow.
- Withdrawal reservation.
- Withdrawal approval and rejection.
- Payout provider abstraction.
- Reversals and failures.

### Phase 7.3 - Provider Integration

Status: Complete.

Delivered:

- Paystack provider adapter under DEC-0021.
- Paystack signature verification.
- Paystack webhook event processing.
- Provider retry and duplicate protection.
- Provider failure recovery.

### Phase 7.4 - Financial Certification

Status: Complete.

Certified:

- Money cannot disappear.
- Money cannot duplicate.
- Webhooks are idempotent.
- Retries are safe.
- Deposits reconcile.
- Withdrawals reconcile.
- Ledger always balances.

Exit criteria:

- Concrete provider ADR is accepted before production provider code merges.
- Ledger postings match `LEDGER_POSTING_RULES.md`.
- Webhooks match `WEBHOOK_SPECIFICATION.md`.
- Duplicate provider webhooks are idempotent.
- Deposits credit only after confirmation.
- Withdrawal reservation is ledger-backed.
- Withdrawal rejection releases funds through ledger.
- Payout retries cannot pay twice.
- Money movement emails and notifications are outbox-driven.
- Reconciliation coverage exists for provider, ledger, and wallet state.

Release gate:

- Full verification passed on `phase-7.1-deposit-engine`.
- Branch merges to `main`.
- Full verification passes on `main`.
- Tag `v2.2.0` is created and pushed.
- Certification reports: `PHASE_7_VERIFICATION_REPORT.md`, `MONEY_MOVEMENT_FINANCIAL_CERTIFICATION.md`.

## Phase 8 - Admin Portal

Status: In Progress.

Branch: `phase-8-admin-platform`

Recovery base: `v2.2.0` / `DEC-0022` frozen money movement.

Build:

### Phase 8.1 - Customer Administration

Status: Complete (APIs).

- Customer search
- Customer details
- Customer profile
- Customer status
- Customer verification
- Customer suspension
- Customer reactivation
- Customer notes
- Customer audit timeline

### Phase 8.2 - Financial Operations

Status: Complete (APIs).

- Deposit queue, search, filters, details, timeline, notes, approval, rejection
- Withdrawal queue, search, filters, details, timeline, notes, approval, rejection, processing queue
- Investment viewer (read-only)
- Settlement viewer (read-only)
- Financial monitoring and admin overview metrics

No new money-movement logic. Uses certified deposit and withdrawal engines only.

### Phase 8.3 - Roles, Permissions & System Administration

Status: Complete (APIs).

- Configurable roles and database-backed permissions (`ADMIN_PERMISSION_MATRIX.md`)
- Staff accounts: search, details, invite, activate/disable, lock/unlock, password reset, force password change, sessions, login history
- Feature flags (schedule, percentage rollout, internal-only)
- System settings
- Email and notification template catalogs (preview / enable / disable / test)
- Audit viewer, security center, background job retry/cancel, system health

Authorization for Phase 8.1/8.2 now resolves through permission keys, not hardcoded role maps.

### Phase 8.4 - Reporting & Exports

Status: Complete (APIs).

- `REPORTING_SPECIFICATION.md` governance for read-only projections
- Executive dashboard metrics
- Customer, financial, operational, and system reports
- CSV and Excel exports with audited `report.exported` events
- America/New_York period aggregation for financial series
- Permission keys: `reports.read`, `reports.export`

### Phase 8.5 - Admin UI/UX Polish & Certification

Status: Complete / Frozen at `v2.3.0`.

- Admin UI polish over certified APIs
- Full Phase 8 verification and certification package
- Release tag: `v2.3.0`
- Freeze decision: `DEC-0025`

Exit criteria met:

- Admin actions are permission-gated.
- Admin financial actions require reason.
- Admin workflows never bypass domain services, ledger postings, audit logs, transactions, or idempotency.
- Frozen money-movement behavior from `v2.2.0` is unchanged.
- Administrative Platform frozen for future ADR-gated changes only.

## Milestone 5 - Customer Experience Platform (`v3.0.0`)

Status: Stage 1 approved; Stage 2 ready for sprint execution.

Governance baseline: `LEGACY_FEATURE_EXTRACTION.md`, `WAVE_A_UX_SPECIFICATION.md` (`DEC-0028`), `BRAND_ASSETS_SPECIFICATION.md`, `DEC-0026`, `DEC-0027`, `EP-026`.

This is **not** a communications-only phase and **not** a V1 rebuild.

It is customer-facing product UX built **on top of** frozen Identity, Investment Engine (`v2.1.0`), Money Movement (`v2.2.0`), and Administrative Platform (`v2.3.0`).

**Wave process (required):** Design → Approve → Implement → Test → Audit → Freeze.

Legacy V1 is a **screen reference library**. When a specific page is about to be designed, open only that page: extract sections, customer flow, and messaging; discard HTML, CSS, JS, PHP, and theme code; redesign from scratch; approve; then implement.

### Wave A - Trust & Public Presence

#### Stage 1 — UX & Design — APPROVED (`DEC-0028`)

Design authority: `WAVE_A_UX_SPECIFICATION.md`  
Brand assets authority: `BRAND_ASSETS_SPECIFICATION.md`

#### Stage 2 — Implementation (sprint-bounded)

Do **not** implement all of Wave A in one pass. Execute and freeze:

| Sprint | Scope | Exit |
| --- | --- | --- |
| **A1** | Navigation, header, footer, global public layout, SEO foundation, theme/tokens, public shell | **Certified** — `SPRINT_A1_CERTIFICATION.md` |
| **A2** | Homepage only | **Certified** — `SPRINT_A2_CERTIFICATION.md` |
| **A3** | About, How it Works, Security | **Certified** — `SPRINT_A3_CERTIFICATION.md` |
| **A4** | Investment Plans, FAQ, Contact | **Certified** — `SPRINT_A4_CERTIFICATION.md` |
| **A5** | Legal pages, 404 polish, performance, accessibility, Wave A certification | **Certified** — `SPRINT_A5_CERTIFICATION.md` |

**Wave A.5 Review:** PASS (98.6 / 100). Merged, tagged `v3.0.0`, frozen under `DEC-0029`.

**Next:** Wave B Customer Money Experience certified and frozen at `v3.1.0` (`DEC-0043`). Growth/polish trains follow under Design → Approve → Implement.

Auth visual polish and branded auth/security emails may land in A1–A5 where they touch the public shell or certification—without expanding into Wave B money UX.

### Wave B - Money Experience (`v3.1.0`)

**Philosophy:** *What happens after I sign in?*  
**UX constitution:** `CUSTOMER_EXPERIENCE_PRINCIPLES.md`  
**Governance:** Design → Approve → Implement (`DEC-0027`, `EP-026`)

#### Stage 1 — UX & Design (no production code)

Deliver and approve as one package:

| Document | Role |
| --- | --- |
| `WAVE_B_UX_SPECIFICATION.md` | Screen journeys, IA, dashboard as home-screen north star |
| `FINANCIAL_VISUALIZATION_GUIDE.md` | Money, progress, charts, NY time, Accrued/Credited/Withdrawable visuals |
| `FINANCIAL_MICROCOPY_GUIDE.md` | Authenticated financial writing voice (labels, statuses, emails, errors) |
| `EMPTY_STATES_GUIDE.md` | Educating empty/first-use states |
| `STATUS_SYSTEM.md` | Customer labels, tones, explanations, next steps for domain statuses |

Must also cover: notifications, mobile behaviour, loading/error recovery, financial psychology, celebration moments, and trust after login — under `CUSTOMER_EXPERIENCE_PRINCIPLES.md` + `EP-029` (one primary question per screen).

#### Stage 2 — Implementation (sprint-bounded)

| Sprint | Scope | Exit |
| --- | --- | --- |
| **B1** | Dashboard / money nav shells + widget framework | **Certified** — `SPRINT_B1_CERTIFICATION.md` (`DEC-0034`) |
| **B2** | Portfolio, investment cards/detail, progress, NY settlement visualization | **Certified** — `SPRINT_B2_CERTIFICATION.md` (`DEC-0036`/`DEC-0037`); principles `DEC-0035` |
| **B3** | Wallet, deposit/withdrawal journeys, ledger, transaction history | **Certified** — `SPRINT_B3_CERTIFICATION.md` (`DEC-0039`/`DEC-0040`); principles `DEC-0038` |
| **B4** | Notifications, financial timeline/activity, referral summary, help | **Certified** — `SPRINT_B4_CERTIFICATION.md` (`DEC-0042`); principles `DEC-0041` |
| **B5** | Certification package (+ `FINANCIAL_DASHBOARD_PRINCIPLES.md`), a11y, performance, security, tag `v3.1.0` | **Certified** — `SPRINT_B5_CERTIFICATION.md` / `WAVE_B_CERTIFICATION.md` (`DEC-0043`) |

All Wave B screens consume certified engines/APIs. No new ledger, ROI, deposit, withdrawal, webhook, or Paystack behavior without ADR + recertification.

Honest language required: **Accrued ≠ Credited ≠ Withdrawable**.

### Wave C - Growth & Support

Same Design → Approve → Implement discipline:

- Referral hub (privacy-safe)
- Help center / in-app help
- Onboarding checklist for unfunded accounts
- Customer education surfaces

### Wave D - Polish

Same Design → Approve → Implement discipline:

- Charts
- PWA install improvements
- Customer KYC UX
- Saved payout destinations
- Statement exports
- Optional live chat / push/SMS only after earlier waves are solid

Exit criteria for `v3.0.0`:

- Customer can discover, trust, fund, invest, track, and withdraw through production-grade UX on frozen engines.
- No frozen-core behavioral changes without ADR.
- `LEGACY_FEATURE_EXTRACTION.md` REMOVE list is honored (no FOMO theater, NFTs, loan novelty, fake social proof).
- Each wave has an approved UX specification before production implementation (`DEC-0027`).

## Phase 11 - Production Hardening

Status: Pending (after Milestone 5 / `v3.0.0`).

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

## Planned Release Tags / Release Trains

| Tag | Meaning |
| --- | --- |
| `v2.0.0` | Certified foundation through Phase 5. |
| `v2.0.1` | Financial constitution patch. |
| `v2.1.0` | Investment engine certified. |
| `v2.2.0` | Money movement certified. |
| `v2.3.0` | Admin portal certified. |
| `v3.0.0` | Customer Experience Platform — Wave A public trust (sprints A1–A5). |
| `v3.1.0` | Customer Money Experience (dashboard, wallet, portfolio, activity). |
| `v3.2.0` | Referral & Growth Experience. |
| `v3.3.0` | Mobile/PWA & Customer Delight. |
| `v4.0.0` | Enterprise & Institutional Experience (future). |

From Milestone 5 onward, prefer **release trains** (versioned customer experiences) over open-ended “phases.”

## Product Milestones (summary)

| Milestone | Release | Status |
| --- | --- | --- |
| 1 Foundation | `v2.0.0` | Complete |
| 2 Investment Platform | `v2.1.0` | Frozen |
| 3 Money Platform | `v2.2.0` | Frozen |
| 4 Administration | `v2.3.0` | Frozen |
| 5 Customer Experience | `v3.0.0` / `v3.1.0` | Wave A frozen (`DEC-0029`); Wave B frozen (`DEC-0043`) |

## Current Build Order Summary

1. `main` at **`v3.1.0`** includes certified/frozen Investment (`v2.1.0`), Money Movement (`v2.2.0`), Administrative Platform (`v2.3.0`), public Wave A (`v3.0.0`), and Customer Money Experience Wave B.
2. Public Wave A is frozen under **`DEC-0029`**. Authenticated Wave B is frozen under **`DEC-0043`**.
3. Customer money UX constitutions: portfolio, wallet, notification, financial dashboard principles + `CUSTOMER_EXPERIENCE_PRINCIPLES.md`.
4. Next: Growth & Support / polish trains (`v3.2.0`+) under Design → Approve → Implement. Do not casually reopen Wave A or Wave B.
5. Subsequent trains: `v3.2.0` growth → `v3.3.0` mobile/delight.
6. Do not reopen investment-engine, money-movement, admin-platform, public Wave A, or Wave B freezes without ADR, regression tests, and recertification.
7. Keep Paystack as the sole provider until a superseding provider ADR is accepted.
