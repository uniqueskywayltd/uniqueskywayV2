# SPRINT_B2_CERTIFICATION.md

## Result

**PASS — Sprint B2 Portfolio Experience certified**

Date: 2026-07-13  
Branch: `milestone-5-wave-b-sprint-b2`  
Authority: `PORTFOLIO_EXPERIENCE_PRINCIPLES.md` (**DEC-0035**), `WAVE_B_UX_SPECIFICATION.md` (**DEC-0032**), `CUSTOMER_EXPERIENCE_PRINCIPLES.md`, `STATUS_SYSTEM.md`, `EMPTY_STATES_GUIDE.md`, `EP-029`, B1 freeze (**DEC-0034**)

## Scope completed

Read-only portfolio experience answering **Where is my money?**

| Deliverable | Status |
| --- | --- |
| Portfolio list `/portfolio` with summary chips | PASS |
| Investment cards (what / status / worth / progress / next) | PASS |
| Filters: All · Pending · Active · Completed · Archived | PASS |
| Search + sort (newest / maturity / status) | PASS |
| Investment detail `/portfolio/[investmentId]` (read-only) | PASS |
| Detail: lifecycle, ROI schedule, settlement cues, notices | PASS |
| Empty states (no investments / filtered / archived / completed) | PASS |
| Loading + error presentation | PASS |
| Read path via frozen `InvestmentRepository` + posted ROI aggregates | PASS |
| No edit / deposit / withdraw / Paystack / engine mutation | PASS |

## Explicitly out of scope (deferred)

- Deposits, withdrawals, Add Funds, Paystack (B3)
- Wallet / ledger data binding (B3)
- Admin surfaces
- ROI formula recalculation or ledger posting
- `FINANCIAL_DASHBOARD_PRINCIPLES.md` (before B5)

## Architecture

- Presentation/application layer only: `CustomerPortfolioService` maps certified investment + settlement aggregates to cards/detail
- Routes: `GET /api/customer/investments`, `GET /api/customer/investments/[investmentId]`
- UI: `src/features/customer/portfolio/**` on B1 shell routes
- No changes to investment-engine math, money-movement, or ledger posting behavior

## EP-029 compliance

Portfolio primary question: **Where is my money?**  
Cards and detail reinforce identity, status, value, progress, and next milestone only.

## Verification

| Gate | Result |
| --- | --- |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm run test` | PASS — 42 files / 176 tests |
| `npm run build` | PASS |
| Portfolio + dashboard e2e | PASS |
| Full `npm run test:e2e` | PASS — 30 tests |

## Files added (high level)

- `PORTFOLIO_EXPERIENCE_PRINCIPLES.md`, `DEC-0035`, `DEC-0036`
- `src/application/customer/portfolio-service.ts` (+ tests)
- `src/app/api/customer/investments/**`
- `src/features/customer/portfolio/**`
- `src/app/portfolio/[investmentId]/page.tsx`
- `src/test/e2e/portfolio-experience.spec.ts`

## Readiness for Sprint B3

**READY** — freeze B2 portfolio experience as read-only.

B3 may implement wallet / deposit / withdrawal journeys and ledger binding — not reopen portfolio card/detail philosophy without citing `PORTFOLIO_EXPERIENCE_PRINCIPLES.md`.

## Stop

Sprint B2 complete after full e2e confirmation. Do not start wallet/money mutation UX until B3 is explicitly approved.
