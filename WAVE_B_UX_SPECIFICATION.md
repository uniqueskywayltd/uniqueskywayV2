# WAVE_B_UX_SPECIFICATION.md

## Status

**APPROVED** — Wave B / Stage 1  
Approval decision: **`DEC-0032`** (2026-07-13)  
Dashboard primacy: **`DEC-0033`**  
Release target: Customer Money Experience **`v3.1.0`**  
Program: Milestone 5 — Customer Experience Platform (Wave B)  
Governance: `DEC-0026`, `DEC-0027`, `DEC-0030`, `DEC-0031`, `DEC-0032`, `DEC-0033`, `EP-026`, `EP-028`, `EP-029`

**Stage 2 may implement only what is specified.** Deviation requires updating this specification first, or an ADR for philosophy changes.

Wave B.5 / B5 note: add `FINANCIAL_DASHBOARD_PRINCIPLES.md` before Wave B certification (widget constitution). Not required to start B1.

### Companion authorities (required reading)

| Document | Role |
| --- | --- |
| `CUSTOMER_EXPERIENCE_PRINCIPLES.md` | Authenticated UX constitution |
| `FINANCIAL_INVARIANTS.md` | Money truth |
| `FINANCIAL_VISUALIZATION_GUIDE.md` | How money looks |
| `FINANCIAL_MICROCOPY_GUIDE.md` | How money is worded |
| `EMPTY_STATES_GUIDE.md` | Sparse states |
| `STATUS_SYSTEM.md` | Status labels & next steps |
| `WAVE_A_UX_SPECIFICATION.md` | Public trust continuity |
| `BRAND_ASSETS_SPECIFICATION.md` | Visual brand |

### Frozen platform (do not redesign)

- `v2.1.0` Investment Engine  
- `v2.2.0` Money Movement  
- `v2.3.0` Administrative Platform  
- `v3.0.0` Public Wave A (`DEC-0029`)

Wave B **consumes** certified engines and APIs. It does not reopen them.

---

## Purpose

Wave A answered: **Why should I trust Unique Sky Way?**  
Wave B must answer: **I trust you — help me manage my money confidently every day.**

Customers will spend most of their lifetime **inside** this authenticated experience. Clarity after login keeps the trust Wave A earned.

North-star question after sign-in: **What happens after I sign in?**  
Screen rule (`EP-029`): **exactly one primary financial question per screen.**

---

# 1. Authenticated Customer Personas

## 1.1 New customer

| Lens | Detail |
| --- | --- |
| Goals | Verify email, understand wallet zero, fund first time, find a plan without panic |
| Questions | Is my account real? Where do I add money? What happens after I pay? |
| Daily habits | Short visits; checks notifications and deposit status |
| Pain points | Empty states feel like failure; jargon; fear of losing funds in limbo |
| Success | Completes first deposit with clear status; knows available ≠ pending |

## 1.2 Growing investor

| Lens | Detail |
| --- | --- |
| Goals | Track active investments, understand credited vs accrued, plan next deposit |
| Questions | How is my investment progressing? When is next settlement (NY)? Can I withdraw some? |
| Daily habits | Opens dashboard and portfolio; scans pending actions |
| Pain points | Overloaded home; numbers that don’t reconcile; missing next step |
| Success | Answers “How am I doing today?” in under 5 seconds |

## 1.3 Experienced investor

| Lens | Detail |
| --- | --- |
| Goals | Audit ledger, compare matured vs active, export history, manage multiple investments |
| Questions | What exactly posted? Why was a day skipped? Where is principal after maturity? |
| Daily habits | Ledger filters; investment detail deep dives |
| Pain points | Missing references; client-rounded figures; opaque admin delays |
| Success | Full audit clarity without contacting support for routine facts |

## 1.4 Dormant customer

| Lens | Detail |
| --- | --- |
| Goals | Re-orient quickly after weeks away; see what changed |
| Questions | Did anything important happen? Is my money still where I left it? |
| Daily habits | Irregular; relies on notifications and activity |
| Pain points | Stale UI; buried security alerts; no recap |
| Success | Dashboard + alerts explain change set since last visit |

## 1.5 High-value customer

| Lens | Detail |
| --- | --- |
| Goals | Confidence in large balances; precise statuses; predictable withdrawals |
| Questions | Is available correct? Is reservation blocking me? Who is reviewing? |
| Daily habits | Checks wallet + withdrawal status obsessively during cash-out |
| Pain points | Ambiguous timing; celebration that contradicts pending; support dead-ends |
| Success | Calm, exact money language; recoverable failures |

