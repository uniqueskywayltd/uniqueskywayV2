# FINANCIAL_INVARIANTS.md

## Purpose

This document defines the immutable accounting and mathematical rules for the Unique Sky Way V2 financial engine.

It is not a product document.
It is not a UI document.
It is not an implementation plan.

It is the constitution for every system that creates, moves, settles, reserves, releases, reconciles, or reports money.

## Authority

These invariants apply to all financial code from Phase 6 onward.

If any implementation conflicts with this document, the implementation is wrong.

Changes to this document require:

- An accepted engineering decision record in `DECISIONS.md`.
- Updated financial tests.
- Updated regression fixtures.
- Explicit review before merge.

No feature, admin tool, background job, emergency script, support workflow, or migration may bypass these invariants.

## Scope

These invariants govern:

- Ledger transactions.
- Ledger entries.
- Wallet projections.
- Investment plans.
- Investment lifecycle.
- ROI calculation.
- Settlement.
- Maturity.
- Principal lock and unlock.
- Referral commissions.
- Deposits.
- Withdrawals.
- Provider webhooks.
- Reversals.
- Corrections.
- Reconciliation.
- Background financial jobs.

## Non-Goals

This document does not define:

- Page layout.
- Customer UI.
- Admin UI.
- Marketing copy.
- Email wording.
- Provider-specific integration details.

Those systems must obey these invariants, but they are not specified here.

## Terminology

Official terminology comes from `GLOSSARY.md`.

Financial code must use these meanings consistently:

- `minor`: the smallest cash unit for a currency, such as cents for USD.
- `micro_minor`: one millionth of a minor unit, used only for internal ROI precision.
- `bps`: basis points, where 10,000 bps equals 100%.
- `New York Day`: the calendar date in `America/New_York`.
- `Earning Date`: the New York date for which ROI is earned.
- `Settlement Date`: the New York date being settled.
- `Ledger Posting Date`: the UTC timestamp when a ledger transaction is committed.
- `Wallet Credit Date`: the time a ledger-backed amount becomes available to the wallet.

## Global Invariants

### FI-001: Integer Money Only

Money must never be represented with floating point numbers.

All customer-visible cash values must be integer minor units.

Internal ROI residuals may use integer micro-minor units.

### FI-002: UTC Timestamps, New York Financial Dates

Timestamps must be stored in UTC.

Financial eligibility dates for ROI settlement must be stored separately as New York calendar dates.

Elapsed milliseconds must not be used to infer financial days.

### FI-003: Deterministic Financial Logic

Given the same inputs, financial calculations must produce the same outputs.

Financial calculations must not depend on frontend state, browser time, uncontrolled randomness, mutable plan data, or non-deterministic ordering.

### FI-004: No Partial Financial Commit

No financial workflow may leave the system partially committed.

All related financial writes must succeed together or fail together inside one database transaction.

### FI-005: Idempotency Is Mandatory

Every retryable financial action must have an idempotency key.

Repeating the same idempotency key must return the prior result or perform no new financial mutation.

Duplicate provider webhooks, duplicate jobs, duplicate API retries, and duplicate admin actions must not double-credit, double-debit, double-lock, double-release, or double-reserve funds.

### FI-006: Auditability Is Mandatory

Every financial action must be reconstructable from durable records.

At minimum, the system must be able to answer:

- Who or what initiated the action.
- When the action was requested.
- When it was committed.
- Which idempotency key was used.
- Which ledger transaction was posted.
- Which domain object caused the posting.
- Which input snapshot was used.
- Which calculation version was used.

### FI-007: Corrections Are Compensating Entries

Financial history must not be edited to hide or rewrite a mistake.

Corrections must be represented by new compensating ledger transactions.

## Ledger Invariants

### FI-100: Ledger Is The Source Of Truth

The ledger is the single source of truth for all financial balances.

Wallet balances, investment summaries, earnings summaries, reports, and dashboards are projections over ledger-backed data.

### FI-101: Wallet Balances Are Projections

Wallet balances must never be treated as authoritative state.

Wallet balance snapshots may exist for performance, but they must be rebuildable from the ledger.

### FI-102: Ledger Transactions Must Balance To Zero

Every ledger transaction must contain ledger entries whose signed sum is exactly zero per currency.

Transactions spanning multiple currencies must balance independently per currency.

### FI-103: Ledger Entries Are Immutable

Ledger transactions and ledger entries are append-only.

No production code may update amount, account, currency, direction, posted date, or reference fields after a ledger transaction is committed.

### FI-104: One Approved Posting Engine

All ledger mutations must go through the approved ledger posting service.

