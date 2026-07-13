# CUSTOMER_EXPERIENCE_PRINCIPLES.md

## Purpose

This document defines the immutable **customer experience principles** for Unique Sky Way after authentication.

It is not a page layout spec.  
It is not an API contract.  
It is not marketing copy.

It is the UX constitution for every surface that shows money, status, progress, or next actions to a logged-in customer.

Wave A established public trust before registration (`v3.0.0`, frozen under `DEC-0029`).  
Wave B and later waves must **fulfill that trust after sign-in**.

## Authority

These principles apply to all customer-facing product work from Wave B onward (`v3.1.0+`), including:

- Dashboard and money home
- Portfolio and investment detail
- Wallet, deposits, withdrawals
- Ledger and transaction history
- Notifications and activity
- Empty, loading, and error states
- Authenticated emails and in-app messaging related to money

If any implementation conflicts with this document, the implementation is wrong.

Changes require:

- An accepted decision record in `DECISIONS.md`
- Updates to the relevant wave UX specification
- Recertification of affected customer surfaces

Official terminology comes from `GLOSSARY.md`.  
Money truth comes from `FINANCIAL_INVARIANTS.md`.  
This document never overrides financial invariants.

## Relationship to other authorities

| Document | Governs |
| --- | --- |
| `PLATFORM_CONSTITUTION.md` | Strategic philosophy, freeze policy, release & roadmap posture (`DEC-0044`) |
| `FINANCIAL_INVARIANTS.md` | How money is created, moved, settled, and reported |
| `CUSTOMER_EXPERIENCE_PRINCIPLES.md` | How money and status are **explained and felt** by customers |
| `WAVE_*_UX_SPECIFICATION.md` | Screen-level Stage 1 design for a specific wave |
| `DEC-0027` / `EP-026` | Design → Approve → Implement before production code |

Wave B Stage 1 must produce `WAVE_B_UX_SPECIFICATION.md` that obeys these principles.

## The one question (Wave B philosophy)

> **What happens after I sign in?**

Every Wave B surface should answer that question with calm clarity—not spectacle.

---

## Global principles

### CXP-001: Money before decoration

Financial information is always more important than visual ornament.

Do not bury balances, statuses, or action outcomes under illustration, animation, or marketing chrome.

### CXP-002: Customers must always know where their money is

At any moment, a customer should be able to answer:

- What can I withdraw?
- What is locked in investments?
- What is pending review?
- What was credited or settled?

If the UI cannot answer these honestly, it is not ready.

### CXP-003: Every balance reconciles with the ledger

Displayed balances must come from certified ledger-backed projections and APIs.

Never invent client-side balances.  
Never recalculate ROI in the browser.  
Never “smooth” numbers that diverge from the engine.

### CXP-004: Never surprise the customer

No silent status jumps.  
No unexplained balance changes.  
No hidden fees language.  
No success celebration that contradicts a pending/failed state.

If something changed, show what changed and why.

### CXP-005: Every financial action has a clear status

Deposits, withdrawals, investments, settlements, and verification steps must expose human-readable statuses aligned to certified state machines.

Waiting must feel informed—not mysterious.

### CXP-006: Progress is visual

Duration, maturity, settlement timing (including New York day concepts where relevant), and funding/withdrawal progress should be visible without requiring customers to decode backend jargon.

### CXP-007: Errors explain the next step

Failures must say:

1. What happened  
2. What the customer can do now  
3. How to get help if needed  

Never dead-end. Never blame without a path forward.

### CXP-008: Trust increases after every interaction

After each successful or recoverable action, the customer should feel more confident—not more anxious.

Tone: calm, precise, adult. Not hyped. Not paternalizing.

### CXP-009: Accrued ≠ Credited ≠ Withdrawable

Language must preserve these distinctions whenever they appear.

Do not collapse them into one “earnings” number that misleads.

### CXP-010: Mobile-first, fast, calm, transparent

Primary journeys must work cleanly on a phone.

Prefer Server Components and minimal JS.  
Prefer instant clarity over decorative delay.  
Prefer disclosure over obscurity.

### CXP-011: Consume frozen engines; do not reopen them

Wave B builds experience on:

- `v2.1.0` Investment Engine  
- `v2.2.0` Money Movement  
- `v2.3.0` Administrative Platform  
- `v3.0.0` Public Wave A (do not casually redesign)

Financial behavior changes require ADR + regression + recertification.

### CXP-012: Celebration without recklessness

Completion moments (funded deposit, activated plan, paid withdrawal) may use restrained delight.

Never celebrate unrealized fantasy returns.  
Never imply guaranteed profits.

### CXP-013: Empty states teach the next honest step

Empty portfolio / empty wallet / no transactions must guide customers without pressure or FOMO theater.

### CXP-014: Continuity with public trust

Authenticated tone must match Wave A: Ink & Horizon, quiet professionalism, no casino/crypto spectacle.

The product after login should feel like the same company the visitor trusted before login.

### CXP-015: Accessibility and recoverability are product features

Keyboard, contrast, focus order, reduced motion, and clear recovery paths are required—not polish.

### CXP-016: One primary financial question per screen

Every authenticated screen answers exactly one primary customer question (`EP-029`).

| Screen | Customer question |
| --- | --- |
| Dashboard | How am I doing today? |
| Portfolio | Where is my money? |
| Investment details | How is this investment progressing? |
| Wallet | How much is available? |
| Deposit | How do I add funds safely? |
| Withdrawal | How do I get my money? |
| Ledger | What exactly happened? |
| Notifications | Did anything important happen? |
| Activity | What have I done recently? |
| Profile | Is my account secure? |

If a screen cannot state its question in one sentence, simplify it.

---

## Wave B Stage 1 design package

Before production implementation, Stage 1 must deliver and approve:

| Document | Role |
| --- | --- |
| `WAVE_B_UX_SPECIFICATION.md` | Screen journeys and IA |
| `FINANCIAL_VISUALIZATION_GUIDE.md` | Money/progress/time presentation |
| `FINANCIAL_MICROCOPY_GUIDE.md` | Financial writing voice |
| `EMPTY_STATES_GUIDE.md` | Sparse and first-use states |
| `STATUS_SYSTEM.md` | Customer-visible status catalog |

Suggested Stage 2 sprints remain B1–B5 after design approval under `DEC-0027`.

---

## Anti-patterns (forbidden)

- Client-side ROI or ledger math
- Fake or estimated balances presented as fact
- Urgency, countdowns-as-pressure, or scarcity theater in money flows
- Hiding pending/rejected states
- Confusing Accrued with Credited or Withdrawable
- Redesigning public Wave A pages in the name of Wave B
- Inventing payment methods, fees, or settlement guarantees not backed by certified systems

---

## Acceptance tests for any Wave B screen

Before certifying a customer money surface, answer **yes** to all:

1. Does the customer know where their money is?  
2. Does every number reconcile with certified sources?  
3. Does every action show an honest status?  
4. Does every error offer a next step?  
5. Would this increase trust after 60 seconds of use?  
6. Does it work calmly on mobile?  
7. Does the screen answer exactly one primary financial question (`EP-029`)?  

If any answer is no, do not certify.