## 1.6 Mobile-first customer

| Lens | Detail |
| --- | --- |
| Goals | One-hand funding, status checks, quick withdrawal requests |
| Questions | Can I do this without pinching tiny type? |
| Daily habits | Phone-only; bottom nav; push/notification driven |
| Pain points | Dense tables; hover-only affordances; unread badge confusion |
| Success | Reachable primary actions; mono numerals readable outdoors |

## 1.7 Desktop customer

| Lens | Detail |
| --- | --- |
| Goals | Side-by-side portfolio and ledger; keyboard power use |
| Questions | Can I filter and export efficiently? |
| Daily habits | Wide viewport; multi-tab research |
| Pain points | Mobile-only patterns that waste space; missing breadcrumbs |
| Success | Dense-but-calm tables; persistent sidebar |

## 1.8 Accessibility user

| Lens | Detail |
| --- | --- |
| Goals | Operate all money tasks via keyboard/screen reader; reduced motion |
| Questions | Are amounts announced correctly? Are statuses not color-only? |
| Daily habits | Assistive tech; needs predictable headings |
| Pain points | Icon-only status; live regions that shout; charts without text |
| Success | WCAG AA+ on money flows; status text always present |

---

# 2. Authenticated Journey

```text
Login → Dashboard → (Portfolio | Wallet | Ledger | Notifications | Profile)
                 ↘ Deposit / Withdraw / Investment detail as tasks
Logout
```

| Stage | Emotion | Decision | Recovery |
| --- | --- | --- | --- |
| Login | Cautious hope | Trust credentials / device | Password reset; verify email gate |
| Dashboard | Oriented | Where to go next | Empty getting-started; pending action CTAs |
| Portfolio | Evaluating | Open detail / invest | Empty “no investments” education |
| Investment detail | Monitoring | Wait / ask support | Failed investment explanation |
| Wallet | Control | Fund or withdraw | Eligibility messaging |
| Deposit | Focused caution | Submit payment | Failed/cancelled → retry path |
| Withdrawal | High anxiety | Confirm request | Rejected/failed → clear next step |
| Ledger | Seeking truth | Filter / export | Empty ledger education |
| Notifications | Vigilance | Mark read / act | Grouping so nothing critical is lost |
| Profile / security | Protective | Revoke session/device | Step-by-step security help |
| Logout | Closure | End session | Confirm if dirty forms mid-task |

**Never surprise:** status changes must be visible on return (dashboard pending + notifications).

---

# 3. Information Architecture

## 3.1 Authenticated sitemap (target)

```text
/dashboard                         Money home — How am I doing today?
/portfolio                         Where is my money invested?
/portfolio/[investmentId]          How is this investment progressing?
/wallet                            How much is available?
/wallet/deposits                   Deposit list / entry
/wallet/deposits/[id]              Deposit detail + timeline
/wallet/withdrawals                Withdrawal list / entry
/wallet/withdrawals/[id]           Withdrawal detail + timeline
/ledger                            What exactly happened?
/notifications                     Did anything important happen?
/activity                          What have I done recently?
/account/profile                   Who am I on this platform?
/account/security                  Is my account secure?
/account/security/sessions
/account/security/trusted-devices
/account/preferences               How should the product behave for me?
```

Existing `/account/*` foundation remains; Wave B **extends** navigation with money hubs rather than rebranding public Wave A.

## 3.2 Navigation

| Region | Contents |
| --- | --- |
| Primary sidebar (desktop) | Dashboard, Portfolio, Wallet, Ledger, Notifications, Activity, Account |
| Top bar | Brand mark, unread badge, quick Add funds / Withdraw (eligibility-aware), profile menu |
| Mobile | Bottom nav: Dashboard · Portfolio · Wallet · Ledger · More |
| More sheet | Notifications, Activity, Profile, Security, Preferences, Help/Contact, Logout |
| Breadcrumbs | Detail pages (investment, deposit, withdrawal) |
| Search (Wave B minimal) | In-ledger + notifications filter; global search deferred if costly |
| Quick actions | Dashboard and wallet: Add funds, Withdraw, View portfolio |

**EP-029:** Navigation labels mirror primary questions, not engineering nouns alone.

---

# 4. Dashboard Philosophy

**One purpose:** Answer **“How am I doing today?”**  
**Governance:** The dashboard is the **primary financial decision surface** (`DEC-0033`). Future widgets must reinforce—not dilute—that role.

### Financial Home Hierarchy (first five seconds)

Explicit priority order (approved refinement):