Repositories may persist ledger records, but they must not contain business posting rules.

No feature-specific service may directly assemble unverified ledger entries.

### FI-105: Ledger Posting Is Atomic

The domain state change and the ledger posting that represents it must commit in the same database transaction.

Examples:

- Investment activation and principal lock.
- ROI settlement item and ROI credit.
- Maturity status change and principal release.
- Withdrawal request and fund reservation.
- Referral commission qualification and commission credit.

### FI-106: Ledger References Are Required

Every ledger transaction must reference the originating workflow.

Examples:

- Investment ID.
- Settlement item ID.
- Withdrawal ID.
- Deposit ID.
- Referral ledger ID.
- Reversal ID.
- Admin correction ID.

### FI-107: Negative Ledger Entries Are Not A Direction Substitute

Ledger entry direction and amount must be unambiguous.

Amounts must be positive integer minor units.

Debit or credit direction must be explicit.

### FI-108: Ledger Accounts Are Typed

Ledger accounts must have explicit financial purpose.

Examples:

- Customer available cash.
- Customer locked principal.
- Customer reserved withdrawal.
- Customer pending deposit.
- Platform ROI expense.
- Platform referral expense.
- Provider clearing.
- Platform rounding.

## Wallet Invariants

### FI-200: Available Balance Is Ledger-Derived

Available balance is derived from customer available cash ledger accounts.

It must not include pending deposits, locked principal, reserved withdrawals, live earnings, unposted ROI, or failed provider movements.

### FI-201: Negative Available Balance Is Impossible

No transaction may reduce a customer's available balance below zero.

The check and the ledger posting must happen inside the same transaction with appropriate row locking.

### FI-202: Pending Funds Are Not Spendable

Pending deposit funds must not be investable or withdrawable.

Pending funds become available only after the required provider confirmation and ledger posting.

### FI-203: Locked Funds Are Not Withdrawable

Principal locked in an active investment must not be withdrawable.

Locked principal can move only through allowed lifecycle postings such as maturity release, cancellation reversal, or approved correction.

### FI-204: Reserved Funds Are Not Double-Spendable

Funds reserved for withdrawal must not remain available for investment or another withdrawal.

Reservation and release must be ledger-backed.

### FI-205: Live Earnings Are Never Wallet Balance

Live earnings are not pending balance, available balance, locked balance, or reserved balance.

Live earnings become wallet money only after settlement posts ledger entries.

## Investment Plan Invariants

### FI-300: Plan Versions Are Immutable After Activation

An active investment plan version must not be edited in a way that changes customer financial terms.

New terms require a new investment plan version.

### FI-301: Existing Investments Use Snapshotted Terms

Investment terms must be snapshotted at activation.

Existing investments must never read mutable plan fields for ROI, term days, principal return policy, cap, referral policy, or maturity behavior.

### FI-302: Plan Changes Do Not Affect Existing Investments

Changing, retiring, or replacing a plan version must not affect active, matured, cancelled, completed, or historical investments.

### FI-303: Plan Terms Must Be Internally Valid

Investment plan versions must satisfy:

- Currency is supported.
- Minimum principal is greater than zero.
- Maximum principal is greater than or equal to minimum principal.
- Term days are greater than zero.
- ROI basis points are non-negative.
- Total ROI cap is non-negative if present.
- Principal return policy is explicit.

## Investment Lifecycle Invariants

### FI-400: Investment Status Is Controlled

An investment may only use certified lifecycle statuses.

The approved persisted statuses are:

- `pending`.
- `active`.
- `maturing`.
- `matured`.
- `cancelled`.
- `failed`.

`completed` may be used only as a derived business classification for an investment whose final settlement and principal resolution are complete.

Persisting a new `completed` status requires an accepted decision record, schema migration, and updated financial certification.

Implementation may add no other transitional states unless they are documented, tested, and approved through the same process.

### FI-401: Activation Requires Principal Lock

An investment is active only after principal has been locked by a balanced ledger transaction.

An investment record without a corresponding principal lock is not active.

### FI-402: Activation Snapshot Is Permanent

At activation, the investment must snapshot:

- Principal minor amount.
- Currency.
- Daily ROI basis points.
- Total ROI cap, if any.
- Term days.
- First settlement date.
- Maturity date.
- Principal return policy.
- Calculation version.

### FI-403: No Same-Day ROI By Default

An investment activated on New York date `D` first becomes eligible for ROI on New York date `D + 1`.

No same-day ROI may be credited unless a future accepted plan version explicitly defines and tests that behavior.

### FI-404: Maturity Requires Final Settlement

An investment may mature only after the final eligible Earning Date has been settled or explicitly skipped by an approved zero-amount settlement rule.

