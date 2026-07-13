# SPRINT_A5_CERTIFICATION.md

## Result

**PASS — Sprint A5 Legal, Compliance & Wave A wrap-up certified**

Date: 2026-07-13  
Branch: `milestone-5-wave-a-sprint-a5`  
Authority: `WAVE_A_UX_SPECIFICATION.md`, `BRAND_ASSETS_SPECIFICATION.md`, `DEC-0028`, Sprint A1–A4 certifications

## Scope completed

| Deliverable | Status |
| --- | --- |
| Privacy Policy `/legal/privacy` | PASS |
| Terms & Conditions `/legal/terms` | PASS |
| Risk Disclosure `/legal/risk` | PASS (UX §5.9 + existing A4 links; counsel-bannered) |
| AML Policy `/legal/aml` | PASS |
| KYC Policy `/legal/kyc` | PASS |
| Cookie Policy `/legal/cookies` | PASS |
| 404 recovery experience | PASS |
| Accessibility / performance / SEO / trust polish | PASS (see audits) |
| Wave A certification package | PASS |

## Legal content classification

Every legal section is labeled as one of:

| Class | Meaning |
| --- | --- |
| Approved company fact / certified platform behavior | Aligned to shipped certified systems |
| Placeholder — details pending lock | Structure present; entity/ops specifics incomplete |
| Requires legal counsel review | Not binding until counsel approves |

Global banner on every legal page: **Subject to legal counsel review**.

No fabricated licenses, certifications, addresses, or regulator endorsements.

## 404 experience

- Professional tone (no jokes / memes)
- Clear explanation + homepage CTA
- FAQ search recovery path
- Suggested destinations: Home, Plans, FAQ, Contact, How it works
- Uses public shell for brand continuity

## Architecture

- Shared legal presentation only (`legal-document-page`, content module)
- Server Components throughout legal suite
- Root `not-found.tsx` polish only — no frozen engine/API changes
- A1–A4 pages not redesigned

## Verification

| Gate | Result |
| --- | --- |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm run test` | PASS — 40 files / 170 tests |
| `npm run build` | PASS |
| `npm run test:e2e` | PASS — 25 tests |

## Files added

- `src/app/(public)/legal/{privacy,terms,risk,aml,kyc,cookies}/page.tsx`
- `src/features/public/content/legal-pages.ts`
- `src/features/public/components/legal/legal-page.tsx`
- `src/features/public/components/legal/legal-document-page.tsx`
- `src/test/e2e/legal-pages.spec.ts`
- `SPRINT_A5_CERTIFICATION.md`
- Wave A package: `WAVE_A_CERTIFICATION.md`, `WAVE_A_FINAL_REPORT.md`, `PUBLIC_EXPERIENCE_AUDIT.md`, `ACCESSIBILITY_AUDIT.md`, `SEO_AUDIT.md`, `PERFORMANCE_AUDIT.md`, `TRUST_AUDIT.md`

## Files modified

- `src/app/not-found.tsx`
- `src/app/sitemap.ts`
- `CHANGELOG.md`
- `DEVELOPMENT_ROADMAP.md`
- `DECISIONS.md`

## Deferred

- Counsel-approved binding legal text
- Entity / address / support-email lock
- Live certified plans catalog
- Cookie preference UI (when non-essential cookies ship)
- Wave B+ money experience

## Release posture

Engineering gates: **PASS**.  
Wave A.5 Review: **PASS (98.6 / 100)**.  
Release: merge to `main`, tag **`v3.0.0`**, activate **`DEC-0029` ACTIVE FREEZE**.

## Stop

Sprint A5 complete. Wave A frozen. Do not begin Wave B in this sprint.
