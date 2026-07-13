# Phase 6 ROI Mathematical Proof

## Purpose

This document proves the ROI settlement policy implemented by the Phase 6 investment engine.

It supports `FINANCIAL_INVARIANTS.md`, especially:

- `FI-001`: Integer Money Only.
- `FI-501`: ROI Formula Uses Integer Precision.
- `FI-502`: Ledger Postings Use Whole Minor Units.
- `FI-503`: Residual Is Preserved Until Final Policy.
- `FI-505`: Total ROI Must Equal Promised ROI Policy.
- `FI-506`: Final Day Absorbs Whole-Minor Remainder.
- `FI-1405`: Mathematical Proof Is Required For Phase 6.

## Definitions

Let:

- `P` be principal in integer minor units.
- `r` be daily ROI basis points.
- `T` be investment term days.
- `M = 1_000_000` be micro-minor units per minor unit.
- `B = 10_000` be basis points per 100%.
- `R_i` be residual micro-minor units entering day `i`.
- `G` be daily gross ROI in micro-minor units.
- `A_i` be available ROI in micro-minor units for day `i`.
- `C_i` be posted credited ROI in integer minor units for day `i`.
- `R_{i+1}` be residual micro-minor units after day `i`.

The standard daily formula is:

```text
G = floor(P * M * r / B)
A_i = G + R_i
C_i = floor(A_i / M)
R_{i+1} = A_i - (C_i * M)
```

All values are integers.

## Integer Safety

Because `P`, `M`, `r`, and `B` are integers, `P * M * r / B` is computed with integer division.

No floating point value is required.

Therefore:

- No binary floating point drift can occur.
- Every ledger posting is an integer minor-unit amount.
- Sub-minor precision remains internal as integer residual state.

## Residual Bound

For every settlement day:

```text
C_i = floor(A_i / M)
R_{i+1} = A_i - (C_i * M)
```

By the definition of floor division:

```text
0 <= R_{i+1} < M
```

Therefore residual never becomes negative and never reaches one whole minor unit after posting.

Any whole minor unit contained in `A_i` is posted as `C_i`.

## Conservation Of ROI Micro-Minor Value

For one settlement day:

```text
A_i = C_i * M + R_{i+1}
```

Since:

```text
A_i = G + R_i
```

Then:

```text
G + R_i = C_i * M + R_{i+1}
```

Summing across `T` days:

```text
T * G + R_1 = M * sum(C_i) + R_{T+1}
```

The initial residual `R_1` is zero for a newly activated investment.

Thus:

```text
T * G = M * total_posted_roi_minor + final_residual_micro_minor
```

This proves the engine neither creates nor loses ROI value. It either posts whole minor units or carries the remaining sub-minor residual.

## Fixed-Term Uncapped Plans

For uncapped fixed-term plans, total posted ROI is:

```text
floor((T * G) / M)
```

with final residual:

```text
(T * G) mod M
```

This is exactly the deterministic result of applying the documented daily formula across the term.

Sub-minor residual is not cash and is not posted to the ledger.

## Capped Or Promised-Total Plans

Let `K` be the promised ROI cap in integer minor units.

For each non-final settlement day, the engine posts:

```text
min(C_i, K - posted_so_far)
```

On the final eligible settlement day, the engine posts:

```text
K - posted_so_far
```

if a promised total exists.

Therefore after the final day:

```text
posted_so_far + (K - posted_so_far) = K
```

This proves capped or promised-total plans settle exactly to the promised integer minor-unit ROI.

The final-day operation is safe because it is bounded by the remaining promised amount and cannot overpay the cap.

## Final Residual Policy

For uncapped plans, remaining sub-minor residual after the final day is recorded as non-cash settlement metadata and reconciliation data.

For capped or promised-total plans, the final day absorbs the remaining whole-minor promised amount and sets residual to zero.

In both cases:

- Cash ledger postings remain whole minor units.
- Sub-minor values are never posted to cash ledger accounts.
- Settlement records explain residual handling.

## Term Boundaries

The investment engine uses New York Earning Dates.

For an investment activated on New York date `D`:

```text
first_settlement_date = D + 1
maturity_date = first_settlement_date + term_days - 1
```

This creates exactly `T` eligible Earning Dates.

Since the settlement engine processes only completed New York dates, current-day ROI cannot be credited early.

## Tested Properties

The Phase 6 test suite verifies:

- Residual carry across repeated settlements.
- Final-day promised ROI absorption.
- Whole minor-unit posting.
- New York DST start and end boundaries.
- New York leap-year, month-end, and year-end boundaries.
- Deterministic ROI schedule generation.
- Live earnings as visual-only output.
- 100,000 deterministic randomized promised-total ROI simulations.
- Every daily ROI basis-point value in the current Phase 6.1 certified envelope from `0` through `10,000`.
- Every term duration in the current Phase 6.1 certified envelope from `1` through `1,825` New York earning days.
- Very small principal behavior.
- Large-principal bigint behavior.
- Zero-ROI behavior.
- Total ROI cap below uncapped formula output.
- Uncapped fixed-term ROI formula output.
- Ledger posting balance validation.
- Settlement, ROI ledger, and reconciliation agreement.

## Current Phase 6.1 Certified Envelope

The executable certification suite currently proves:

- Daily ROI basis points from `0` through `10,000`.
- Term durations from `1` through `1,825` New York earning days.
- Randomized principal values from `1` through `10,000,000,000` minor units.
- Large-principal bigint behavior up to `9,999,999,999,999,999` minor units.

Any future plan that supports values outside this envelope must expand the certification tests before release.

## Conclusion

The Phase 6 ROI engine satisfies the required mathematical policy:

- It uses integer arithmetic only.
- It posts only whole minor units.
- It preserves residuals deterministically.
- It settles capped or promised-total plans exactly to the promised ROI.
- It prevents floating point drift.
- It separates live visual earnings from ledger-backed credited ROI.