### FI-405: Completion Requires Principal Resolution

An investment may be completed only after principal has been returned, rolled, forfeited under a documented policy, or otherwise resolved by ledger-backed posting.

### FI-406: Cancelled Investments Must Be Ledger-Resolved

Cancellation must not leave locked principal or accrued obligations ambiguous.

Any cancellation must produce ledger-backed resolution records.

## ROI Mathematics Invariants

### FI-500: ROI Uses The Investment Snapshot

ROI must be calculated from investment snapshot fields.

ROI must not be calculated from mutable plan records.

### FI-501: ROI Formula Uses Integer Precision

The standard daily ROI formula is:

```text
gross_micro_minor =
  principal_minor * 1_000_000 * daily_roi_bps / 10_000

available_micro_minor =
  gross_micro_minor + previous_rounding_residual_micro_minor

posted_roi_minor =
  floor(available_micro_minor / 1_000_000)

next_rounding_residual_micro_minor =
  available_micro_minor - (posted_roi_minor * 1_000_000)
```

Implementation may rearrange this formula only if the result is mathematically equivalent and proven by tests.

### FI-502: Ledger Postings Use Whole Minor Units

ROI ledger postings must use whole minor units only.

Sub-minor values must never be posted to cash ledger accounts.

### FI-503: Residual Is Preserved Until Final Policy

Rounding residual must be persisted per investment.

Residual must carry forward until it is either converted into a whole minor unit through later settlement or resolved by the final residual policy.

### FI-504: Final Residual Policy Is Explicit

At maturity, remaining sub-minor residual must be handled explicitly.

The approved default policy is:

- Pay only whole minor units.
- Record any remaining sub-minor residual as a non-cash platform rounding adjustment in settlement metadata and reconciliation records.
- Do not post sub-minor amounts to cash ledger accounts.
- Record residual handling on the final settlement item.

### FI-505: Total ROI Must Equal Promised ROI Policy

For capped plans, total settled ROI must equal the lesser of:

- Sum of eligible daily ROI after rounding and final residual policy.
- The plan's total ROI cap.

For uncapped fixed-term plans, total settled ROI must equal the deterministic result of the daily ROI formula over the term, including residual carry and final residual policy.

### FI-506: Final Day Absorbs Whole-Minor Remainder

If a total ROI cap or fixed promised total creates a remainder, the final eligible settlement day must absorb the whole-minor remainder needed to match the promised total.

Earlier settlement days must not overpay the remaining promise.

### FI-507: Live Earnings Are Visual Only

Live earnings may estimate currently accruing ROI for display or preview purposes.

Live earnings must not:

- Create ledger entries.
- Modify wallet balances.
- Modify investment balances.
- Satisfy withdrawal eligibility.
- Satisfy maturity.
- Count as credited ROI.

### FI-508: Accrued ROI Is Not Credited ROI

ROI associated with an Earning Date is not credited ROI until the settlement ledger transaction commits.

## Settlement Invariants

### FI-600: New York Time Defines Settlement Days

Settlement eligibility is based on New York calendar dates in `America/New_York`.

Daylight saving time transitions must not create skipped, duplicated, shortened, or extended financial days.

### FI-601: One Settlement Per Investment Per Earning Date

There must be at most one successful settlement item for each `(investment_id, earning_date)`.

This must be enforced with a database constraint.

### FI-602: Settlement Runs Completed Days Only

Settlement may run only for Earning Dates earlier than the current New York date.

The current New York date is incomplete and must not be settled.

### FI-603: Settlement Order Is Chronological

Catch-up settlement must process missing Earning Dates in chronological order per investment.

A later Earning Date must not settle while an earlier eligible Earning Date remains unsettled for the same investment.

### FI-604: Settlement Is Ledger-Backed

Credited ROI exists only after settlement posts balanced ledger entries.

The settlement item and ledger transaction must commit atomically.

### FI-605: Settlement Is Idempotent

Repeating a settlement run, settlement date, or settlement item command must not create duplicate ROI.

Idempotency must be enforced by both idempotency keys and unique database constraints.

### FI-606: Settlement Can Resume After Failure

If a settlement run is interrupted, rerunning it must safely continue remaining unsettled items.

Already-settled investment-date pairs must be skipped or replayed as no-ops.

### FI-607: Settlement Must Explain Skips

If an eligible investment is not settled, the system must record or derive the reason.

Examples:

- Already settled.
- Investment not active.
- Date before first settlement date.
- Date after maturity date.
- ROI cap reached.
- Zero-amount settlement under approved policy.

## Maturity Invariants

### FI-700: Maturity Date Is A New York Date

