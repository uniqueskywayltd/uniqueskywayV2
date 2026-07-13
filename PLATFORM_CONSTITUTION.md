# PLATFORM_CONSTITUTION.md

## Status

**ACCEPTED** — `DEC-0044`  
Strategic constitution for Unique Sky Way V2. Not an API contract. Not a page layout.

This document explains **how** the platform is built and **why** decisions are made the way they are.

If a lower-level document conflicts with financial truth, `FINANCIAL_INVARIANTS.md` wins.  
If a product UX detail conflicts with an experience principle, that principle wins.  
This constitution describes philosophy and process; it does not silently override freeze ADRs.

---

## 1. Project philosophy

1. **Trust over hype** — Calm, precise, adult. Never invent balances, guarantees, or certifications.  
2. **Engineering discipline** — Design → Approve → Implement → Test → Audit → Freeze → Tag.  
3. **Customer-first design** — Every screen answers one primary question (`EP-029`).  
4. **Ledger truth** — Presentation never becomes a second source of money truth.  
5. **Frozen cores stay frozen** — Progress is layered product experience on certified systems.

### Completed frozen train

| Release | Scope |
| --- | --- |
| `v2.1.0` | Investment Engine |
| `v2.2.0` | Money Movement |
| `v2.3.0` | Administrative Platform |
| `v3.0.0` | Public Experience |
| `v3.1.0` | Customer Money Experience |

The platform foundation is complete. New work adds **products inside the platform**, not new foundations.

---

## 2. Frozen release policy

### `v2.x` (engines & admin)

Never modify unless:

1. Accepted ADR / decision record  
2. Regression tests  
3. Recertification of the affected financial or admin package  

### `v3.0` (public experience)

Never modify unless:

1. Accepted ADR  
2. UX approval under Design → Approve → Implement  
3. Regression tests (and recertification when UX philosophy changes)  

### `v3.1` (customer money experience)

Same as `v3.0`, plus respect money experience constitutions:

- `CUSTOMER_EXPERIENCE_PRINCIPLES.md`  
- `PORTFOLIO_EXPERIENCE_PRINCIPLES.md`  
- `WALLET_EXPERIENCE_PRINCIPLES.md`  
- `NOTIFICATION_EXPERIENCE_PRINCIPLES.md`  
- `FINANCIAL_DASHBOARD_PRINCIPLES.md`  

Docs-only clarifications that do not change customer behavior may land as patches without reopening product UX.

---

## 3. Design philosophy

1. **Calm financial UX** — Quiet confirmation; no casino motion or scarcity urgency.  
2. **Ledger truth before cleverness** — Accrued ≠ Credited ≠ Available ≠ Withdrawable.  
3. **One question per screen** — Orient in seconds; do not overload.  
4. **Money before marketing** — Financial hierarchy always beats decoration.  
5. **Honest empty / loading / error** — Teach next steps; never demo-invent money.  
6. **Anxiety reduction on withdrawals** — Status → next step → expectancy → support.  
7. **Public trust precedes money** — Wave A before Wave B remains the sequencing rule for trust journeys.

---

## 4. Engineering philosophy

1. **Modular architecture** — Clear application, domain, infrastructure, and route boundaries.  
2. **Repository pattern** — Persistence behind repositories; no ad hoc SQL in UI.  
3. **Domain boundaries** — Investments, payments, ledger, identity, notifications stay distinct.  
4. **No duplicated business logic** — UI and reports consume certified services; they do not reimplement ROI, settlement, or posting.  
5. **Paystack sole provider** until a superseding provider ADR.  
6. **Security defaults** — CSRF, same-origin, ownership checks, audited sensitive mutations, no secrets in client bundles.

---

## 5. Release process

Mandatory loop for every product train (`DEC-0027` / `EP-026`):

1. **Design** — Specification and principles first  
2. **Approve** — Explicit go-ahead  
3. **Implement** — One approved sprint/scope only  
4. **Test** — Lint, typecheck, unit, e2e, build (and `db:check` when schema touches)  
5. **Audit** — Experience / security / performance / a11y as required by the train  
6. **Freeze** — Decision record + certification package  
7. **Tag** — Annotated SemVer tag; push `main` + tag after sanity check  

Cursor implements approved briefs. Architecture, UX critique, prioritization, and “what not to build” stay outside mechanical coding sessions.

---

## 6. Roadmap philosophy

1. **Build experiences, not feature piles** — Each release train answers a coherent customer question.  
2. **Prefer refinement over expansion** — Deepen trust and clarity before adding surface area.  
3. **Governance before implementation** — Specification and principles precede code.  
4. **Legacy is a feature library** — Remembered V1 ideas are evaluated outside the repo; Cursor never re-analyzes the legacy tree by default.  
5. **Internationalization is a train, not a patch** — Languages, RTL, and locale formatting ship as a governed release (`v3.3.0`), not drive-by string swaps.

### Forward release trains

| Release | Milestone | Intent |
| --- | --- | --- |
| `v3.2.0` | Growth Experience | Retention, statements, education, engagement — no new engines |
| `v3.3.0` | International Platform | i18n, RTL, locale, localized mail/notifications |
| `v3.4.0` | Mobile Experience | PWA, push, offline, mobile polish |
| `v4.0.0` | Ecosystem | Partner/public APIs, enterprise — only after the customer platform is complete |

---

## Authority map (quick index)

| Concern | Authority |
| --- | --- |
| Money math / posting | `FINANCIAL_INVARIANTS.md` |
| Terms | `GLOSSARY.md` |
| Authenticated UX | `CUSTOMER_EXPERIENCE_PRINCIPLES.md` + companions |
| Wave screen design | `WAVE_*_UX_SPECIFICATION.md` |
| Decisions / freezes | `DECISIONS.md` |
| Process | This constitution + `DEC-0027` |

---

## Closing standard

Every new capability should feel like a carefully designed product added to a **stable platform**, not another layer of complexity on an unfinished foundation.

Protect the discipline that got to `v3.1.0`. That discipline is now part of the product.