1. **Portfolio Value**  
2. **Available Balance**  
3. **Today’s Activity**  
4. **Pending Actions**  
5. **Investment Progress**  
6. **Notifications / alerts**  

Everything else can wait. If customers must hunt for where to look first, the dashboard is too busy.

| Hierarchy | Priority order |
| --- | --- |
| Financial | Follow hierarchy above |
| Information | Actionable alerts → next NY settlement → recent financial timeline cues |
| Interaction | Resolve pending → Fund → Withdraw → Open portfolio/ledger |

**Rules:** Money before marketing. No decorative heroes. No public promo modules. No fake sparkline if data isn’t ledger-backed.

---

# 5. Dashboard Blueprint

Within ~5 seconds, customer should see modules in **Financial Home Hierarchy** order:

| Priority | Module | Content | Notes |
| --- | --- | --- | --- |
| 1 | Portfolio value | Aggregate from certified fields only | Link → Portfolio |
| 2 | Available balance | Withdrawable / available | Strong visual weight |
| 3 | Today’s activity | Credited today / money events today | Accrued separate if shown |
| 4 | Pending actions | Deposits/withdrawals/verification needing attention | Count + deep links |
| 5 | Investment progress | Compact strip of active investments | Max 3 + “View all” |
| 6 | Notifications / alerts | Security + money failures + unread | Not marketing |
| — | Next NY settlement | Next relevant NY date cue | Footnote: America/New_York |
| — | Money Timeline (preview) | Latest chronological money events | Link → full timeline |
| — | What’s New | Subtle product update card when present | Non-blocking; dismissible |
| — | Quick actions | Add funds / Withdraw / Portfolio | Disabled states explained |

**Nothing decorative.** Empty modules follow `EMPTY_STATES_GUIDE.md`.

### Money Timeline (approved refinement)

Dedicated chronological view of money (dashboard preview + full surface in later sprint):

Deposit received → Investment activated → ROI credited → Settlement complete → Withdrawal requested → Withdrawal approved → Funds transferred.

One chronology. One source of truth. Strong support tool when it answers “What happened to my money?”

### What’s New (approved refinement)

After releases, a subtle update card may highlight improvements. Never interrupt money tasks; never look like marketing hype.

---

# 6. Portfolio Experience

**Primary question:** Where is my money invested?

## 6.1 List / cards

Each card must answer four questions without opening detail:

1. **What is this?** (plan name / identity)  
2. **What is it worth today?** (certified figures only)  
3. **Where is it in its lifecycle?** (status chip)  
4. **What happens next?** (next settlement / maturity cue)

Also show: principal, progress toward maturity, credited ROI to date (ledger-backed).

Sections: Active · Maturing · Matured · Cancelled/Failed (archived).

## 6.2 Investment detail

**Primary question:** How is this investment progressing?

| Block | Content |
| --- | --- |
| Header | Plan, status, principal |
| Progress | Ring/bar from certified dates (`FINANCIAL_VISUALIZATION_GUIDE.md`) |
| Countdown | Calm expectancy to maturity / next settlement — no scarcity |
| ROI distinction | Accrued (if shown) vs Credited — never merged |
| ROI / settlement timeline | Schedule items with posted/scheduled/skipped/failed |
| Settlement history | Posted credits with dates (NY) |
| Maturity | Outcome expectations in plain language per plan policy |
| Ledger cross-links | Related postings |

Completed / archived investments remain readable and non-editable.

---

# 7. Wallet Experience

**Primary question:** How much is available?  
**Philosophy:** The wallet is a **financial operations center**, not a consumer bank account screenshot.

Visually distinguish without ambiguity:

| Concept | Customer meaning | Visual |
| --- | --- | --- |
| Available / Withdrawable | Usable now | Primary, large mono |
| Pending | Deposits or withdrawals not final | Pending tone |
| Locked | In active investments / platform rules | Secondary |
| Credited | Recently posted credits (ledger) | Positive financial tone when listed |
| Accrued | Not yet credited — never styled like available | Muted + explicit “not yet credited” |
| Reserved (withdrawal) | Held for an in-flight withdrawal | Pending + explanation |

Also show: recent funding summary, recent withdrawal summary, CTAs to deposit/withdraw lists.

**Hierarchy:** Available first → Pending → Locked → Credited activity → Histories.

Never label accrued portfolio earnings as wallet available.

---

# 8. Deposit Journey (customer experience only)

**Primary question:** How do I add funds safely?

### Steps (UX)