Maturity date is the final eligible Earning Date in New York calendar time.

The standard formula is:

```text
maturity_date = first_settlement_date + term_days - 1
```

### FI-701: Principal Unlock Is Ledger-Backed

Principal becomes available only when a maturity ledger transaction moves it from locked principal to available cash or another approved destination.

### FI-702: Principal Unlock Is Not A Balance Edit

Maturity must never directly update wallet balances.

It must post ledger entries and allow projections to reflect the result.

### FI-703: Maturity Is Idempotent

Repeating maturity processing must not release principal more than once.

### FI-704: Maturity Emits Durable Events After Commit

Maturity notifications, emails, or future downstream workflows must be triggered through durable post-commit events.

Notification failure must not roll back an already committed financial maturity transaction.

## Deposit Invariants

Phase 6 must not implement deposits.

When deposits are implemented in a later phase, they must obey these invariants.

### FI-800: Provider Events Are Not Trusted Balance State

Provider events are inputs to platform financial workflows.

Provider balances, webhook payloads, or dashboard state must not replace the platform ledger as source of truth.

### FI-801: Deposits Are Pending Until Confirmed

A deposit initiation must not create available funds.

Available funds may be posted only after required provider confirmation and platform validation.

### FI-802: Duplicate Provider Webhooks Are Idempotent

Repeated provider webhook delivery must not create duplicate deposits, duplicate credits, or duplicate events.

### FI-803: Deposit Reversals Are Ledger-Backed

Chargebacks, reversals, failed payments, and provider corrections must be represented through compensating ledger transactions.

## Withdrawal Invariants

Phase 6 must not implement withdrawals.

When withdrawals are implemented in a later phase, they must obey these invariants.

### FI-900: Withdrawals Use Available Balance Only

Withdrawals may reserve only available balance.

Withdrawals must not read or reserve pending funds, locked funds, live earnings, unposted ROI, or projected maturity funds.

### FI-901: Withdrawal Reservation Is Atomic

Withdrawal request creation and available-to-reserved ledger posting must happen in the same transaction.

### FI-902: Locked Funds Never Withdraw

Locked principal may not be withdrawn before a ledger-backed unlock event.

### FI-903: Withdrawals Never Read Live Earnings

Live earnings must not increase withdrawal eligibility.

### FI-904: Withdrawal Failure Releases Funds By Ledger

Rejected, failed, expired, or cancelled withdrawals must release reserved funds through compensating ledger entries.

### FI-905: Withdrawal Payout Is Idempotent

Provider payout retries must not pay the customer more than once.

## Referral Invariants

### FI-1000: Referral Rewards Are Platform Expense

Referral rewards must be funded from platform expense accounts.

They must not reduce the referred investor's principal, ROI, or wallet balance.

### FI-1001: Referral Qualification Is Explicit

Referral commission must not be posted until qualification rules are satisfied.

Examples:

- Referred user exists.
- No self-referral.
- One referrer per referred user.
- Eligible investment is active.
- Cooling-off or reversal window has passed if required.

### FI-1002: Referral Posting Is Idempotent

The same qualifying referral event must not create more than one commission posting.

### FI-1003: Referral Rewards Are Ledger-Backed

A referral commission is not customer money until the ledger posting commits.

## Concurrency Invariants

### FI-1100: Financial Writes Require Transactions

Every financial mutation must execute inside a database transaction.

### FI-1101: Row Locking Is Mandatory For Spendable State

Workflows that consume, reserve, release, or settle funds must lock the relevant rows or use equivalent database-enforced concurrency controls.

### FI-1102: Unique Constraints Guard Idempotency

Application-level idempotency is not enough.

The database must enforce uniqueness for natural financial duplicates, such as:

- Idempotency key.
- Provider event ID.
- Investment and Earning Date settlement pair.
- Maturity posting reference.
- Withdrawal payout reference.
- Referral qualification reference.

### FI-1103: Retry Safety Is Required

Any job or request that may be retried must be safe to retry after:

- Timeout.
- Process crash.
- Database disconnect.
- Provider retry.
- User double-submit.
- Scheduler duplicate run.

### FI-1104: No Read-Modify-Write Without Locking

Financial code must not read a balance, compute a new balance, and write it back without transaction-level protection.

Prefer ledger posting plus database constraints over mutable balance arithmetic.

## Reconciliation Invariants

### FI-1200: Ledger Must Reconcile Internally

For every currency, total debits and credits must balance.

Any imbalance is a production-blocking defect.

### FI-1201: Wallet Projections Must Reconcile To Ledger

Wallet projections and snapshots must match ledger-derived balances.

