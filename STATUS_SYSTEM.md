# STATUS_SYSTEM.md

## Status

**DESIGN AUTHORITY** — Wave B Stage 1 companion  
Single source of truth for **customer-visible** status presentation.

Statuses must map to certified domain state machines. UI may use friendlier labels; it may not invent parallel lifecycles.

Authorities:

- Domain: `src/domains/payments/*`, `src/domains/investments/*`, settlement entities  
- UX: `CUSTOMER_EXPERIENCE_PRINCIPLES.md`, `FINANCIAL_VISUALIZATION_GUIDE.md`  
- Component: `StatusChip` tones (`active` | `pending` | `matured` | `restricted` | `neutral`)

---

## Status object schema

Every customer-visible status must define:

| Field | Meaning |
| --- | --- |
| `id` | Stable machine status (domain enum) |
| `label` | Customer-facing name |
| `tone` | `StatusChip` tone |
| `icon` | Lucide intent (name only in spec; implement in Wave B) |
| `description` | One line for chips/tooltips |
| `customerExplanation` | What this means for the customer |
| `nextExpectedStep` | What usually happens next (expectancy, not promise) |

---

## Tone mapping rules

| Tone | Meaning |
| --- | --- |
| `pending` | Waiting on customer, provider, or review |
| `active` | Healthy in-progress / success path |
| `matured` | Successfully completed terminal success |
| `restricted` | Failed, rejected, reversed, blocked |
| `neutral` | Informational / cancelled / skipped without alarm |

---

## Deposits

Domain: `DepositStatus` = `created` | `pending` | `confirmed` | `failed` | `cancelled` | `reversed`

| id | label | tone | customerExplanation | nextExpectedStep |
| --- | --- | --- | --- | --- |
| `created` | Deposit created | `pending` | We recorded your deposit intent. | Complete payment / provider step if prompted |
| `pending` | Awaiting confirmation | `pending` | Payment is submitted and waiting for confirmation or review. | Wait for provider/admin confirmation; check back for status |
| `confirmed` | Available | `matured` | Funds were confirmed and credited per ledger rules. | Use funds in wallet / invest |
| `failed` | Failed | `restricted` | The deposit could not complete. | Retry with a new deposit or contact support |
| `cancelled` | Cancelled | `neutral` | This deposit was cancelled. | Start a new deposit if needed |
| `reversed` | Reversed | `restricted` | A confirmed deposit was reversed under platform rules. | Review wallet activity; contact support if unclear |

**Customer journey (happy path):** Created → Pending → Confirmed (Available).

---

## Withdrawals

Domain: `WithdrawalStatus` = `requested` | `reserved` | `under_review` | `approved` | `processing` | `paid` | `rejected` | `failed` | `cancelled`

| id | label | tone | customerExplanation | nextExpectedStep |
| --- | --- | --- | --- | --- |
| `requested` | Requested | `pending` | We received your withdrawal request. | Funds reservation / review begins |
| `reserved` | Funds reserved | `pending` | Amount is reserved so it cannot be spent twice. | Review or approval |
| `under_review` | Under review | `pending` | A reviewer is checking this request. | Wait for approve or reject |
| `approved` | Approved | `active` | The request cleared review. | Provider payout processing |
| `processing` | Processing | `pending` | Payout is being sent through the payment provider. | Wait for paid or failure update |
| `paid` | Paid | `matured` | The withdrawal completed successfully. | Confirm receipt in your destination |
| `rejected` | Rejected | `restricted` | The request was not approved. | Read reason if shown; adjust and retry or contact support |
| `failed` | Failed | `restricted` | Processing failed after approval. | Support/recovery path; do not assume silent retry |
| `cancelled` | Cancelled | `neutral` | The withdrawal was cancelled. | Request again if still eligible |

**Customer journey (happy path):** Requested → Reserved → Under review → Approved → Processing → Paid.

---

## Investments

Domain: `InvestmentStatus` = `pending` | `active` | `maturing` | `matured` | `cancelled` | `failed`

| id | label | tone | customerExplanation | nextExpectedStep |
| --- | --- | --- | --- | --- |
| `pending` | Activating | `pending` | Your investment is being activated. | Becomes active when engine confirms |
| `active` | Active | `active` | The investment is running under certified plan terms. | Track settlements and progress |
| `maturing` | Maturing | `pending` | Approaching end of term. | Final settlements / maturity handling |
| `matured` | Matured | `matured` | Term completed under plan rules. | Review principal/ROI outcomes in wallet/ledger |
| `cancelled` | Cancelled | `neutral` | This investment was cancelled. | See ledger for any related postings |
| `failed` | Failed | `restricted` | Activation or lifecycle failed. | Contact support; do not assume funds are invested |

---

## ROI schedule (customer-facing when shown)

Domain: `RoiScheduleStatus` = `scheduled` | `posted` | `skipped` | `failed`

| id | label | tone | customerExplanation | nextExpectedStep |
| --- | --- | --- | --- | --- |
| `scheduled` | Scheduled | `pending` | This earning date is planned; not yet credited. | Wait for settlement posting |
| `posted` | Credited | `matured` | ROI posted to the ledger / wallet. | Reflects in credited totals |
| `skipped` | Skipped | `neutral` | No credit for this date under rules. | Review investment detail |
| `failed` | Failed | `restricted` | Settlement item failed. | Operations recovery; customer sees honest failure |

---

## Settlement runs (rarely customer-direct)

Prefer showing **outcomes** (posted ROI, maturity) rather than admin `SettlementRunStatus`.  
If ever shown: map `pending`/`running` → pending tone; `completed` → matured; `failed`/`cancelled` → restricted/neutral.

---

## Account / security (customer)

| Concept | label examples | tone | nextExpectedStep |
| --- | --- | --- | --- |
| Email unverified | Verify email | `pending` | Open verification email |
| Session active | Active session | `active` | Revoke if unrecognized |
| Trusted device | Trusted | `active` | Remove if not yours |
| KYC needed (when required) | Verification needed | `pending` | Complete requested checks |
| KYC approved | Verified | `matured` | Continue |
| KYC rejected / more info | Action needed | `restricted` | Follow instructions / support |

Customer KYC self-serve UX may deepen in later waves; do not invent document theater early.

---

## Notifications

| Severity | tone | Use |
| --- | --- | --- |
| Informational | `neutral` | General tips |
| Money success | `matured` / `active` | Paid, confirmed, credited |
| Money pending | `pending` | Under review, processing |
| Money / security risk | `restricted` | Failed, rejected, new device |

---

## Copy rules

- Prefer plain language over enum leakage (`under_review` → “Under review”).
- Never promise timing (“always paid in 10 minutes”).
- Always pair failure with a next step.
- Accrued preview statuses must not reuse “Credited” or “Available.”

---

## Implementation contract (Wave B)

1. Map domain status → this catalog in one shared module (`status-presentation.ts` or similar).  
2. Screens consume the map — no one-off color inventions.  
3. E2E asserts critical journeys show customer labels, not raw enums.  
4. Changes to domain enums require updating this document in the same change set.

---

## Acceptance checklist

- [ ] Every shown status has label, tone, explanation, next step  
- [ ] Labels match certified state machines  
- [ ] Failed/rejected always offer recovery path  
- [ ] No fake intermediate statuses for marketing
