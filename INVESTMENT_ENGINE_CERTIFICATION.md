# INVESTMENT_ENGINE_CERTIFICATION.md

## Purpose

This document certifies the Unique Sky Way V2 investment engine before money movement, deposits, withdrawals, payment provider workflows, customer financial UI, or admin financial override tools are connected to it.

Phase 6.4 does not introduce new product functionality. It reviews and certifies the behavior already built in Phase 6.0, Phase 6.1, Phase 6.2, and Phase 6.3.

## Certification Decision

Status: Certified for `v2.1.0` release preparation.

Date: 2026-07-13

Branch: `phase-6-investment-engine`

The investment engine is approved for merge after the certification commit is pushed.

## Certified Scope

The certification covers:

- Investment plan version snapshot usage.
- Investment activation.
- Principal locking through ledger-backed wallet projection changes.
- Integer-only ROI mathematics.
- New York financial-day settlement rules.
- Daily settlement processing.
- Idempotent completed-run replay.
- Duplicate settlement prevention.
- Maturity principal release.
- Live earnings preview calculations.
- Settlement and ledger reconciliation.
- Transaction retry behavior for serialization, deadlock, and query-timeout failures.
- Recovery from interrupted settlement and maturity workflows.

The certification explicitly excludes:

- Deposits.
- Withdrawals.
- Payment provider integrations.
- Provider webhooks.
- Customer wallet, investment, or ROI pages.
- Admin financial operations.
- Manual financial overrides.

## Certification Summary

| Area | Result | Evidence |
| --- | --- | --- |
| Mathematical correctness | PASS | `src/domains/roi/roi-math-certification.test.ts`, `src/domains/roi/roi-math.test.ts`, `docs/operations/PHASE_6_ROI_MATHEMATICAL_PROOF.md` |
| New York date handling | PASS | `src/domains/settlement/new-york-calendar.test.ts` |
| Activation lifecycle | PASS | `src/application/investments/investment-engine-service.test.ts`, `src/application/investments/investment-engine-concurrency.test.ts` |
| Settlement lifecycle | PASS | `src/application/investments/investment-engine-service.test.ts`, `src/application/investments/investment-engine-concurrency.test.ts`, `src/application/investments/investment-engine-recovery.test.ts` |
| Maturity lifecycle | PASS | `src/application/investments/investment-engine-service.test.ts`, `src/application/investments/investment-engine-concurrency.test.ts`, `src/application/investments/investment-engine-recovery.test.ts` |
| Ledger integrity | PASS | `src/domains/ledger/ledger-posting.test.ts`, repository tests, recovery tests, reconciliation tests |
| Concurrency | PASS | `src/application/investments/investment-engine-concurrency.test.ts`, transaction retry tests |
| Recovery | PASS | `src/application/investments/investment-engine-recovery.test.ts`, transaction rollback tests |
| Performance | PASS | `src/application/investments/investment-engine-performance.test.ts`, `PERFORMANCE_CERTIFICATION.md` |
| Architecture boundaries | PASS | Manual boundary audit documented in this report |
| Scope boundaries | PASS | Manual scope leak audit documented in this report |

## Mathematical Certification

The Phase 6.1 mathematics suite certifies that ROI calculations use integer arithmetic and that promised-total plans settle to the exact promised ROI policy.

Certified envelope:

- Daily ROI basis points: `0` through `10,000`.
- Term duration: `1` through `1,825` New York earning days.
- Randomized principal coverage: `1` through `10,000,000,000` minor units.
- Large principal coverage: up to `9,999,999,999,999,999` minor units.
- Simulation count: 100,000 deterministic randomized promised-total simulations.

Final residual policy:

- Whole minor-unit ROI is cash-settled.
- Sub-minor residual is never posted as cash.
- Final-day promised-total settlement absorbs any whole-minor residual required to match promised ROI.
- Non-cash residual evidence is retained through settlement residual metadata and the mathematical proof.

## Concurrency Certification

Phase 6.2 certifies that correct math cannot be applied twice.

The engine is protected by:

- Idempotency keys.
- Transaction boundaries.
- Row locks for wallet and investment state.
- Unique constraints for settlement item uniqueness.
- Unique constraints for ledger transaction idempotency.
- Retry-safe transaction management for PostgreSQL retryable errors.

Certified race scenarios include:

- 500 concurrent duplicate activation attempts.
- 500 concurrent unique activation attempts against one available balance.
- 500 duplicate cron settlement executions.
- 500 workers racing the same investment settlement date.
- 500 final-day settlement workers racing ROI and maturity release.
- Duplicate ledger idempotency key collisions.
- Serializable retry handling.
- Deadlock retry handling.
- Clock-skew attempts to settle the current New York day early.

## Recovery Certification

Phase 6.3 certifies that interrupted financial jobs resume without money loss or duplication.

Certified recovery scenarios include:

- Failure before settlement run creation.
- Failure after settlement run creation and before item processing.
- Failure after one investment commits.
- Failure inside the ROI settlement transaction.
- Failure during maturity principal release.
- Query-timeout retry behavior.
- Process restart with durable state reuse.
- Failed settlement run inspection.
- Reconciliation after resumed settlement.

## Ledger Certification

The ledger remains the single source of truth.

Certified ledger properties:

- Ledger transactions are balanced.
- Wallet balances are projections only.
- Investment funding moves available principal to locked principal.
- ROI settlement credits available balance through ledger postings.
- Maturity principal release moves locked principal back to available balance.
- Duplicate ledger idempotency keys are rejected.
- Rollbacks leave no partial settlement item, ROI ledger entry, ledger transaction, or wallet projection change.

No wallet balance mutation is certified unless it is derived from an approved ledger posting path.

## Architecture Boundary Audit

Manual audit result: PASS.

Audit checks performed:

- Domain files do not import application, infrastructure, Next.js, or React modules.
- Investment application services orchestrate use cases and do not own raw SQL.
- Persistence is owned by infrastructure repositories.
- Transaction boundaries are owned by the transaction manager abstraction.
- Financial code remains independent of UI and route handlers.

No architecture boundary violations were found.

## Scope Leak Audit

Manual audit result: PASS.

Audit checks performed:

- No deposit implementation exists in Phase 6 code.
- No withdrawal implementation exists in Phase 6 code.
- No payment provider workflow exists in Phase 6 code.
- No provider webhook exists in Phase 6 code.
- No customer financial UI was added.
- No admin financial operation or override surface was added.
- No direct investment or settlement API route was added.

Only roadmap and future certification placeholder references mention payment-provider behavior.

## Security Review

Manual security review result: PASS.

Certified properties:

- No Supabase service-role key usage exists in investment domain or application services.
- No `NEXT_PUBLIC` service secret exposure exists.
- No service-role adapter was introduced.
- Application and domain layers do not execute raw SQL.
- Financial writes use the transaction manager abstraction.
- Business logic remains outside repositories.
- Repositories remain persistence adapters and do not calculate ROI policy.

## Release Readiness

The investment engine passed final branch verification and is ready for release preparation.

Next release steps:

1. Commit and push Phase 6.4 certification.
2. Merge `phase-6-investment-engine` into `main`.
3. Tag `v2.1.0`.
4. Push the tag to GitHub.
5. Keep `main` frozen until Phase 7 starts on a new branch.

## Certification Caveats

Production database throughput must be revalidated in staging before launch traffic is allowed. Phase 6.4 certifies service-work performance and transaction-safety behavior, not cPanel hosting throughput under production load.

Money movement remains out of scope until Phase 7.
