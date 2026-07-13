# SUCCESS_METRICS_FRAMEWORK.md

## Status

**ACCEPTED** — Milestone 6 / `v3.2.0` (pre-G1)  
Authority for what “customer success” means as **measurable customer outcomes**, not revenue or vanity engagement.

Companion to:

- `CUSTOMER_SUCCESS_FRAMEWORK.md`  
- `ENGAGEMENT_PRINCIPLES.md`  
- `GROWTH_EXPERIENCE_SPECIFICATION.md` (Customer Success Experience)

## Purpose

Define UX and outcome goals that prove the platform helps customers succeed.

Not:

- Referral count as a vanity KPI  
- Notification open rate via spam  
- Time-on-site addiction  

Yes:

- Can the customer find, understand, and act with calm confidence?

## Outcome goals (primary)

| ID | Outcome | Target intent | Evidence idea (Stage 2+) |
| --- | --- | --- | --- |
| SM-001 | Locate any investment | Under ~10 seconds from authenticated entry | Portfolio search/list reachability |
| SM-002 | Understand wallet status | Correctly distinguish available / pending / reserved | Wallet copy + status system |
| SM-003 | Complete first deposit | Funded path with clear confirmation | Deposit journey + status |
| SM-004 | Understand ROI lifecycle | Accrued ≠ Credited ≠ Withdrawable | Education + portfolio microcopy |
| SM-005 | Complete a withdrawal request calmly | Know review next step without panic | Withdrawal expectancy UX |
| SM-006 | Understand statement totals | Period totals match ledger-backed figures | Statements G2 + dictionary G5 |
| SM-007 | Find help quickly | Reach relevant help/education without support | Success Hub + Help |
| SM-008 | Finish foundation onboarding | Profile/security/verify path dismissible & clear | Account + Success progress shell |
| SM-009 | Recommend responsibly | Share without inventing claims or leaking privacy | Referral G4 |
| SM-010 | Re-orient after absence | Answer what changed / where money is in seconds | Dashboard + quiet Success cues |

## Secondary (supporting) metrics

Use only after primary outcomes are healthy:

- Self-serve help resolution vs ticket open rate  
- Statement download completion without support  
- Education article exit to correct app surface  
- Zero critical money UX regressions vs `v3.1.0`  

## Explicit non-goals

| Metric | Why rejected |
| --- | --- |
| Daily deposit streaks | Casino psychology |
| Push volume | Noise ≠ success |
| Referral spam conversion | Trust destruction |
| Feature clicks on money home promo | Dilutes Wave B |

## Sprint mapping

| Sprint | Metrics emphasized |
| --- | --- |
| G1 | SM-007, SM-008 (wayfinding / progress framework shells) |
| G2 | SM-006 |
| G3 | SM-004, SM-007 |
| G4 | SM-009 |
| G5 | Full package verification; no new metrics theater |

## Governance

Changes require consultancy approval. Never redefine money truth; `FINANCIAL_INVARIANTS.md` wins.
