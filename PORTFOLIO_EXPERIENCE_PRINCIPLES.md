# PORTFOLIO_EXPERIENCE_PRINCIPLES.md

## Status

**ACCEPTED** — `DEC-0035`  
Authority for every portfolio-related authenticated screen from Sprint B2 onward.

Aligns with:

- `CUSTOMER_EXPERIENCE_PRINCIPLES.md`  
- `WAVE_B_UX_SPECIFICATION.md` §6  
- `FINANCIAL_VISUALIZATION_GUIDE.md`  
- `FINANCIAL_MICROCOPY_GUIDE.md`  
- `STATUS_SYSTEM.md`  
- `EMPTY_STATES_GUIDE.md`  
- `FINANCIAL_INVARIANTS.md` (always wins on money truth)

## North star

Portfolio answers exactly one customer question (`EP-029`):

> **Where is my money?**

Every card, filter, and detail view must reinforce that answer. No deposits, withdrawals, or mutations.

---

## Investment Card

An Investment Card is a scannable summary of one certified investment.

It must answer four questions without opening detail:

1. **What is this?** — plan name / identity  
2. **What is it worth today?** — principal (and ROI credited when available), never invented totals  
3. **Where is it in its lifecycle?** — status chip from `STATUS_SYSTEM.md`  
4. **What happens next?** — next settlement cue or maturity expectancy  

### Hierarchy on a card

1. Identity + status  
2. Principal  
3. ROI credited (ledger/settlement aggregate — not recalculated ROI math)  
4. Progress toward maturity  
5. Next milestone  

### Forbidden on cards

- Edit / cancel / top-up actions in B2  
- Client-side ROI formula evaluation  
- Fake “live ticking” earnings  

---

## Summary vs detail

| Surface | Role |
| --- | --- |
| Portfolio list | Orientation — where money is across investments |
| Investment detail | Depth — how this investment progresses |

Detail may include timeline, ROI schedule, settlement cues, lifecycle facts, notices.  
**No editing. No financial mutation.**

---

## Progress & countdown

- Progress derives from certified start/maturity (or term) dates — presentation only.  
- Countdown is calm expectancy toward maturity / next NY settlement date.  
- No scarcity, no red urgency pulses (`FINANCIAL_VISUALIZATION_GUIDE.md`).

---

## ROI visualization

- **Accrued / scheduled** ≠ **Credited / posted**  
- Credited amounts come from certified posted aggregates (e.g. settlement posted ROI sum).  
- Schedule rows show status labels from `STATUS_SYSTEM.md`.  

---

## Maturity & settlement

- Matured investments remain readable in Completed filters.  
- Settlement presentation uses New York day language.  
- Expectancy — never “guaranteed at midnight” promises.

---

## Archive behavior

| Bucket | Statuses |
| --- | --- |
| Pending | `pending` |
| Active | `active`, `maturing` |
| Completed | `matured` |
| Archived | `cancelled`, `failed` |

Archived stays inspectable; never delete history from UX.

---

## Filtering & sorting

Required:

- Filters: All · Pending · Active · Completed · Archived  
- Search: plan name / investment id  
- Sort: Newest · Maturity soonest · Status  

Empty filtered results explain how to clear filters (`EMPTY_STATES_GUIDE.md`).

---

## Empty / loading / error

| State | Behavior |
| --- | --- |
| No investments | Educate next honest step (explore plans / dashboard) — no FOMO |
| Filtered empty | Clear filters CTA |
| Loading | Skeletons matching card grid |
| Error | Retry + support path; never invent demo portfolio |

---

## Mobile

- Stacked cards  
- Sticky filter chips when needed  
- Mono amounts readable outdoors  
- Detail sections accordion or sequential blocks  

---

## Read-only contract

Sprint B2 and portfolio surfaces must:

- Consume certified investment / settlement reads only  
- Never invent client ROI  
- Never trigger Paystack, deposits, withdrawals, or ledger posts  

---

## Acceptance checklist

Before certifying a portfolio screen:

1. Answers “Where is my money?”  
2. Cards answer the four questions  
3. Numbers reconcile to certified sources  
4. Statuses match `STATUS_SYSTEM.md`  
5. Empty/loading/error defined  
6. No mutation controls  
