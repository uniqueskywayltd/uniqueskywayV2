# FINANCIAL_VISUALIZATION_GUIDE.md

## Status

**DESIGN AUTHORITY** — Wave B Stage 1 companion  
Governs how money, progress, and time appear in authenticated customer UX.  
Does not change financial math (`FINANCIAL_INVARIANTS.md` wins).

Authority stack:

- `FINANCIAL_INVARIANTS.md` — truth of money  
- `CUSTOMER_EXPERIENCE_PRINCIPLES.md` — experience of money  
- `FINANCIAL_VISUALIZATION_GUIDE.md` — **presentation** of money  
- `STATUS_SYSTEM.md` — status presentation  
- `WAVE_B_UX_SPECIFICATION.md` — screen composition (forthcoming)

## Purpose

Prevent redesign thrash by locking financial presentation before Wave B screens are drawn.

---

## 1. Money formatting

| Rule | Spec |
| --- | --- |
| Source | Always ledger-backed / certified API amounts in **minor units** |
| Display | Use `CurrencyDisplay` (or equivalent) — `en-US`, `USD` |
| Typography | `font-mono tabular-nums` for all money and rates |
| Signs | Prefer explicit credit/debit labels over bare `+`/`-` in dense tables; signed amounts OK in ledger rows |
| Rounding | Never round differently from engine; UI displays posted minors only |
| Client math | **Forbidden** — no ROI or balance recalculation in the browser |

### Positive / negative color

| Kind | Token / tone | Use |
| --- | --- | --- |
| Credited earnings / credits | `text-roi-positive` / positive financial token | Ledger credits, credited ROI |
| Debits / withdrawals / charges | `text-financial-negative` | Withdrawals, debit rows |
| Pending / not final | Neutral / muted | Accrued preview, pending deposits |
| Restricted / failed | Restricted / destructive status tones | Failed, rejected, reversed |

Do not color “accrued” as if it were already withdrawable.

---

## 2. Currency display

- Sole platform currency for Wave B: **USD** (certified Phase 7 posture).
- Always show currency code or symbol consistently within a screen (prefer symbol in cards, code in statements).
- Never invent multi-currency switchers in Wave B.

---

## 3. ROI visualization

| Concept | Visual treatment | Must not |
| --- | --- | --- |
| Plan / published rate | Static text from certified plan terms | Invent rates |
| Credited ROI | Positive tone + ledger linkage | Blend with accrued |
| Accrued / live preview | Muted / “not yet credited” label | Look identical to credited |
| Withdrawable | Wallet available balance treatment | Imply all earnings are withdrawable |

**Accrued ≠ Credited ≠ Withdrawable** must be visually distinct (label + tone + placement).

Use `RoiDisplay` only for rates that are safe to show as percentages from approved sources.

---

## 4. Progress & countdown

| Pattern | Use | Rules |
| --- | --- | --- |
| Progress ring / bar | Investment term completion (% of days or milestones from engine dates) | Based on certified start/maturity dates — not decorative fake progress |
| Countdown | Time until next settlement day or maturity (NY day) | Informational expectancy; **not urgency theater** |
| Day chips | Settlement / earning date markers | Label timezone when date matters: “New York day” |

Forbidden: red pulsing countdowns, “expires soon” scarcity, fake percentages.

Existing `CountdownTimer` may be used only where status is informational and calm.

---

## 5. Charts

Wave B may include **simple**, honest charts later (Wave D may deepen):

| Allowed early | Deferred |
| --- | --- |
| Credited earnings over settled NY days (ledger-backed) | Speculative projections |
| Portfolio composition by principal | Fantasy future value curves |

Charts must cite that they reflect **posted** activity unless explicitly labeled as preview.

---

## 6. Timeline visualization

Vertical timeline for:

- Deposit journey  
- Withdrawal journey  
- Investment lifecycle  
- Notification/activity stream  

Each node: status label (from `STATUS_SYSTEM.md`) + timestamp + short customer explanation.

Past nodes = settled facts. Current node = present status. Future nodes = expected steps only (never guarantees).

---

## 7. Ledger visualization

| Column | Content |
| --- | --- |
| When | Ledger posting time (UTC stored; display local or labeled) |
| What | Human event label (deposit credit, ROI credit, withdrawal debit…) |
| Amount | Signed money with mono numerals |
| Balance after | Optional if API provides; never client-computed |
| Reference | Deep link to related deposit/investment/withdrawal when available |

Dense tables on desktop; stacked cards on mobile.

---

## 8. Settlement visualization

- Present settlement as **New York Day** concepts (`America/New_York`).
- Show “next settlement date” from certified data when available.
- Language: expectancy (“settlement runs for the New York day”) — not “your money is guaranteed at 00:00.”

Admin settlement runs are **not** customer charts; customers see outcomes as credited activity and investment schedule progress.

---

## 9. NY timezone presentation

| Context | Presentation |
| --- | --- |
| Investment earning / maturity dates | Date in NY calendar day; footnote once per page: “Financial dates use America/New_York.” |
| Absolute event times (submit, paid) | Localized display OK; keep ISO internally |
| Countdown to settlement | Relative to NY day boundary when the concept is settlement |

Prefer `DateDisplay` with `FINANCIAL_TIME_ZONE` for financial dates.

---

## 10. Dashboard visualization budget (North Star)

Within ~5 seconds after login, the dashboard should make these scannable (EP-029: one primary question — “How am I doing today?”):

1. Portfolio value (defined honestly in Wave B UX — principal + credited, never invented)  
2. Today’s credited / settled earnings when available  
3. Total credited ROI (lifetime or period — specify in Wave B UX)  
4. Available (withdrawable) balance  
5. Pending actions (deposits/withdrawals needing attention)  
6. At-a-glance investment progress  
7. Next settlement cue (NY)  
8. Important notifications summary  

Everything else is secondary navigation.

---

## 11. Accessibility

- Do not rely on color alone for credit vs debit (include label or sign).
- Maintain contrast for mono numerals on cards.
- Provide text equivalents for rings/charts (`aria-label` with amount/percent).
- Honor reduced motion for progress animations.

---

## Non-goals

- New financial formulas  
- Redesign of public Wave A  
- Speculative “what if you invest more” marketing calculators
