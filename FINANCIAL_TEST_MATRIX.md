# FINANCIAL_TEST_MATRIX.md

## Purpose

This document is the permanent verification matrix for Unique Sky Way V2 financial behavior.

It defines what must be proven before financial phases are certified.

It does not define UI, API design, marketing copy, or provider implementation details.

It exists so future engineers, reviewers, and auditors can see:

- Which financial scenarios are required.
- Which invariant IDs each scenario protects.
- What outcome is expected.
- Whether the scenario is already covered by automated tests.
- Which phase owns unfinished coverage.

## Authority

This matrix supports:

- `FINANCIAL_INVARIANTS.md`
- `ROI_ENGINE.md`
- `TESTING.md`
- `docs/operations/PHASE_6_ROI_MATHEMATICAL_PROOF.md`

Any change to financial behavior must update this matrix when it adds, removes, or changes required verification scenarios.

## Scope Rules

Phase 6 is investment-engine-only.

Phase 6 may verify:

- Investment activation.
- Plan term snapshotting.
- Principal locking.
- ROI mathematics.
- New York settlement dates.
- Settlement items.
- ROI ledger entries.
- Maturity principal release.
- Reconciliation.
- Financial job retry, resume, and idempotency.

Phase 6 must not implement:

- Deposits.
- Withdrawals.
- Payment provider workflows.
- Customer financial UI.
- Admin financial override tools.
- Provider webhooks.

Deposit, withdrawal, provider, and referral rows may appear in this matrix as future certification placeholders, but they are not Phase 6 implementation scope.

## Status Legend

| Status | Meaning |
| --- | --- |
| Covered | Automated tests already verify the scenario at the current required depth. |
| Partial | Automated tests exist, but certification requires broader coverage. |
| Required | Scenario must be implemented before the owning certification can pass. |
| Future Phase | Scenario is intentionally out of scope for the current phase. |
| Manual Review | Scenario requires human review in addition to automated tests. |

## Phase 6 Certification Structure

| Milestone | Name | Certification Question |
| --- | --- | --- |
| Phase 6.1 | Financial Mathematics Certification | Does every supported investment settle to the exact promised ROI policy using integer arithmetic? |
| Phase 6.2 | Financial Concurrency Certification | Can duplicate or concurrent workers double-credit, double-lock, or double-release funds? |
| Phase 6.3 | Financial Recovery Certification | Can interrupted financial jobs resume without losing or duplicating money? |
| Phase 6.4 | Investment Engine Certification | Do architecture, math, concurrency, recovery, performance, and documentation all pass together? |

## Financial Performance And Impossibility Targets

These targets are part of the certification contract.

Latency targets exclude unavoidable external database, network, hosting, and provider latency unless a benchmark explicitly includes those layers.

| Metric | Target | Certification Evidence |
| --- | ---: | --- |
| Activate investment service work | `< 100 ms` excluding DB/network latency | Phase 6.4 benchmark |
| Settle one investment service work | `< 50 ms` excluding DB/network latency | Phase 6.4 benchmark |
| Settle 10,000 investments | `< 5 minutes` in a production-like database environment | Phase 6.4 benchmark |
| Ledger posting | Atomic | Transaction and rollback tests |
| Recovery after interruption | Idempotent | Phase 6.3 recovery tests |
| Duplicate activation | Impossible | Phase 6.2 concurrency tests plus unique constraints |
| Duplicate settlement | Impossible | Phase 6.2 concurrency tests plus unique constraints |
| Duplicate maturity release | Impossible | Phase 6.2 concurrency tests plus unique constraints |
| Balance mismatch | Impossible under approved posting paths | Reconciliation tests |
| ROI drift | `0` cents for promised-total plans | Phase 6.1 mathematics certification |
| Current-day settlement | Impossible | New York completed-day tests |
| Live earnings wallet effect | Impossible | Domain tests and scope audit |

## Phase 6.1 - Financial Mathematics Certification

Certification target:

- At least 100,000 deterministic randomized investment simulations.
- All supported daily ROI basis-point values.
- All supported term durations.
- Integer minor-unit accounting only.
- No floating point money.
- New York date correctness across DST, leap years, month boundaries, and year boundaries.
- Promised ROI equals settled ROI for promised-total plans.
- Uncapped ROI equals the deterministic formula result for uncapped plans.

