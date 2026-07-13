# FINANCIAL_CERTIFICATION_REPORT.md

## Purpose

This report maps Phase 6 investment engine behavior to the financial invariants defined in `FINANCIAL_INVARIANTS.md`.

It exists to answer one question:

Can the investment engine preserve money correctness before deposits and withdrawals are connected?

## Certification Result

Status: PASS

Date: 2026-07-13

Branch: `phase-6-investment-engine`

The Phase 6 investment engine satisfies the financial invariants required for investment activation, ROI settlement, maturity release, recovery, and reconciliation.

## Fixed Financial Fixtures

These fixtures are the human-readable examples used to review the automated suite.

| Fixture | Scenario | Expected Result | Evidence |
| --- | --- | --- | --- |
| Whole-cent ROI | `$10,000.00`, `1%` daily, `3` days | `$100.00` posts each day; `$300.00` total ROI | `roi-math.test.ts` |
| Residual carry | Principal and bps combination with sub-minor remainder | Residual carries until whole minor unit exists; no fractional cash posts | `roi-math.test.ts` |
| Final promised absorption | Promised-total plan with rounding residual | Final earning date posts remaining whole-minor ROI exactly | `roi-math.test.ts`, mathematical proof |
| One-minor principal | `1` minor unit principal | ROI never becomes negative; tiny residuals do not post fractional cash | `roi-math-certification.test.ts` |
| Zero ROI | `0` daily and total ROI | Settlement records skip behavior; no cash ledger posting occurs | `roi-math-certification.test.ts` |
| Capped ROI | Daily formula exceeds total cap | Total settlement never exceeds promised cap | `roi-math-certification.test.ts` |
| Uncapped term | No total cap | Total equals deterministic floor of cumulative micro-minor ROI | `roi-math-certification.test.ts` |
| DST start | Settlement over New York spring transition | Calendar day count remains correct | `new-york-calendar.test.ts` |
| DST end | Settlement over New York fall transition | Calendar day count remains correct | `new-york-calendar.test.ts` |
| Leap year | February 29 in earning window | Leap day is a normal New York financial day | `new-york-calendar.test.ts` |
| Duplicate activation | 500 same-key workers | One investment and one funding posting | `investment-engine-concurrency.test.ts` |
| Duplicate settlement | 500 same investment-date workers | One settlement item, one ROI ledger entry, one ledger posting | `investment-engine-concurrency.test.ts` |
| Duplicate maturity | 500 final-day workers | One principal release | `investment-engine-concurrency.test.ts` |
| Partial recovery | One item committed, later item interrupted | Rerun skips committed item and processes the remainder | `investment-engine-recovery.test.ts` |
| Maturity rollback | Failure during release | No partial principal release survives; rerun releases once | `investment-engine-recovery.test.ts` |

## Invariant Coverage

| Invariant Area | Result | Evidence |
| --- | --- | --- |
| Ledger is source of truth | PASS | Ledger posting tests, investment service tests, recovery rollback tests |
| Wallet balances are projections | PASS | Funding, ROI, and maturity paths update projections only through ledger-backed postings |
| Ledger postings balance | PASS | `ledger-posting.test.ts`, repository constraints, service tests |
| Ledger immutability | PASS | Persistence design, repository update boundaries, no application rewrite path |
| No partial financial commits | PASS | Transaction wrapper tests and recovery rollback tests |
| Investment terms are snapshotted | PASS | Activation service stores plan terms on investment records |
| Plan changes do not affect existing investments | PASS | Settlement uses investment snapshot fields |
| ROI uses snapshot values | PASS | Settlement uses stored `dailyRoiBps`, `totalRoiBps`, `termDays`, and `promisedRoiMinor` |
| New York financial day | PASS | Calendar tests cover DST, leap-year, month-end, and year-end boundaries |
| One settlement per completed earning date | PASS | Settlement item uniqueness and duplicate-run tests |
| Live earnings are visual-only | PASS | Domain tests verify no wallet, ledger, settlement, or maturity mutation |
| Final ROI equals promised ROI | PASS | 100,000 simulations, bps sweep, term sweep, proof review |
| Negative balances impossible under Phase 6 paths | PASS | Available-balance locking and over-lock concurrency tests |
| Duplicate crediting impossible under Phase 6 paths | PASS | Idempotency, unique constraints, row-lock, and concurrency tests |
| Financial events are auditable | PASS | Ledger transaction, settlement run, settlement item, and ROI ledger records preserve event evidence |
| Row locking is mandatory | PASS | Transactional repository paths and lock-contention tests |
| Retries are idempotent | PASS | PostgreSQL retry tests and recovery tests |
| Jobs may resume after interruption | PASS | Recovery tests over failed and partially committed settlement runs |
| Reconciliation is available | PASS | Settlement reconciliation helper and post-recovery reconciliation tests |

## Mathematical Correctness

Result: PASS

The ROI engine uses integer minor units and micro-minor residual accounting. The certification suite verifies:

- No floating-point money calculations.
- Exact promised-total settlement for supported plan policies.
- Deterministic residual carry.
- Final whole-minor residual absorption.
- No sub-minor cash posting.
- BigInt safety beyond JavaScript number precision.

The mathematical proof in `docs/operations/PHASE_6_ROI_MATHEMATICAL_PROOF.md` was reviewed against the final Phase 6 implementation and test suite.

## Settlement Correctness

Result: PASS

Settlement is allowed only for completed New York financial days. The service rejects attempts to settle the current New York day and stores settlement evidence through settlement runs, settlement items, ROI ledger entries, and ledger transactions.

Duplicate settlement attempts resolve to one durable financial effect.

## Maturity Correctness

Result: PASS

Maturity occurs on the final earning date after settlement eligibility is satisfied. Principal release is ledger-backed and idempotent. Recovery tests prove failed maturity release does not leave partially released principal.

## Recovery Correctness

Result: PASS

The engine can resume after failures before item processing, after partial item commits, inside item transactions, and during maturity release.

Committed settlement items are replay-safe no-ops. Unprocessed items remain eligible for the next run.

## Reconciliation Correctness

Result: PASS

Reconciliation compares investment totals, settlement items, ROI ledger entries, and ledger postings. Recovery tests verify reconciliation remains clean after resumed settlement runs.

## Remaining Financial Restrictions

The following remain forbidden until later phases:

- Deposits funding investments.
- Withdrawals reading available funds.
- Payment provider webhooks.
- Referral commissions.
- Admin financial overrides.
- Customer financial UI.

Any later phase that changes a financial invariant must update `FINANCIAL_INVARIANTS.md`, `FINANCIAL_TEST_MATRIX.md`, and the relevant certification tests before merge.
