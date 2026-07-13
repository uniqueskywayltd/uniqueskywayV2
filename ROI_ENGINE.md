# ROI_ENGINE.md

## Purpose

This document defines the financial engine for Unique Sky Way V2.

The ROI engine must be deterministic, auditable, idempotent, timezone-correct, and ledger-backed.

## Core Principle

No customer-visible financial value should exist only as a calculated frontend number.

Investment principal, ROI, referral rewards, withdrawals, reversals, and maturity releases must be represented through immutable ledger transactions.

## Investment Lifecycle

### 1. Plan Definition

Admins create investment plan versions with:

- Currency.
- Minimum principal.
- Maximum principal.
- Term length in days.
- Daily ROI basis points.
- Total ROI cap if applicable.
- Principal return policy.
- Early exit policy.
- Referral reward policy.
- Effective date range.

Plan versions are immutable once activated.

### 2. Customer Commitment

Customer selects a plan version and amount.

Validation:

- Customer is active.
- Email verified.
- KYC and eligibility pass if required.
- Terms and disclosures accepted.
- Plan version is active.
- Principal is within allowed range.
- Available wallet balance is sufficient.

Financial posting:

- Debit customer available cash.
- Credit customer locked investment principal.
- Record investment with snapshotted plan terms.

### 3. Activation

Investment becomes active when principal is locked and the investment record is created.

Fields established:

- `activated_at` in UTC.
- `first_settlement_date` in New York calendar.
- `maturity_date` in New York calendar.
- `daily_roi_bps`.
- `term_days`.

### 4. Daily Settlement

For each eligible New York settlement date:

- Calculate ROI.
- Post ROI ledger transaction.
- Store settlement item.
- Carry rounding residual.
- Check maturity eligibility.

### 5. Maturity

After the final eligible settlement:

- Mark investment maturing.
- Release or settle principal according to plan policy.
- Mark investment matured.
- Emit maturity notification event.

### 6. Post-Maturity

Customer can:

- Withdraw available funds.
- Reinvest available funds.
- Review history.

Historical investment terms and settlement items remain immutable.

## New York Settlement Model

Business calendar:

- Settlement dates are calendar dates in `America/New_York`.
- Timestamps are stored in UTC.
- Settlement date is stored separately as `YYYY-MM-DD`.

Recommended rule:

- An investment activated on New York date `D` first becomes eligible for ROI on New York date `D + 1`.
- No same-day ROI.
- No partial-day ROI unless a future plan explicitly defines it.

Daily run timing:

- Scheduled after New York midnight, preferably after 00:10 America/New_York.
- The run settles all dates earlier than the current New York date that have not been settled.

Why:

- This avoids ambiguity around customers investing seconds before midnight.
- It makes support explanations simple.
- It gives the platform deterministic catch-up behavior.

Daylight saving time:

- Never assume a day is 24 hours.
- Use New York calendar dates, not elapsed milliseconds.

## ROI Calculation

Inputs:

- `principal_minor`.
- `daily_roi_bps`.
- `settlement_date`.
- `rounding_residual_micro_minor`.
- Investment status and eligibility.

Definitions:

- `minor` means smallest cash unit, such as cents for USD.
- `micro_minor` means one millionth of a minor unit for internal precision.
- `bps` means basis points, where 10,000 bps = 100%.

Formula:

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

Policy:

- Cash ledger postings use whole minor units only.
- Fractional residuals carry forward.
- Final maturity can either continue carrying residual until it becomes payable or apply a documented final residual policy.

Recommended final residual policy:

- Pay only whole minor units.
- Write off sub-minor residual to platform rounding account at maturity.
- Include the residual handling in settlement item metadata.

Why:

- Avoids floating point errors.
- Avoids systematic customer underpayment from repeated rounding down.
- Keeps ledger cash amounts valid.

## ROI Caps

If a plan has a total ROI cap:

- Track cumulative posted ROI per investment.
- Before posting daily ROI, compare remaining allowed ROI.
- Post the lesser of daily ROI and remaining cap.
- Mark investment maturing when final cap or term is reached.

## Ledger Design

All financial movement posts as double-entry ledger transactions.

Example investment creation:

```text
Debit:  customer_available_cash
Credit: customer_locked_principal
```

Example daily ROI settlement:

```text
Debit:  platform_roi_expense
Credit: customer_available_cash
```

Example maturity principal release:

```text
Debit:  customer_locked_principal
Credit: customer_available_cash
```

Example withdrawal reservation:

```text
Debit:  customer_available_cash
Credit: customer_reserved_withdrawal
```

Example withdrawal paid:

```text
Debit:  customer_reserved_withdrawal
Credit: provider_or_platform_cash_clearing
```