Current Phase 6.1 certified envelope:

- Daily ROI basis points: `0` through `10,000`.
- Term duration: `1` through `1,825` New York earning days.
- Randomized principal coverage: `1` through `10,000,000,000` minor units.
- Large-principal coverage: up to `9,999,999,999,999,999` minor units.

Any plan support outside this envelope requires expanding this matrix and the certification suite before release.

| ID | Scenario | Invariants | Expected Result | Current Evidence | Status |
| --- | --- | --- | --- | --- | --- |
| MATH-001 | Simple whole-minor ROI | FI-001, FI-501, FI-502 | Daily ROI posts exactly as integer minor units with zero residual. | `roi-math.test.ts` covers direct daily ROI. | Covered |
| MATH-002 | Residual carry over multiple days | FI-501, FI-503 | Sub-minor residual carries forward and becomes payable only when it reaches a whole minor unit. | `roi-math.test.ts` covers residual carry. | Covered |
| MATH-003 | Final promised ROI absorption | FI-505, FI-506 | Final eligible earning date posts the remaining whole-minor promised ROI exactly. | `roi-math.test.ts` and proof doc cover promised final remainder. | Covered |
| MATH-004 | Final sub-minor residual policy | FI-502, FI-504 | Sub-minor residual is not posted as cash and is recorded as non-cash metadata or reconciliation evidence. | Proof doc covers policy; final metadata exists in settlement service. | Partial |
| MATH-005 | 100,000 randomized ROI simulations | FI-1402, FI-1405 | Every randomized valid investment satisfies promised-total or deterministic uncapped total. | `roi-math-certification.test.ts` runs 100,000 deterministic promised-total simulations. | Covered |
| MATH-006 | Supported ROI percentage sweep | FI-501, FI-505 | Every supported daily ROI bps value settles correctly. | `roi-math-certification.test.ts` sweeps `0` through `10,000` daily ROI bps. | Covered |
| MATH-007 | Supported duration sweep | FI-501, FI-505 | Every supported term length settles correctly. | `roi-math-certification.test.ts` sweeps `1` through `1,825` term days. | Covered |
| MATH-008 | Very small principal | FI-001, FI-502, FI-503 | ROI may be zero until residual becomes payable; no negative or fractional cash is posted. | `roi-math-certification.test.ts` covers one-minor principal behavior. | Covered |
| MATH-009 | Large principal near allowed maximum | FI-001, FI-501 | Bigint arithmetic remains exact and does not overflow JavaScript number precision. | `roi-math-certification.test.ts` covers large-principal bigint arithmetic. | Covered |
| MATH-010 | Zero ROI plan | FI-501, FI-607 | Settlement records a zero-amount skip and does not post ledger cash. | `roi-math-certification.test.ts` covers zero daily ROI and zero promised ROI. | Covered |
| MATH-011 | Total ROI cap lower than daily formula total | FI-505, FI-506 | Settlement never exceeds cap and final day matches cap exactly. | `roi-math-certification.test.ts` covers capped ROI below uncapped output. | Covered |
| MATH-012 | Uncapped fixed-term plan | FI-503, FI-505 | Total settled ROI equals floor of cumulative micro-minor ROI after residual carry. | `roi-math-certification.test.ts` proves uncapped fixed-term formula output. | Covered |
| MATH-013 | Activation before New York midnight | FI-002, FI-403, FI-600 | First settlement date is next New York day, not same day. | `new-york-calendar.test.ts` covers first settlement rule. | Covered |
| MATH-014 | Activation after New York midnight | FI-002, FI-403, FI-600 | First settlement date remains activation New York date plus one. | `new-york-calendar.test.ts` covers after-midnight activation. | Covered |
| MATH-015 | DST start in New York | FI-002, FI-600 | No skipped or shortened financial day; date arithmetic remains calendar based. | `new-york-calendar.test.ts` covers DST start. | Covered |
| MATH-016 | DST end in New York | FI-002, FI-600 | No duplicated or extended financial day; date arithmetic remains calendar based. | `new-york-calendar.test.ts` covers DST end. | Covered |
| MATH-017 | Leap year boundary | FI-002, FI-600, FI-700 | February 29 is treated as a normal New York financial day. | `new-york-calendar.test.ts` covers leap-year settlement and maturity. | Covered |
| MATH-018 | Month boundary | FI-002, FI-600, FI-700 | Settlement and maturity dates advance correctly across month end. | `new-york-calendar.test.ts` covers month-end settlement and maturity. | Covered |
| MATH-019 | Year boundary | FI-002, FI-600, FI-700 | Settlement and maturity dates advance correctly across year end. | `new-york-calendar.test.ts` covers year-end settlement and maturity. | Covered |
| MATH-020 | Live earnings | FI-205, FI-507, FI-508 | Live earnings are visual-only and never modify ledger, wallet, settlement, or maturity state. | `roi-math.test.ts` covers visual-only return contract. | Covered |
| MATH-021 | Maturity date formula | FI-404, FI-700 | Maturity date equals first settlement date plus term days minus one. | `new-york-calendar.test.ts` covers maturity formula. | Covered |
| MATH-022 | Mathematical proof | FI-1405 | Written proof explains total ROI correctness for supported plan policy. | `PHASE_6_ROI_MATHEMATICAL_PROOF.md` exists. | Covered |

