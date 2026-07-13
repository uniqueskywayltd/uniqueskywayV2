# WALLET_EXPERIENCE_PRINCIPLES.md

## Status

**ACCEPTED** — `DEC-0038`  
Authority for every wallet, deposit, withdrawal, and money-movement customer screen from Sprint B3 onward.

Aligns with:

- `CUSTOMER_EXPERIENCE_PRINCIPLES.md`  
- `PORTFOLIO_EXPERIENCE_PRINCIPLES.md` (investments stay separate)  
- `WAVE_B_UX_SPECIFICATION.md` §7–§9  
- `FINANCIAL_VISUALIZATION_GUIDE.md`  
- `FINANCIAL_MICROCOPY_GUIDE.md`  
- `STATUS_SYSTEM.md`  
- `EMPTY_STATES_GUIDE.md`  
- `GLOSSARY.md`  
- `FINANCIAL_INVARIANTS.md` (always wins on money truth)

`FINANCIAL_DASHBOARD_PRINCIPLES.md` remains deferred until before Sprint B5.

## North star

Wallet and money journeys answer exactly one customer question (`EP-029`):

> **How do I safely move money?**

Every overview, deposit, withdrawal, timeline, and history must reinforce that answer.

They must **not** become investment shopping, ROI education, admin ops, or Paystack redesign.

---

## What is a Wallet?

The wallet is the customer’s **operational balance** — a financial operations center.

| The wallet is | The wallet is not |
| --- | --- |
| Where available cash lives | A bank account screenshot |
| Where deposits become spendable | An investment portfolio |
| Where withdrawals start | A second ledger of truth |
| How money enters and leaves the platform | A place to invent balances |

Portfolio answers *where money is invested*.  
Wallet answers *how money moves safely*.  
Ledger answers *what exactly posted*.

---

## Balance vocabulary

Every customer-visible balance concept must define all five columns below. Amounts are always ledger-derived (or honest empty). Never invent totals in the UI.

| Concept | Definition | Source of truth | Visual treatment | Customer wording | Relationship to ledger |
| --- | --- | --- | --- | --- | --- |
| **Available Balance** | Spendable / investable cash now | `wallet_balances.available_balance_minor` (FI-200) | Primary large mono | “Available” | Customer available cash account |
| **Pending Balance** | Funds not final — typically in-flight deposits | `pending_balance_minor` + pending deposit intents | Pending tone; smaller than Available | “Pending” / “Pending deposits” | Pending cash; **not spendable** (FI-202) |
| **Locked Balance** | Principal committed to active investments / rules | `locked_balance_minor` | Secondary / muted | “Locked” / “In investments” | Locked principal; **not withdrawable** (FI-203) |
| **Withdrawable Balance** | Amount allowed for a withdrawal request | Same as Available for customer UX (FI-900) | Equal to Available on overview; restated on withdraw confirm | “Withdrawable” (= Available) | Withdrawals reserve from available only |
| **Reserved Balance** | Amount held for an in-flight withdrawal | `reserved_balance_minor` | Pending + explicit “reserved for withdrawal” | “Reserved” | Customer reserved withdrawal account |
| **Credited Earnings** | ROI (or rewards) **already posted** to the ledger | Posted settlement / ledger `roi_settlement` (and related) | Positive financial tone only in activity/history | “Credited” | Exists only after balanced posting |
| **Accrued Earnings** | Planned / scheduled ROI **not yet credited** | Investment schedule rows (`scheduled`) — shown in Portfolio | Muted + “not yet credited” | Never call this wallet Available | **Not** a wallet balance |

Rules:

1. Never style Accrued like Available.  
2. Never claim Credited until a certified posting exists.  
3. Reserved ≠ Locked ≠ Pending — keep labels distinct (`STATUS_SYSTEM.md`, Glossary).

---

## Wallet hierarchy

Wallet overview must display information in this order (customer mental model):

1. **Available Balance**  
2. **Pending Deposits**  
3. **Locked Funds** (include Reserved callout when > 0)  
4. **Recent Activity** (money timeline summaries)  
5. **Deposit** CTA  
6. **Withdraw** CTA  

Supporting histories and ledger deep-links sit below the CTAs — not above Available.

---

## Deposit philosophy

**Money should feel safe. Not fast.**

- Calm steps: amount → confirm → provider → status → timeline  
- No “instant credit” claims  
- Status always maps to certified deposit machine (`STATUS_SYSTEM.md`)  
- Failure and cancel paths teach recovery without blame  
- Celebrate confirmation **restrained**

Primary sub-question on deposit screens: *How do I add funds safely?*

---

## Withdrawal philosophy

Customers fear withdrawals more than deposits. Every withdrawal screen must reduce anxiety.

Always show:

1. **Current status**  
2. **Expected next step**  
3. **Expected timeline** (expectancy language — never hard clock promises)  
4. **Support path**

Reservation must be explained in plain language: funds leave Available so they cannot be spent twice.

Primary sub-question on withdrawal screens: *How do I get my money?*

---

## Money timeline & histories

| Surface | Role |
| --- | --- |
| Wallet recent activity | Orientation — last few money movements |
| Funding history | Deposit intents + outcomes |
| Withdrawal history | Withdrawal requests + outcomes |
| Ledger | Posting-level “what exactly happened?” |

Timeline rows answer: *what / how much / status / what next*.  
No edit. No admin. No invention of missing provider events.

---

## Empty / loading / error

| State | Behavior |
| --- | --- |
| Empty wallet | Teach first deposit; no FOMO |
| Empty histories | Honest “none yet” + CTA to start journey |
| Loading | Skeletons matching hierarchy blocks |
| Error | Retry + support; never invent demo balances |
| Ineligible withdraw | Explain why (available too low / reserved / account) |

---

## Notifications

Money notifications (deposit confirmed/failed, withdrawal updates) deep-link to the relevant money object. Copy from `FINANCIAL_MICROCOPY_GUIDE.md`. B3 may surface links and empty states; notification engine behavior remains certified.

---

## Forbidden in wallet experience

- ROI formula recalculation  
- Investment engine / settlement engine changes  
- Ledger posting rule changes  
- Paystack redesign or second provider  
- Admin functionality  
- Reporting redesign  
- Treating Accrued as Available  

Consume certified deposit, withdrawal, ledger-read, and notification services only.

---

## Acceptance checklist

Before certifying a wallet / deposit / withdrawal screen:

1. Answers “How do I safely move money?” (or the deposit/withdraw sub-question)  
2. Hierarchy starts with Available  
3. Balance vocabulary matches this document  
4. Statuses map 1:1 to `STATUS_SYSTEM.md`  
5. Withdrawal anxiety path present (status → next → expectancy → support)  
6. No new financial logic outside frozen engines  
7. Empty / loading / error defined  