1. **Enter amount** — validate min/max messaging from product rules (no invented limits).  
2. **Confirm summary** — amount, currency USD, what happens next.  
3. **Provider / payment step** — redirect or instructed payment flow (Paystack certified); loading calm.  
4. **Return / status view** — map to `created` / `pending` / … per `STATUS_SYSTEM.md`.  
5. **Timeline** — each status with explanation + next expected step.  
6. **Success** — `confirmed` → Available; celebrate **restrained**.  
7. **Failure / cancel** — recovery CTAs (retry, support, FAQ).

**Communication:** In-app status + notification on confirmed/failed. No fake “instant” claims.

**No backend design in this doc** — consume existing certified deposit APIs/behaviors.

---

# 9. Withdrawal Journey (customer experience only)

**Primary question:** How do I get my money?

### Steps (UX)

1. **Eligibility check** — if not eligible, explain why (available too low, pending verification, reservation).  
2. **Enter amount** — cannot exceed available; show remaining after request.  
3. **Confirm** — amount reserved will leave available; review may occur.  
4. **Submit** → statuses: Requested → Reserved → Under review → Approved → Processing → Paid.  
5. **Detail timeline** — always show next expected step.  
6. **Paid** — quiet success; point to destination confirmation outside platform if needed.  
7. **Rejected / failed** — reason when available; funds release expectations; retry guidance.

**Anxiety management:** Prefer progress timeline over spinners-only. Never promise clock times.

---

# 10. Ledger Experience

**Primary question:** What exactly happened?

| Capability | Spec |
| --- | --- |
| List | Chronological ledger-backed entries: when, what, amount, optional running balance if API provides |
| Filters | Date range, credit/debit, type (deposit, ROI, withdrawal, adjustment) |
| Search | Reference / type text |
| Export | Expectation for CSV/statement when capability exists; until then honest “coming when enabled” empty |
| Transparency | Deep link to deposit/investment/withdrawal where related |
| Audit clarity | Customer-readable labels; no raw enum dump |

Mobile: stacked cards. Desktop: table.

---

# 11. Notifications

**Primary question:** Did anything important happen?

| Dimension | Spec |
| --- | --- |
| Priority | Security > Money failure > Money success > System |
| Grouping | Today / Earlier; by category tabs optional |
| Unread | Badge on nav; mark read / mark all |
| Financial | Deposit/withdrawal/investment/settlement credits |
| Security | New device, password change, session revoke |
| System | Maintenance, policy notices (non-marketing) |

Copy from `FINANCIAL_MICROCOPY_GUIDE.md`. Deep link to the relevant money object.

---

# 12. Activity Timeline

**Primary question:** What have I done recently?

Customer-initiated chronology: logins (if exposed), profile changes, deposit/withdrawal requests, investment activations — with clear explanations.

Distinct from ledger (financial postings) though overlapping entry points are OK with labels (“Financial” vs “Account”).

---

# 13. Profile & Security

| Screen | Primary question |
| --- | --- |
| Profile | Who am I on this platform? |
| Security home | Is my account secure? |
| Sessions | Which sessions are active? |
| Trusted devices | Which devices are trusted? |
| Preferences | How should the product behave for me? |
| Verification | What identity steps remain? |

Reuse and polish existing `/account/*` foundation; money nav must coexist without burying security.

---

# 14. Financial Psychology

| Moment | Design response |
| --- | --- |
| Confidence | Exact available + clear status language |
| Waiting | Timeline + next step; NY settlement expectancy |
| Settlement anticipation | Cue without adrenaline |
| Maturity | Plain outcome; link ledger |
| Withdrawal reassurance | Reservation explained; review normalized |
| Error recovery | What / next / help (CXP-007) |
| Celebration | Soft confirmation only on terminal success states |

Trust must **increase** after interactions (CXP-008).

---

# 15. Microcopy

Authority: **`FINANCIAL_MICROCOPY_GUIDE.md`**.

Wave B screens must use standardized terms:

- Accrued Earnings ≠ ROI Credited ≠ Available Balance  
- Pending Deposit / Withdrawal in Review / Paid  
- Settlement / New York day footnotes  

Section-level samples live in the microcopy guide; this UX spec does not reinvent wording.

---

# 16. Motion

| Do | Don’t |
| --- | --- |
| Short fade/slide for panel changes | Flashing balances |
| Progress ring ease calm | Casino confetti / slot spins |
| Skeleton loaders | Fake number tickers |
| Honor `prefers-reduced-motion` | Continuous urgency pulses |

Money feels institutional and quiet (Ink & Horizon continuity).