## Phase 6.2 - Financial Concurrency Certification

Certification target:

- Duplicate activation cannot lock principal twice.
- Concurrent settlement jobs cannot create duplicate settlement items, ROI ledger entries, or ledger transactions.
- Duplicate maturity cannot release principal twice.
- Unique constraints backstop application-level idempotency.
- Row locks protect spendable and investment state.

| ID | Scenario | Invariants | Expected Result | Current Evidence | Status |
| --- | --- | --- | --- | --- | --- |
| CONC-001 | Duplicate activation with same idempotency key | FI-005, FI-1102 | Repeated activation returns existing investment or fails without duplicate principal lock. | `investment-engine-concurrency.test.ts` runs 500 concurrent same-key activation requests. | Covered |
| CONC-002 | Concurrent duplicate activation | FI-005, FI-201, FI-1101, FI-1102 | Only one investment and one funding ledger transaction commit. | `investment-engine-concurrency.test.ts` covers same-key activation and unique-key over-lock prevention. | Covered |
| CONC-003 | Concurrent settlement for same investment and earning date | FI-601, FI-605, FI-1101, FI-1102 | Only one settlement item, one ROI ledger entry, and one ROI ledger transaction commit. | `investment-engine-concurrency.test.ts` runs 500 racing settlement workers against the same investment-date pair. | Covered |
| CONC-004 | Duplicate completed settlement run replay | FI-605 | Completed run replay returns idempotent no-op. | Service unit test covers completed run replay. | Covered |
| CONC-005 | Duplicate active settlement run | FI-605, FI-1102, FI-1300 | Database prevents multiple pending or running runs for same settlement date. | `investment-engine-concurrency.test.ts` runs 500 duplicate cron settlement executions. | Covered |
| CONC-006 | Duplicate maturity processing | FI-701, FI-703, FI-1102 | Principal release posts at most once. | `investment-engine-concurrency.test.ts` proves final-day worker races release principal once. | Covered |
| CONC-007 | Concurrent ROI and maturity on final day | FI-404, FI-701, FI-703 | Final ROI and principal release commit once in the correct transaction path. | `investment-engine-concurrency.test.ts` races 500 final-day settlement workers. | Covered |
| CONC-008 | Row lock correctness for wallet spendable state | FI-201, FI-1101, FI-1104 | Available balance check and principal lock are protected by row locking. | `investment-engine-concurrency.test.ts` proves 500 unique activation attempts cannot over-lock one available balance. | Covered |
| CONC-009 | Ledger transaction idempotency collision | FI-005, FI-102, FI-1102 | Duplicate idempotency key cannot create duplicate ledger transaction. | `investment-engine-concurrency.test.ts` verifies duplicate ledger idempotency keys reject without duplicate entries. | Covered |
| CONC-010 | Settlement skip after concurrent winner commits | FI-606 | Losing worker detects existing settlement item and skips without posting ledger entries. | Service unit test covers transaction-scoped duplicate skip. | Covered |
| CONC-011 | Serializable transaction retry | FI-1103, FI-1303 | Retryable serialization failures are retried safely without duplicate financial effects. | `transactions.test.ts` verifies PostgreSQL `40001` retry behavior and retry-limit enforcement. | Covered |
| CONC-012 | Simulated deadlock retry | FI-1103, FI-1303 | Retryable deadlock failures are retried safely without duplicate financial effects. | `transactions.test.ts` verifies PostgreSQL `40P01` retry behavior. | Covered |
| CONC-013 | Clock skew between workers | FI-002, FI-600, FI-602 | Workers with skewed clocks cannot settle the current New York day early. | `investment-engine-concurrency.test.ts` verifies early current-day workers reject while completed-day workers settle. | Covered |

