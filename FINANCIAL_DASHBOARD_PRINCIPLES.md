# FINANCIAL_DASHBOARD_PRINCIPLES.md

## Status

**ACCEPTED** — Sprint B5 / `DEC-0043` freeze package  
Authority for every authenticated **Dashboard** widget from Wave B certification onward.

Aligns with:

- `CUSTOMER_EXPERIENCE_PRINCIPLES.md`  
- `PORTFOLIO_EXPERIENCE_PRINCIPLES.md`  
- `WALLET_EXPERIENCE_PRINCIPLES.md`  
- `NOTIFICATION_EXPERIENCE_PRINCIPLES.md`  
- `WAVE_B_UX_SPECIFICATION.md` §5 / `DEC-0033`  
- `FINANCIAL_VISUALIZATION_GUIDE.md`  
- `EMPTY_STATES_GUIDE.md`  
- `FINANCIAL_INVARIANTS.md` (always wins)

Together with portfolio, wallet, and notification principles, this completes the authenticated experience constitution.

## North star

Dashboard answers exactly one customer question (`EP-029` / `DEC-0033`):

> **How am I doing today?**

It is the **primary financial home** after login — not a Christmas tree of widgets, not a second ledger, not an admin console.

---

## Composition & priority

Default hierarchy (5-second scan):

| Rank | Widget | Question |
| --- | --- | --- |
| 1 | Portfolio value | What is my portfolio worth? |
| 2 | Available balance | How much can I use? |
| 3 | Today’s activity | What happened financially today? |
| 4 | Pending actions | Do I need to do anything? |
| 5 | Investment progress | How are my investments progressing? |
| 6 | Notifications | Did anything important happen? |

Supporting (below the fold / secondary):

- Next settlement (New York day expectancy)  
- Money timeline  
- What’s New  
- Quick actions (Deposit / Withdraw / Portfolio)

Personalization may reorder or hide **supporting** widgets. Hierarchy ranks 1–6 must remain present unless empty by truthful data (not user hide of Available).

---

## Widget contract

Every widget must define:

| Field | Requirement |
| --- | --- |
| **Purpose** | One sentence; one customer question |
| **Priority** | Hierarchy rank or supporting |
| **Data source** | Certified read API / service only — never client math |
| **Refresh** | On navigation/load; optional soft refresh; no polling storms |
| **Loading** | Skeleton matching content shape; `aria-busy` |
| **Empty** | Teach next honest step (`EMPTY_STATES_GUIDE.md`) |
| **Error** | Retry + support path; never invent demo balances |
| **Customer action** | Deep link to portfolio / wallet / notifications / help |
| **Accessibility** | Named region, text alternatives for amounts/status |
| **Mobile** | Stack; amounts mono/readable; thumb-reachable CTAs |
| **Performance budget** | Prefer few parallel customer reads; avoid N+1 widget round-trips when a summary endpoint exists |
| **Relationship to truth** | Presentation of ledger/investment/settlement aggregates only |

---

## Financial truth rules

1. Available ≠ Pending ≠ Locked ≠ Accrued.  
2. Portfolio value uses certified investment/principal aggregates — not ROI recalculation in UI.  
3. Accrued earnings never look like Available.  
4. Settlement cues use America/New_York expectancy — no clock promises.  
5. Quick actions never bypass wallet journeys.

---

## Refresh behavior

| Event | Behavior |
| --- | --- |
| First paint | Load shells immediately; fill numbers when reads resolve |
| Route revisit | Refetch summary reads |
| After deposit/withdraw return | Customer returns via deep link; dashboard refresh on next visit is enough |
| Failure | Show error in widget; do not blank entire dashboard |

---

## Forbidden

- Inventing balances or “demo mode” money  
- Client ROI formula evaluation  
- Admin widgets  
- Marketing as priority widgets  
- Live ticking number animations  

---

## Acceptance checklist

Before shipping a dashboard change:

1. Answers “How am I doing today?” in ≤ 5 seconds  
2. Hierarchy ranks preserved  
3. Numbers reconcile to certified sources  
4. Empty / loading / error defined per widget  
5. Accessibility named regions for money widgets  
6. No new financial engine behavior  