---

# 17. Accessibility

- Text alternatives for all amounts and statuses  
- Color never sole status channel  
- Focus order: primary money → actions → secondary  
- Target sizes for one-hand mobile  
- Live regions for status changes: polite, not aggressive  
- Charts/rings: `aria-label` with numeric summary  
- WCAG AA+ contrast on financial surfaces  

---

# 18. Mobile Experience

| Pattern | Spec |
| --- | --- |
| Bottom nav | Five items max (Dashboard, Portfolio, Wallet, Ledger, More) |
| Primary money CTAs | Thumb-zone sticky on deposit/withdraw flows |
| Readability | Mono amounts ≥ comfortable body size; avoid tiny footnotes for critical numbers |
| Offline | Honest offline/unavailable screen; no stale balances presented as live without age label |
| One-hand | Avoid required top-corner-only destructive actions |

---

# 19. AI Opportunities (non-advisory)

Allowed assistive roles **without** making regulated investment decisions:

| Opportunity | Boundary |
| --- | --- |
| Explain a status in plain language | Cite `STATUS_SYSTEM.md`; no guaranteed outcomes |
| Help find FAQ / how-to | Retrieval over approved articles |
| Summarize “what changed since last visit” | Only from customer’s own notifications/activity |
| Document / form field guidance | Not “which plan should I buy?” |
| Search help | Navigate IA |

**Forbidden:** Personalized buy/sell advice, projected wealth promises, bypassing risk disclosure.

---

# 20. Success Metrics

| Metric | Intent |
| --- | --- |
| Daily/weekly return visits | Habitual confidence |
| Time-to-orient on dashboard | &lt; 5s to answer “How am I doing?” |
| Deposit completion rate | Journey friction |
| Withdrawal completion / support ticket rate | Confidence vs confusion |
| Portfolio detail views with settlement understanding | Comprehension |
| Error recovery without support | Self-serve health |
| CSAT / qualitative trust comments | Soft signal |

Metrics guide product — they are not fake social proof in UI.

---

# 21. Wave B Readiness Checklist

Before Stage 2 implementation begins:

### Governance

- [ ] `WAVE_B_UX_SPECIFICATION.md` approved (Decision record)  
- [ ] `FINANCIAL_VISUALIZATION_GUIDE.md` accepted  
- [ ] `EMPTY_STATES_GUIDE.md` accepted  
- [ ] `STATUS_SYSTEM.md` accepted  
- [ ] `FINANCIAL_MICROCOPY_GUIDE.md` accepted  
- [ ] `CUSTOMER_EXPERIENCE_PRINCIPLES.md` / `EP-029` acknowledged  

### Truth & mapping

- [ ] Every dashboard number mapped to certified API/ledger field  
- [ ] Accrued ≠ Credited ≠ Withdrawable specified per surface  
- [ ] Deposit/withdrawal/investment statuses mapped 1:1 to domain enums  
- [ ] NY settlement presentation reviewed against financial calendar rules  

### Experience quality

- [ ] Every screen has one primary question  
- [ ] Empty/loading/error states defined  
- [ ] Mobile bottom nav IA agreed  
- [ ] Accessibility plan for money numerals and statuses  
- [ ] No Wave A public redesign in scope  

### Non-goals confirmed

- [ ] No new financial engine behavior  
- [ ] No client-side ROI math  
- [ ] No production code in Stage 1  

---

# API mapping (design note — not implementation)

Wave B UI should consume existing certified customer/admin-facing capabilities where exposed (deposits, withdrawals, summary, notifications, activity, profile/security). Gaps (e.g. public investment list for customer portfolio) require **read-only adapters over certified engines** — specified at implementation sprint kickoff, not invented in UI.

---

# Final design question

> **Would this authenticated experience feel worthy of a premium international investment platform?**

**Assessment (pre-approval):** **Yes — as a Stage 1 blueprint**, provided implementation stays ruthlessly faithful to ledger truth, status honesty, and one-question screens.

### What remains before implementation

1. **Human/product approval** of this document (and companions), via Decision record.  
2. Lock **exact portfolio value formula** displayed on dashboard (field-level mapping workshop with engineering — design must not invent).  
3. Confirm **customer investment listing API** readiness or Stage 2 sequencing (B1 shells first if data contract lands mid-train).  
4. Optional wireframe pass for dashboard/mobile bottom nav (still design-only).  
5. Do **not** start B1 code until items 1–2 are closed.

---

## Stop

End of Stage 1 design deliverable.  
**No production code. No components. No routes. No services.**