## Phase 6.3 - Financial Recovery Certification

Certification target:

- Interrupted settlement jobs can resume.
- Failed item processing never corrupts committed items.
- Reruns skip already-settled investment-date pairs.
- Rollbacks leave no partial ledger/domain writes.
- Recovery remains idempotent after timeout, crash, or retry.

| ID | Scenario | Invariants | Expected Result | Current Evidence | Status |
| --- | --- | --- | --- | --- | --- |
| REC-001 | Failure before settlement run creation | FI-004, FI-1303 | No run, item, ledger transaction, or ROI ledger entry is committed. | `investment-engine-recovery.test.ts` verifies failed run creation leaves no durable records. | Covered |
| REC-002 | Failure after run creation before items | FI-606, FI-1301, FI-1303 | Rerun creates or resumes a valid run and processes unsettled investments. | `investment-engine-recovery.test.ts` verifies investment-list interruption marks the run failed before item processing. | Covered |
| REC-003 | Failure after one investment commits | FI-606, FI-1301, FI-1303 | Rerun skips committed item and continues remaining investments. | `investment-engine-recovery.test.ts` verifies a later run skips the committed item and processes the remaining item. | Covered |
| REC-004 | Failure inside ROI settlement transaction | FI-004, FI-105 | No partial settlement item, ROI ledger entry, or ledger transaction survives rollback. | `investment-engine-recovery.test.ts` verifies rollback of settlement item, ROI ledger, ledger transaction, and wallet projection changes. | Covered |
| REC-005 | Failure during maturity principal release | FI-004, FI-701, FI-703 | Principal is either unreleased or fully released once; never half-released. | `investment-engine-recovery.test.ts` verifies failed maturity release rolls back and rerun releases principal once. | Covered |
| REC-006 | Retry after database timeout | FI-005, FI-1103 | Retry does not duplicate investment funding, ROI, or maturity release. | `transactions.test.ts` covers PostgreSQL `57014`; `investment-engine-recovery.test.ts` verifies timeout-like interruption reruns without duplicate effects. | Covered |
| REC-007 | Retry after process crash | FI-606, FI-1301, FI-1303 | Job resumes from durable records and already committed items are no-ops. | `investment-engine-recovery.test.ts` reruns recovery through a fresh service instance over durable state. | Covered |
| REC-008 | Failed settlement run inspection | FI-006, FI-1300 | Failed run records preserve status, error message, date, and lock owner. | `investment-engine-recovery.test.ts` verifies failed run status, settlement date, run type, lock owner, and error message. | Covered |
| REC-009 | Reconciliation after recovery | FI-1202, FI-1204 | Ledger, settlement items, and ROI ledger entries agree after resumed run. | `investment-engine-recovery.test.ts` verifies reconciliation passes after resumed settlement. | Covered |

## Phase 6.4 - Investment Engine Certification

Certification target:

- Phase 6.1, 6.2, and 6.3 are complete.
- All financial invariants touched by Phase 6 are mapped to tests.
- Performance is acceptable for expected settlement workloads.
- Documentation matches implementation.
- No out-of-scope money movement or admin override features were introduced.

