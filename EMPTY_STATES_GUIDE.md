# EMPTY_STATES_GUIDE.md

## Status

**DESIGN AUTHORITY** — Wave B Stage 1 companion  
Governs empty, first-use, and sparse data states in authenticated customer UX.

Aligned to:

- `CUSTOMER_EXPERIENCE_PRINCIPLES.md` (CXP-013)  
- `FINANCIAL_VISUALIZATION_GUIDE.md`  
- `STATUS_SYSTEM.md`

## Purpose

Financial apps spend a large share of early life in empty states. Empty must **educate and invite the next honest step** — never FOMO, never shame, never fake data.

---

## Anatomy of every empty state

| Element | Required | Notes |
| --- | --- | --- |
| Clear title | Yes | Names what is missing |
| One-sentence explanation | Yes | Why emptiness is normal |
| Primary next action | Usually | One CTA answering the screen’s EP-029 question |
| Secondary link | Optional | Learn more / FAQ / Contact |
| Illustration | Optional | Quiet Ink & Horizon; Lucide OK; no meme art |
| Fake preview data | **Never** | No ghost rows that look real |

Tone: calm teacher, not salesperson.

---

## Catalog

### No investments

| Field | Content |
| --- | --- |
| Question (EP-029) | Where is my money invested? |
| Title | No investments yet |
| Body | When you activate a published plan, it will appear here with progress and settlement cues. |
| Primary | Explore plans / Start investing (deep-link to certified catalog when available) |
| Secondary | How investing works |

### No deposits

| Field | Content |
| --- | --- |
| Question | Have I funded my account? |
| Title | No deposits yet |
| Body | Funding starts a deposit that moves through clear review statuses before it becomes available. |
| Primary | Add funds |
| Secondary | How deposits work |

### No withdrawals

| Field | Content |
| --- | --- |
| Question | Have I cash out? |
| Title | No withdrawals yet |
| Body | When eligible, you can request a transfer. Requests follow reviewed statuses until paid. |
| Primary | Withdraw (if eligible) / View wallet |
| Secondary | How withdrawals work |

### No notifications

| Field | Content |
| --- | --- |
| Question | Did anything important happen? |
| Title | You’re all caught up |
| Body | Security and money events will show here when they occur. |
| Primary | None required |
| Secondary | Notification preferences |

### No activity / timeline

| Field | Content |
| --- | --- |
| Question | What have I done recently? |
| Title | No activity yet |
| Body | Account and money actions will build a clear history as you use the platform. |
| Primary | Go to dashboard |
| Secondary | Get started checklist (if unfunded) |

### No ledger / transactions

| Field | Content |
| --- | --- |
| Question | What exactly happened financially? |
| Title | No ledger entries yet |
| Body | Credited deposits, ROI, and withdrawals appear here after they post to the ledger. |
| Primary | Fund account |
| Secondary | None |

### No referrals

| Field | Content |
| --- | --- |
| Question | Do I have referral activity? |
| Title | No referrals yet |
| Body | If a referral program is available to you, activity will appear here. We do not invent rewards. |
| Primary | View referral rules (when published) / Dashboard |
| Secondary | None |

### No statements

| Field | Content |
| --- | --- |
| Question | Can I download history? |
| Title | No statements yet |
| Body | Statements become available when export capability is enabled for your account. |
| Primary | View ledger |
| Secondary | Contact support |

### No payout methods / destinations

| Field | Content |
| --- | --- |
| Question | Where can I get paid? |
| Title | No payout destinations saved |
| Body | Add an approved destination when withdrawal features require one. Only real provider-backed options appear. |
| Primary | Add payout method (when available) |
| Secondary | Contact support |

### No pending actions

| Field | Content |
| --- | --- |
| Question | Do I need to do anything? |
| Title | Nothing needs your attention |
| Body | Pending deposits, withdrawals, or verification tasks will appear here when action is required. |
| Primary | — |
| Secondary | — |

### Filtered search returns nothing

| Field | Content |
| --- | --- |
| Title | No matches |
| Body | Try a different date range or clear filters. |
| Primary | Clear filters |

---

## Dashboard empty (new account)

Special case: entire money home is sparse.

| Zone | Empty behavior |
| --- | --- |
| Portfolio | No investments + CTA |
| Wallet | Available $0.00 (real zero, not placeholder art) + Add funds |
| Progress | Hidden or “Activate a plan to track progress” |
| Notifications | Quiet “caught up” |

Show a short **getting started** strip (3 steps max): Verify → Fund → Invest — no gamification streaks.

---

## Loading vs empty vs error

| State | Look |
| --- | --- |
| Loading | Skeletons matching layout; no “Nothing here” |
| Empty | This guide |
| Error | Explain failure + retry + support (CXP-007) |

Never show empty content while a request is still loading.

---

## Anti-patterns

- Fake charts with sample money  
- “People like you invested…” social proof  
- Countdown pressure to fund  
- Empty states that open marketing modals  
- Blaming the customer for not investing

---

## Acceptance checklist

For each empty state shipped in Wave B:

1. Educates without hype?  
2. One clear next step?  
3. Real zeros only (no invented demo balances)?  
4. Matches the screen’s primary financial question (EP-029)?
