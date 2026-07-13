# FINANCIAL_MICROCOPY_GUIDE.md

## Status

**DESIGN AUTHORITY** — Wave B Stage 1 companion  
Writing authority for **every authenticated financial message**: UI labels, statuses, notifications, emails, empty/loading/success/error copy.

Does not override:

- `FINANCIAL_INVARIANTS.md` (math/truth)  
- `GLOSSARY.md` (canonical term meanings)  
- `STATUS_SYSTEM.md` (status labels & journeys)  
- `CUSTOMER_EXPERIENCE_PRINCIPLES.md`

If a term conflicts with the glossary or invariants, those win — update this guide.

---

## Purpose

Keep the authenticated experience **one voice** across web, email, notifications, and future mobile:

Calm. Precise. Adult. Non-hype.  
**Ledger truth before cleverness.**

---

## Voice principles

| Do | Don’t |
| --- | --- |
| Say what is true now | Promise timings (“always in 10 minutes”) |
| Separate Accrued / Credited / Available | Blend into vague “earnings” |
| Name the next step | Leave customers in limbo |
| Use plain status labels | Leak raw enums (`under_review`) |
| Explain failures with recovery | Blame or frighten |
| USD / New York day when relevant | Invent multi-currency or local myths |

---

## Canonical money terms

| Term | Meaning (customer) | Example UI |
| --- | --- | --- |
| **Available Balance** | Money you can use or withdraw now (wallet available) | “Available balance” |
| **Withdrawable** | Synonym of available in withdrawal context | “Withdrawable amount” |
| **Locked** | Principal or funds committed to active investments / rules | “Locked in investments” |
| **Reserved** | Held for an in-flight withdrawal so it cannot be spent twice | “Reserved for withdrawal” |
| **Pending Deposit** | Deposit initiated; not yet confirmed as available | “Pending deposit” |
| **Accrued Earnings** | Associated with an earning date; **not yet credited** to wallet | “Accrued (not yet credited)” |
| **ROI Credited** | Posted to the ledger and reflected in wallet | “ROI credited” |
| **Portfolio value** | Only the exact aggregation approved in Wave B field mapping | Never invent |
| **Settlement** | Process that posts eligible ROI for a **New York day** | “Settlement for [NY date]” |
| **New York day** | Calendar date in `America/New_York` for financial dating | Footnote once per view |

**Never say “interest paid”** unless counsel explicitly requires interest terminology (`GLOSSARY.md`).

---

## Dashboard labels

| Element | Approved copy |
| --- | --- |
| Page title | Dashboard |
| Primary question (sr-only / eyebrow optional) | How you’re doing today |
| Available | Available balance |
| Portfolio | Portfolio |
| Today credited | Credited today |
| No credits today | No credits posted today |
| Pending | Needs your attention |
| Next settlement | Next settlement (New York) |
| Quick fund | Add funds |
| Quick withdraw | Withdraw |
| Recent | Recent activity |

---

## Wallet labels

| Element | Approved copy |
| --- | --- |
| Available | Available balance |
| Locked | Locked in investments |
| Pending | Pending |
| Reserved | Reserved for withdrawal |
| Fund CTA | Add funds |
| Withdraw CTA | Withdraw |
| History | Funding history / Withdrawal history |

Helper under accrued if ever shown near wallet:  
“Accrued earnings are not available to withdraw until they are credited.”

---

## Portfolio & investment

| Element | Approved copy |
| --- | --- |
| List title | Portfolio |
| Empty | No investments yet |
| Active | Active |
| Maturing | Maturing |
| Matured | Matured |
| Progress | Progress toward maturity |
| Accrued | Accrued earnings (not yet credited) |
| Credited | ROI credited |
| Schedule item scheduled | Scheduled |
| Schedule item posted | Credited |
| Schedule item skipped | Skipped |
| Schedule item failed | Settlement failed |

---

## Deposit microcopy

| Moment | Copy |
| --- | --- |
| Title | Add funds |
| Amount | Amount to deposit |
| Confirm | Confirm deposit |
| Created | Deposit created |
| Pending | Awaiting confirmation |
| Confirmed | Available |
| Failed | Deposit failed |
| Cancelled | Deposit cancelled |
| Reversed | Deposit reversed |
| Success body | Your funds are available in your wallet. |
| Failed body | This deposit could not be completed. You can try again or contact support. |
| Next pending | We’ll update this status when confirmation arrives. |

---

## Withdrawal microcopy

| Moment | Copy |
| --- | --- |
| Title | Withdraw |
| Amount | Amount to withdraw |
| Eligibility fail | You can’t withdraw that amount yet. |
| Confirm | Confirm withdrawal |
| Requested | Requested |
| Reserved | Funds reserved |
| Under review | Under review |
| Approved | Approved |
| Processing | Processing |
| Paid | Paid |
| Rejected | Rejected |
| Failed | Failed |
| Success body | Your withdrawal was paid. Confirm receipt with your destination provider if needed. |
| Review body | Your request is under review. This is a normal step before payout. |
| Rejected body | This withdrawal was not approved. Review the reason, then try again or contact support. |

---

## Ledger microcopy

| Element | Copy |
| --- | --- |
| Title | Ledger |
| Empty | No ledger entries yet |
| Credit | Credit |
| Debit | Debit |
| Filter | Filter |
| Export unavailable | Statement export isn’t enabled yet. You can still review your ledger here. |

Row verbs (examples): “Deposit credited”, “ROI credited”, “Withdrawal paid”, “Withdrawal reserved”.

---

## Notifications & email subjects (patterns)

| Event | Pattern |
| --- | --- |
| Deposit confirmed | Deposit available — {amount} |
| Deposit failed | Deposit unsuccessful — {amount} |
| Withdrawal under review | Withdrawal under review — {amount} |
| Withdrawal paid | Withdrawal paid — {amount} |
| ROI credited | ROI credited — {amount} |
| Security | Security alert — {short reason} |

Body opener: state the fact → what it means → next step link.

---

## Empty / loading / success / error

| State | Pattern |
| --- | --- |
| Empty | Title names missing thing + one educating sentence + optional CTA (`EMPTY_STATES_GUIDE.md`) |
| Loading | “Loading your balances…” / skeletons — never “Nothing here” |
| Success | Short fact + optional secondary link |
| Error | “We couldn’t load {X}.” + Retry + Contact |

Generic error (last resort):  
“Something went wrong. Your money is tracked in our ledger. Try again or contact support.”

---

## Forbidden phrases

- Guaranteed returns / risk-free / get rich  
- “Instant enrichment” / casino urgency  
- Fake scarcity (“Only 2 slots left”)  
- “Interest” (unless counsel-required)  
- “Your money is mining / staking” metaphors  
- Raw enums in customer UI  
- “Accrued” presented as spendable  

---

## Consistency checklist (per PR / sprint)

- [ ] Uses canonical terms above  
- [ ] Accrued ≠ Credited ≠ Available respected  
- [ ] Status strings match `STATUS_SYSTEM.md`  
- [ ] Failures include a next step  
- [ ] No timing guarantees  

---

## Relationship to Wave B UX

`WAVE_B_UX_SPECIFICATION.md` defines structure and journeys.  
**This guide defines wording.** Implementation screens pull strings from this authority (or a typed catalog derived from it).