If a projection differs from the ledger, the ledger wins.

### FI-1202: Settlement Records Must Reconcile To Ledger

Total credited ROI from settlement items must equal corresponding ROI ledger postings.

### FI-1203: Provider Reconciliation Must Not Rewrite Ledger History

Provider reconciliation may identify missing, duplicated, delayed, or reversed external movements.

It must resolve differences with new ledger-backed events, not by mutating historical ledger entries.

### FI-1204: Reconciliation Failures Block Certification

Phase certification cannot pass while known reconciliation differences remain unexplained.

## Background Job Invariants

### FI-1300: Jobs Are Durable

Financial jobs must record durable run state.

An operator must be able to inspect started, completed, failed, skipped, retried, and resumed runs.

### FI-1301: Jobs Are Resumable

Interrupted settlement, maturity, reconciliation, and provider-processing jobs must resume without duplicate financial effects.

### FI-1302: Jobs Emit Post-Commit Events

Jobs may emit notifications or downstream events only after the financial transaction commits.

### FI-1303: Job Failure Does Not Corrupt Financial State

If a job fails after committing one item, reruns must continue with remaining items.

If a job fails before commit, reruns must repeat safely.

## Testing Invariants

### FI-1400: Financial Tests Are Required Before Merge

Any change to financial logic must include tests covering the affected invariant IDs.

### FI-1401: Fixed Fixtures Are Required

The system must include fixed financial fixtures for:

- Simple ROI settlement.
- Rounding residual carry.
- Final residual handling.
- ROI cap.
- New York DST start.
- New York DST end.
- Leap year dates.
- Catch-up settlement.
- Duplicate settlement retry.
- Maturity principal release.
- Reconciliation.

### FI-1402: Property-Based Tests Are Required For ROI Math

ROI math must be tested across randomized valid inputs.

At minimum, tests must vary:

- Principal amounts.
- Daily ROI basis points.
- Term days.
- Total ROI caps.
- Activation dates.
- Rounding residuals.

### FI-1403: Concurrency Tests Are Required

Financial workflows must include tests proving duplicate concurrent attempts cannot:

- Double-settle ROI.
- Double-release principal.
- Double-reserve withdrawal funds.
- Double-credit deposits.
- Double-post referral rewards.

### FI-1404: Recovery Tests Are Required

Financial jobs must include tests proving interrupted runs resume safely without losing or duplicating financial effects.

### FI-1405: Mathematical Proof Is Required For Phase 6

Phase 6 certification must include a written proof that total settled ROI equals the promised ROI policy for every supported plan type.

The proof must cover:

- Integer minor-unit posting.
- Micro-minor residual carry.
- Final day remainder absorption.
- Final residual policy.
- ROI caps.
- Term boundaries.

## Phase 6 Milestone Order

Phase 6 must be built in this order:

1. Phase 6A - Investment Plans.
2. Phase 6B - Investment Lifecycle.
3. Phase 6C - ROI Mathematics.
4. Phase 6D - Settlement Engine.
5. Phase 6E - Live Earnings Engine.
6. Phase 6F - Maturity Engine.
7. Phase 6G - Reconciliation.
8. Phase 6H - Certification.

Phase 6 must not implement deposits or withdrawals.

Phase 6 tests may construct investments directly through test setup or approved repository fixtures to verify the engine in isolation.

## Phase 6 Certification Requirements

Phase 6 is not certified until all of the following are true:

- Investment plan versions are immutable after activation.
- Investment activation snapshots financial terms.
- Principal lock postings are balanced.
- ROI calculation uses integer arithmetic only.
- Settlement uses New York Earning Dates.
- Settlement is idempotent under retry.
- Settlement catch-up is chronological.
- Live earnings do not affect balances.
- Maturity requires final settlement.
- Principal release is ledger-backed.
- Reconciliation proves ledger, settlement, and wallet projections agree.
- Fixed financial fixtures pass.
- Property-based ROI tests pass.
- Concurrency tests pass.
- Recovery tests pass.
- Mathematical proof is documented.
- No deposit implementation exists.
- No withdrawal implementation exists.

## Absolute Prohibitions

The following are never allowed:

- Floating point money.
- Direct wallet balance edits.
- Mutable ledger entries.
- Unbalanced ledger transactions.
- Same-day ROI by accident.
- ROI based on mutable plan terms.
- Settlement based on server-local dates.
- Duplicate settlement for the same investment and Earning Date.
- Withdrawal from locked principal.
- Withdrawal from live earnings.
- Financial writes outside a transaction.
- Financial retries without idempotency.
- Provider state replacing ledger truth.
- Corrections by editing history.
