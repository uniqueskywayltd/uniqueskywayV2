# NOTIFICATION_EXPERIENCE_PRINCIPLES.md

## Status

**ACCEPTED** — `DEC-0041`  
Authority for how customers are **informed** across authenticated Wave B surfaces.

This document does **not** redesign notification delivery, outbox, or channels. Technical authority remains `NOTIFICATION_SYSTEM.md`. This document governs the customer communication experience.

Aligns with:

- `CUSTOMER_EXPERIENCE_PRINCIPLES.md`  
- `WALLET_EXPERIENCE_PRINCIPLES.md`  
- `PORTFOLIO_EXPERIENCE_PRINCIPLES.md`  
- `WAVE_B_UX_SPECIFICATION.md` §11–§12  
- `FINANCIAL_MICROCOPY_GUIDE.md`  
- `STATUS_SYSTEM.md`  
- `EMPTY_STATES_GUIDE.md`

`FINANCIAL_DASHBOARD_PRINCIPLES.md` is accepted under Sprint B5 / `DEC-0043`.

## North star

Every communication surface answers (`EP-029`):

> **What do I need to know right now?**

Not marketing. Not admin ops. Not payment redesign.

---

## Notification categories

| Category | Customer meaning | Examples |
| --- | --- | --- |
| **Financial** | Money moved or needs attention | Deposit confirmed/failed, withdrawal updates, ROI credited, investment activated/matured |
| **Security** | Account integrity | New device, password change, session revoke, lock |
| **System** | Platform / policy (non-marketing) | Maintenance, counsel-reviewed policy notices |

Marketing must never drown Financial or Security.

---

## Priority

Customer presentation priority (highest first):

1. **Security** (critical / warning)  
2. **Money failure** (deposit/withdrawal failed, rejected)  
3. **Money success** (confirmed, paid, credited)  
4. **System** (info)

Sorting within a group: unread first, then newest.

Tone mapping for chips: `critical` / `warning` → restricted or pending urgency without casino alarm; `success` → matured; `info` → neutral/pending.

---

## Grouping

| Group | Rule |
| --- | --- |
| **Today** | Created on current New York calendar day |
| **Earlier** | Everything else, reverse chronological |

Optional category tabs: All · Financial · Security · System.

---

## Retention & read state

| Rule | Behavior |
| --- | --- |
| Persistence | In-app notifications remain inspectable until product retention policy removes them (engine-owned) |
| Unread | Clear badge; unread filter |
| Mark read | Per item |
| Mark all read | Allowed; audit when mutating |
| Never delete for “mark as clean” | Clearing unread ≠ erasing history |

---

## Customer actions

Every notification should make the next action obvious when one exists:

| Action | When |
| --- | --- |
| Deep link | Deposit, withdrawal, investment, ledger, security settings |
| Mark read | Always for unread |
| Preferences | Link to notification preferences — never hidden |
| Support | On failures / restricted outcomes |

No forced marketing CTAs from the notification center.

---

## Tone

Calm. Precise. Adult. Same voice as `FINANCIAL_MICROCOPY_GUIDE.md`.

- Say what is true now  
- Name the next step  
- Expectancy, not clock promises  
- Failures include recovery without blame  

---

## Escalation

| Level | Surface |
| --- | --- |
| In-app unread | Notification center + nav badge |
| Persistent unread critical | Remains visible; never auto-dismissed by UI gimmicks |
| Help needed | Help Center → Support request → Contact path |

Do not invent SLA timers in copy.

---

## Activity vs notifications vs ledger

| Surface | Question | Content |
| --- | --- | --- |
| Notifications | What do I need to know right now? | Push-style events that matter |
| Activity | What have I done recently? | Customer-initiated + security chronology |
| Ledger | What exactly posted? | Certified financial postings |

Label Financial vs Account/Security on Activity when both appear.

---

## Help, support, What’s New, referrals

| Surface | Role |
| --- | --- |
| Help Center | Searchable educational guidance over approved articles |
| Support request | Structured intake on frozen contact path — no invented ticket engine |
| What’s New | Subtle product/release notes — not marketing blast |
| Referral summary | Read-only over frozen referral records |

---

## Mobile

- Unread filter and category chips thumb-reachable  
- Deep links open the money/security object, not a dead end  
- Mark-read controls large enough for one-hand use  
- Honor `prefers-reduced-motion`  

---

## Forbidden in B4 communication UX

- Payment / Paystack redesign  
- ROI recalculation  
- Admin notification templates console  
- Reporting  
- Authentication redesign  
- Investment or money-movement engine changes  
- Marketing as primary nav content  

Consume certified notification, identity, referral, and contact intake services only.

---

## Acceptance checklist

1. Answers “What do I need to know right now?”  
2. Priority Security > Money failure > Money success > System  
3. Today / Earlier grouping present  
4. Deep links when an object exists  
5. Preferences reachable  
6. Empty / loading / error defined  
7. No new financial logic  
