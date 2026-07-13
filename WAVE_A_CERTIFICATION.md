# WAVE_A_CERTIFICATION.md

## Result

**PASS — Wave A certified and frozen at v3.0.0**

Date: 2026-07-13  
Release: **`v3.0.0`** (Customer Experience Platform — Public Trust)  
Branch: `milestone-5-wave-a-sprint-a5` → `main`  
Decision: **`DEC-0029` ACTIVE FREEZE**

Wave A.5 consultancy review: **PASS (98.6 / 100)** — customer trust lens.

## Sprint freeze map

| Sprint | Scope | Certification | Status |
| --- | --- | --- | --- |
| A1 | Public Foundation | `SPRINT_A1_CERTIFICATION.md` | Frozen |
| A2 | Homepage | `SPRINT_A2_CERTIFICATION.md` | Frozen |
| A3 | Trust Experience | `SPRINT_A3_CERTIFICATION.md` | Frozen |
| A4 | Conversion Experience | `SPRINT_A4_CERTIFICATION.md` | Frozen |
| A5 | Legal, 404, Wave A wrap | `SPRINT_A5_CERTIFICATION.md` | Frozen |
| A.5 | Customer trust consultancy | Wave A.5 Review | **PASS** |

## Public surface inventory

| Route | Purpose |
| --- | --- |
| `/` | Flagship homepage |
| `/about` | Credibility |
| `/how-it-works` | Process clarity |
| `/security` | Safety answers |
| `/plans` | Opportunity comparison (catalog placeholders) |
| `/faq` | Objection removal |
| `/contact` | Reachability / intake |
| `/legal/privacy` | Privacy draft |
| `/legal/terms` | Terms draft |
| `/legal/risk` | Risk disclosure draft |
| `/legal/aml` | AML posture draft |
| `/legal/kyc` | KYC expectations draft |
| `/legal/cookies` | Cookie categories draft |
| 404 | Guided recovery |

## Audit package

| Audit | File | Result |
| --- | --- | --- |
| Public experience | `PUBLIC_EXPERIENCE_AUDIT.md` | PASS |
| Accessibility | `ACCESSIBILITY_AUDIT.md` | PASS |
| SEO | `SEO_AUDIT.md` | PASS |
| Performance | `PERFORMANCE_AUDIT.md` | PASS |
| Trust | `TRUST_AUDIT.md` | PASS |

## Frozen core preserved

| System | Version | Untouched by Wave A |
| --- | --- | --- |
| Investment Engine | v2.1.0 | Yes |
| Money Movement | v2.2.0 | Yes |
| Administrative Platform | v2.3.0 | Yes |

## Verification summary

| Gate | Result |
| --- | --- |
| Lint | PASS |
| Typecheck | PASS |
| Unit tests | PASS — 170 |
| Build | PASS |
| E2E | PASS — 25 |
| Wave A.5 trust review | PASS — 98.6 / 100 |

## Change control

Public Wave A routes are frozen. Changes require ADR-level justification and recertification under `DEC-0029`.

Non-blocking A.5 polish (company story depth, founder letter, timeline, `CONTENT_STYLE_GUIDE.md`, etc.) is deferred — do not reopen frozen sprints casually.

## Next train

**Wave B — Customer Money Experience (`v3.1.0`)**: portfolio, deposits, withdrawals, investment tracking — fulfillment after registration. Requires Design → Approve → Implement (`DEC-0027`).
