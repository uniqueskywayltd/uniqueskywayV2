# STATEMENT_EXPERIENCE_GUIDE.md

## Status

**DRAFT — awaiting consultancy approval**  
Companion to `GROWTH_EXPERIENCE_SPECIFICATION.md` (Milestone 6 / `v3.2.0`)

## Purpose

Define how customers obtain **official, ledger-honest records** of their account activity—financial statements, tax-oriented summaries, and account statements—without creating a second source of money truth.

## North star (`EP-029`)

> Which official record do I need — and does it match my ledger?

## Statement types (product definitions)

| Type | Customer meaning | Typical contents |
| --- | --- | --- |
| **Account activity statement** | Period chronology of money-relevant events | Deposits, withdrawals, ROI credits, referral credits, investment activations/maturities as permitted by data model |
| **Wallet / ledger extract** | Posting-oriented export | Credits, debits, references, timestamps (NY policy where applicable) |
| **Tax / year summary** | Annual rollup for personal filing aid | Totals by category for a calendar year — **not** tax advice |
| **Investment summary** | Per-period or open positions snapshot | Plan, principal, statuses, credited totals — read-only from certified investment projections |

Exact catalog may narrow in Stage 2 based on available certified projections. Do not invent fields the engines cannot support.

## Principles

### STA-001: Ledger wins

Every amount on a statement must be reconcilable to certified ledger or investment projections. If it cannot be sourced, it does not appear.

### STA-002: Period clarity

Customer always sets (or sees) timezone policy: **New York calendar** for financial periods unless a superseding ADR says otherwise. Label the timezone on the statement.

### STA-003: Preview before download

Show on-screen preview (or summary) before PDF/CSV download so mistakes are caught early.

### STA-004: Immutable once issued (product posture)

An issued statement for a closed period should remain downloadable as the same artifact when possible. Regenerations for the same period+type should not silently change historical postings; corrections follow financial correction policy, not UI redraws.

### STA-005: No advice

Tax summaries are **records**, not counsel. Include a short disclaimer: Unique Sky Way does not provide tax advice.

### STA-006: Ownership & audit

Only the owning customer (or authorized admin with audit) can generate/download. Log generation/download events where security policy requires.

### STA-007: Accessible formats

Minimum: on-screen HTML summary + downloadable PDF and/or CSV. Prefer print-friendly layout. Charts optional and never sole carriers of amounts.

### STA-008: Empty periods are honest

“No activity in this period” is success—not an error. Offer adjusting the period.

### STA-009: Language & localization

Milestone 6 ships statement UX in current product language. Full localization awaits `v3.3.0`; do not half-localize number formats inconsistently.

### STA-010: Do not reopen engines for pretty PDFs

If a figure is missing, Stage 2 may compose existing APIs. New posting types require ADR + recertification—not a PDF feature request.

## UX flow

1. Choose statement type  
2. Choose period (month / quarter / year / custom bounded range)  
3. Preview summary (totals + sample lines)  
4. Confirm download (PDF/CSV)  
5. Confirmation: file ready; optional “view in ledger” link for line items  

## Microcopy anchors

- “Totals match your ledger for this period.”  
- “Pending items may appear separately until settled.”  
- Accrued ≠ Credited: statements default to **posted/credited** money unless a clearly labeled accrued appendix is approved.  

## Out of scope

- Full accounting packages / QuickBooks sync (`v4` ecosystem)  
- Guaranteed tax form templates for every jurisdiction  
- Admin bulk statement redesign (may reuse generation later)  

## Acceptance checklist

- [ ] Spot-check totals vs ledger for fixture accounts  
- [ ] Timezone labeled  
- [ ] Disclaimer present on tax-oriented views  
- [ ] Unauthorized access denied  
- [ ] No demo inventing balances in empty states  