| ID | Scenario | Invariants | Expected Result | Current Evidence | Status |
| --- | --- | --- | --- | --- | --- |
| CERT-001 | Architecture boundary audit | DECISIONS.md, ARCHITECTURE.md | Domain has no framework or infrastructure dependencies; application owns orchestration; repositories own persistence. | Manual scope audit passed at checkpoint. | Manual Review |
| CERT-002 | Scope leak audit | FINANCIAL_INVARIANTS.md | No deposits, withdrawals, provider workflows, customer financial UI, or admin financial overrides in Phase 6. | Manual scope audit passed at checkpoint. | Manual Review |
| CERT-003 | Invariant coverage map | FI-1400 | Every touched financial invariant has at least one test or explicit manual review artifact. | This matrix starts the map. | Partial |
| CERT-004 | Fixed fixture suite | FI-1401 | Human-readable fixtures exist for required financial examples. | Not yet implemented. | Required |
| CERT-005 | Property test suite | FI-1402 | ROI math passes required randomized and sweep coverage. | Phase 6.1 certification suite covers 100,000 simulations plus bps and term sweeps. | Covered |
| CERT-006 | Concurrency test suite | FI-1403 | Duplicate and concurrent attempts cannot double-credit or double-release. | Phase 6.2 certification suite covers activation, settlement, maturity, ledger idempotency, retryable transaction failures, and clock skew. | Covered |
| CERT-007 | Recovery test suite | FI-1404 | Interrupted settlement and maturity workflows resume safely. | Phase 6.3 recovery suite covers run creation failure, pre-item interruption, partial committed runs, transaction rollback, maturity rollback, timeout-like retry, process restart, failed-run inspection, and reconciliation. | Covered |
| CERT-008 | Mathematical proof review | FI-1405 | Written proof is reviewed against final implementation and test suite. | Proof exists; final review pending. | Manual Review |
| CERT-009 | Build and test certification | TESTING.md | Typecheck, lint, unit, integration, migration, build, and E2E checks pass. | Full verification passed through Phase 6.3; final Phase 6.4 release verification remains required. | Partial |
| CERT-010 | Performance benchmark | PERFORMANCE.md | Settlement throughput and ROI simulation cost are measured and documented. | Not yet measured. | Required |
| CERT-011 | Documentation consistency audit | CONTRIBUTING.md, DECISIONS.md | Financial docs, roadmap, tests, and implementation agree. | Roadmap has been reconciled for Phase 6; final Phase 6.4 audit remains required. | Partial |
| CERT-012 | Release readiness | CHANGELOG.md | Branch can merge to `main`, receive `v2.1.0`, and become recovery point. | Not ready until all Phase 6 certification gates pass. | Required |

## Future Financial Matrix Placeholders

These rows are not Phase 6 scope. They remain here so later phases do not forget financial certification requirements.

| ID | Scenario | Owning Phase | Invariants | Expected Result | Status |
| --- | --- | --- | --- | --- | --- |
| FUT-DEP-001 | Duplicate provider webhook | Money Movement | FI-802, FI-1103 | Duplicate provider event does not duplicate deposit credit. | Future Phase |
| FUT-DEP-002 | Deposit reversal | Money Movement | FI-803, FI-1203 | Reversal posts compensating entries without rewriting history. | Future Phase |
| FUT-WDR-001 | Withdrawal reservation | Money Movement | FI-900, FI-901 | Available funds move to reserved exactly once. | Future Phase |
| FUT-WDR-002 | Withdrawal rejection | Money Movement | FI-904 | Reserved funds release through ledger-backed compensation. | Future Phase |
| FUT-WDR-003 | Duplicate payout retry | Money Movement | FI-905 | Provider payout retries cannot pay twice. | Future Phase |
| FUT-REF-001 | Referral qualification | Referrals | FI-1001 | Reward posts only after explicit qualification. | Future Phase |
| FUT-REF-002 | Duplicate referral reward | Referrals | FI-1002, FI-1003 | Reward posts once from platform expense. | Future Phase |

## Required Before Phase 6 Certification

Phase 6 cannot be certified until:

1. All `Required` rows in Phase 6.1 are implemented or explicitly removed by accepted ADR.
2. All `Required` rows in Phase 6.2 are implemented or explicitly removed by accepted ADR.
3. All `Required` rows in Phase 6.3 are implemented or explicitly removed by accepted ADR.
4. Phase 6.4 rows are reviewed and closed.
5. `PHASE_6_ROI_MATHEMATICAL_PROOF.md` is updated if tests reveal any policy nuance.
6. `CHANGELOG.md` is updated for the final `v2.1.0` release.
7. `main` remains frozen until Phase 6 certification passes.

## Maintenance Rules

- New financial behavior requires a new matrix row.
- Changed financial behavior requires updating existing matrix rows.
- Deleted financial behavior requires explaining why the row is no longer applicable.
- Production financial incidents must add a regression row before the fix merges.
- Matrix rows should reference invariant IDs whenever possible.
- "Covered" must mean automated evidence exists, not that the scenario was inspected informally.
