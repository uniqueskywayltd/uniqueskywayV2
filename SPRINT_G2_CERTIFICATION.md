# SPRINT_G2_CERTIFICATION.md

## Result

**PASS — Sprint G2 Statements Experience certified (pending consultancy product review)**

Date: 2026-07-13  
Branch: `milestone-6-sprint-g2-statements`  
Authority: `STATEMENT_DESIGN_PRINCIPLES.md` (**DEC-0050**), `STATEMENT_EXPERIENCE_GUIDE.md`, `DEC-0047`, `GROWTH_EXPERIENCE_SPECIFICATION.md`, `EP-029`

## Scope completed

Customer statements answering **Can I understand my financial history?**

| Deliverable | Status |
| --- | --- |
| Statement list with type filters + search | PASS |
| Statement detail (reading order, NY timezone, projected-at) | PASS |
| Monthly / wallet / investment projections from wallet ledger events | PASS |
| Period credit/debit/net from listed lines only (not available balance) | PASS |
| Download history (audit-backed) + CSV export of same lines | PASS |
| Empty states + legal footer | PASS |
| No ledger/ROI/accounting engine changes | PASS |

## Explicitly out of scope

- Independent financial calculations / tax engines  
- Opening/closing available balance invention  
- Admin reports  
- `STATEMENT_DATA_DICTIONARY.md` (before G5)  
- Education (G3) / Referrals (G4)  

## Architecture

- `CustomerStatementService` projects `listWalletLedgerEvents` by New York month  
- Routes: `GET /api/customer/statements`, `GET …/[statementId]`, `POST …/download` (CSRF + audit)  
- UI: `src/features/customer/statements/*`  
- Statement ids: `monthly-YYYY-MM` (colon aliases accepted in parser)

## Verification

| Gate | Result |
| --- | --- |
| Lint | PASS |
| Typecheck | PASS |
| Unit `statement-service.test.ts` | PASS (7) |
| E2E statements + success hub | PASS (5) |

## Stop

Do not start G3 until consultancy accepts this sprint and merges to `main`.