Example referral reward:

```text
Debit:  platform_referral_expense
Credit: customer_available_cash
```

Rules:

- Ledger transactions must balance.
- Ledger entries are immutable.
- Corrections are compensating entries.
- Every ledger transaction has a reference to the originating workflow.

## Wallet Model

A customer wallet is a view over ledger accounts.

Customer wallet categories:

- Pending: deposit initiated but not confirmed.
- Available: spendable or withdrawable funds.
- Locked: funds committed to active investments.
- Reserved: funds held for withdrawal processing.
- Withdrawn: historical paid-out funds.

Rules:

- Customer cannot invest more than available funds.
- Customer cannot withdraw more than available funds.
- Pending funds are not spendable.
- Locked funds are not withdrawable.
- Reserved funds are not withdrawable until released.

## Daily Settlement Process

High-level algorithm:

1. Determine current New York date.
2. Find all unsettled settlement dates before current New York date.
3. For each date in chronological order:
   - Acquire settlement lock.
   - Create settlement run.
   - Find active eligible investments.
   - For each investment:
     - Verify no existing settlement item for investment and date.
     - Calculate ROI.
     - Post ledger transaction.
     - Insert settlement item.
     - Update rounding residual.
     - Check maturity.
   - Complete settlement run.
   - Emit outbox events.

Concurrency:

- Use database advisory locks or unique constraints to prevent duplicate runs.
- Use unique `(investment_id, settlement_date)` on settlement items.
- Ledger postings use idempotency keys.

## Catch-Up Settlement

Catch-up is required when:

- Scheduled job failed.
- Hosting was down.
- Database was unavailable.
- A settlement run partially failed.

Catch-up rules:

- Run missing dates in chronological order.
- Never settle a later date before an earlier missing date for the same investment.
- Skip already settled investment-date pairs.
- Use the same calculation as daily settlement.
- Record run type as `catch_up` or `manual_replay`.

Why:

- Customers should not lose ROI because infrastructure failed.
- Financial history remains sequential and explainable.

## Maturity Rules

Recommended term model:

- `maturity_date = first_settlement_date + term_days - 1`.
- Investment matures after settlement for `maturity_date` is posted.

Example:

- Activated on New York date July 12.
- First settlement date July 13.
- Term days 90.
- Final settlement date October 10.
- Maturity occurs after October 10 settlement is posted.

Maturity posting:

- Release principal according to principal return policy.
- Mark status `matured`.
- Emit `investment.matured`.

## Rounding

Rules:

- Never use JavaScript floating point for money.
- Store cash-visible values in integer minor units.
- Store ROI residuals in integer micro-minor units.
- Round only at ledger posting boundaries.
- Persist residuals per investment.
- Include calculation version in settlement item metadata if formulas may evolve.

## Referrals

Referral lifecycle:

1. Referrer has a referral code.
2. Referred customer applies code or arrives through tracked link.
3. Referral remains pending until qualification.
4. Qualification occurs when referred user makes an eligible investment and any cooling-off period passes.
5. Reward is calculated and posted to referrer wallet.
6. Reward status becomes posted.

Recommended reward timing:

- Credit reward only after the referred investment is active and not cancelled.
- For high-risk payment rails, wait until deposit reversal window passes where applicable.

Rules:

- No self-referrals.
- One referrer per referred user.
- Reward is paid from platform expense.
- Referral reward is ledger-backed.
- Referral reward posting is idempotent.

Compliance note:

- Multi-level rewards, percentage-of-return rewards, and aggressive referral claims may increase regulatory risk. Do not implement without legal review.

## Failure Modes

### Settlement item fails before ledger posting

Behavior:

- Mark item failed or leave unprocessed depending on transaction boundary.
- Retry safely.

### Ledger posting succeeds but notification fails

Behavior:

- Financial transaction remains posted.
- Outbox event retries notification.

### Partial settlement run fails

Behavior:

- Posted investment-date pairs remain posted.
- Failed or missing pairs are retried.
- Settlement run shows failed.
- Catch-up run completes remaining items.

### Duplicate webhook or job retry

Behavior:

- Idempotency key returns previous result or ignores duplicate.

## Auditability

Every settlement must answer:

- Which investments were eligible?
- Which were posted?
- Which were skipped?
- Which formula version was used?
- What principal and rate were used?
- What residual came in and went out?
- Which ledger transaction was posted?
- Which run executed the settlement?

## Certification Before Production

Before production launch:

- Run fixed financial fixtures.
- Run DST boundary tests.
- Run leap year tests.
- Run missed settlement catch-up tests.
- Run duplicate job tests.
- Reconcile ledger totals.
- Verify admin reports match ledger.

