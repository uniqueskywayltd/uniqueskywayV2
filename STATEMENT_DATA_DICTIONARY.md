# STATEMENT_DATA_DICTIONARY.md

## Status

**ACCEPTED** — Milestone 6 / Sprint G5 (`v3.2.0`)  
Data-field authority for customer statements. Complements:

| Document | Governs |
| --- | --- |
| `STATEMENT_DESIGN_PRINCIPLES.md` | Experience |
| `STATEMENT_EXPERIENCE_GUIDE.md` | Product STA-* rules |
| `STATEMENT_DATA_DICTIONARY.md` | **Fields & provenance** |
| `DEC-0047` | Ledger projection only |

## Rule

Every customer-visible statement figure must map to a row below.  
If a desired field is not listed, it **must not** appear until this dictionary and a DEC are updated.

## Common metadata

| Field | Type | Source | Notes |
| --- | --- | --- | --- |
| `id` | string | Derived | `{type}-{YYYY-MM}` |
| `type` | enum | Product | `monthly` \| `wallet` \| `investment` |
| `typeLabel` | string | Presentation | Human label for type |
| `periodKey` | string | NY calendar | `YYYY-MM` via `America/New_York` |
| `periodLabel` | string | Presentation | e.g. `June 2026` |
| `periodBounds` | string | Presentation | `YYYY-MM-01 → YYYY-MM-DD (NY)` |
| `timezone` | string | Config | Always `America/New_York` |
| `status` / `statusLabel` | enum / string | Product | `ready` / Ready (projection available) |
| `projectedAt` | ISO datetime | Server clock | When this projection was built |
| `currency` | string | Ledger events | Default platform currency (USD) |
| `footer` | string | Product | Legal / non-advice notice |
| `understanding` | string | Product | Customer explanation |
| `scanLimit` | number | Service | Max ledger events scanned for periods |

## Period summary fields

| Field | Type | Source | Notes |
| --- | --- | --- | --- |
| `creditTotalMinor` | string (minor units) | Sum of ledger line credits in scope | Not Available Balance |
| `debitTotalMinor` | string (minor units) | Sum of ledger line debits in scope | Not Available Balance |
| `periodNetMinor` | string (minor units) | `credits − debits` of listed lines | **Period activity net only** |
| `summary.note` | string | Product | Clarifies net ≠ available |
| `lineCount` | number | Count of scoped lines | |

## Category totals

| Field | Type | Source | Notes |
| --- | --- | --- | --- |
| `category` | string | `walletCategory` on ledger leg | e.g. available, pending, locked |
| `creditTotalMinor` | string | Sum credits in category | Period-scoped |
| `debitTotalMinor` | string | Sum debits in category | Period-scoped |

## Line item fields

| Field | Type | Source | Notes |
| --- | --- | --- | --- |
| `id` | string | `ledger_transactions.id` | Via wallet ledger event |
| `transactionType` | string | Ledger | Engine transaction type |
| `label` | string | Presentation | Customer label for type |
| `referenceType` / `referenceId` | string | Ledger | Ownership / deep-link context |
| `description` | string \| null | Ledger | Optional description |
| `amountMinor` | string | Ledger entry | Absolute amount |
| `direction` | debit \| credit | Ledger entry | |
| `currency` | string | Ledger entry | |
| `walletCategory` | string | Wallet account link | |
| `postedAt` | ISO datetime | Ledger transaction | NY grouping uses this |
| `href` | string \| null | Presentation | Deep link when known |

## Explicitly excluded (do not invent)

| Forbidden field | Why |
| --- | --- |
| Opening / closing Available Balance (without full reconstruct ADR) | Not a direct period line projection |
| Accrued earnings mixed into credited totals | Accrued ≠ Credited (`FINANCIAL_INVARIANTS`) |
| Tax owed / tax advice figures | Out of scope |
| Peer / platform average comparisons | Privacy + honesty |
| Independently recalculated ROI | Engine ownership |

## Statement types → line scope

| Type | Included lines |
| --- | --- |
| `monthly` | All wallet ledger events in the NY month |
| `wallet` | Same as monthly (wallet-category emphasis via category totals) |
| `investment` | Investment funding, ROI settlement, maturity principal release, or `referenceType === investment` |

## Provenance principle

Statements are **views** of certified wallet ledger reads (`listWalletLedgerEvents`).  
Dashboard, wallet, and export CSV for a period must not invent alternate math for the same lines.
