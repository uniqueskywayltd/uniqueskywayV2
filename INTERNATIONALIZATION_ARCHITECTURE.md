# INTERNATIONALIZATION_ARCHITECTURE.md

## Status

**APPROVED** — Stage 1 (`DEC-0060`, score **99.8 / 100**)
Companion to `GLOBAL_EXPERIENCE_SPECIFICATION.md` (Milestone 7 / `v3.3.0`)

## Purpose

Define **seams and responsibilities** for language, locale formatting, and preference—without choosing a vendor slogans-first. Stage 2 implementation must map to these seams.

## Architectural constraints

1. **No money math in i18n layers** — Catalogs never compute balances.  
2. **Frozen engines untouched** — Investment / money-movement / ledger posting stay English-key domain events; UI maps messages.  
3. **Server and client agree** — Preference resolution must not flicker or diverge across SSR/CSR without documented fallback.  
4. **Auditability** — Locale used for rendering mail/statements metadata should be attributable when disputes arise.

---

## Layers

```text
┌─────────────────────────────────────────────┐
│ Presentation: Next.js UI, emails, PDFs      │
│  - message catalogs                         │
│  - Intl formatters                          │
│  - RTL layout direction                     │
├─────────────────────────────────────────────┤
│ Preference: profile + guest persistence     │
│  - saved language                           │
│  - optional display timezone (existing)     │
├─────────────────────────────────────────────┤
│ Domain / Application (frozen contracts)     │
│  - amounts as integer minor units + USD     │
│  - ISO timestamps / financial TZ rules      │
│  - stable IDs and references                │
├─────────────────────────────────────────────┤
│ Infrastructure: DB, Paystack, ledger        │
│  - no translated storage of economic facts  │
└─────────────────────────────────────────────┘
```

---

## Message catalogs

### Design requirements

| Requirement | Rule |
| --- | --- |
| Key stability | Opaque keys (e.g. `wallet.availableBalance`) — not English sentences as keys |
| ICU / plural | Support plural and selective forms where languages need them |
| Interpolation | Named placeholders only; never concatenate translated fragments unsafely |
| Ownership | Catalogs versioned in-repo; PRs require language governance for non-English edits |
| Fallback | Missing key → English string + structured log in non-prod; never blank money labels |

### Suggested Stage 2 shape (non-binding library choice)

App Router–friendly message loading with:

- Locale-scoped JSON/YAML catalogs under a single `messages/` (or equivalent) tree  
- A thin `t(key, values)` boundary used by feature UI  
- No string literals for user-visible chrome on localized routes after H2  

Library selection (`next-intl`, custom, etc.) is an **implementation ADR in Stage 2**—Stage 1 only requires the seam.

---

## Locale identifiers

| Concern | Standard |
| --- | --- |
| Language tags | BCP 47 (`en`, `es`, `fr`, `ar`, `pt`, `hi`, `bn`, `zh-Hans`, `ru`, `ja`) |
| Storage | Persist BCP 47 tag on customer preference |
| HTML | `<html lang="…">` and `dir="rtl"` when Arabic (and future RTL languages) |

Portuguese: document whether Phase 1 ships `pt` or `pt-BR` as the canonical catalog in Stage 2 H1 ADR—do not ship duplicate unfinished variants.

---

## Language resolution service

Pseudocontract:

```text
resolveLanguage({
  savedPreference?,
  acceptLanguageHeader?,
  countryHint?,
  defaultLanguage: "en"
}) → supported BCP 47 tag
```

Priority matches `GLOBAL_EXPERIENCE_SPECIFICATION.md` §3.

### Country hint

- Optional, lower priority than browser.  
- Only map country → **language suggestion** when a supported language is clear and non-controversial.  
- Never map country → currency-of-ledger, legal entity, or KYC regime under this train.

---

## Formatting boundary

| Data | Storage / domain | Presentation |
| --- | --- | --- |
| Money | Integer minor units + ISO currency (USD of record) | `Intl.NumberFormat` with locale + currency style |
| Dates | UTC / certified financial TZ semantics | `Intl.DateTimeFormat` with locale; settlement honesty per date guide |
| Percents | Domain ratios | Locale-aware percent formatting |
| Lists | Structured arrays | Locale list formatting when needed |

UI helpers (existing `MoneyDisplay` / date helpers) should gain **locale props from the resolver**, not hard-code `en-US` forever once Stage 2 lands.

---

## Directionality

| Language | `dir` |
| --- | --- |
| Arabic (`ar`) | `rtl` |
| All other Phase 1 | `ltr` |

CSS logical properties preferred (`margin-inline-start`, etc.). See `RTL_SUPPORT_GUIDE.md`.

---

## Emails & notifications

- Templates carry locale variants keyed by BCP 47.  
- Send-time resolution uses saved preference, then English.  
- Amounts injected as preformatted strings from the formatting boundary—templates do not re-parse numbers.  
- Subject lines are catalog entries, governed like UI strings.

---

## SEO / public routes (design intent)

- Prefer locale-aware routing strategy decided in Stage 2 (prefix `/es/...` vs cookie-only).  
- Stage 1 constraint: do not invent alternate money claims per locale landing page.  
- `hreflang` only for locales that have approved published content.

---

## Testing seams (Stage 2)

| Gate | Expectation |
| --- | --- |
| Unit | Resolver priority; fallback; money format snapshots per locale |
| E2E | Language selector persists preference; RTL smoke for Arabic |
| Visual | Spot-check truncated buttons / overflow in German-length proxies if needed |
| Financial | Invariant tests remain language-agnostic |

---

## Explicit non-goals

- Per-locale ledger schemas  
- Translating stored customer notes automatically  
- Runtime LLM translation in the request path for money UI  
- Reopening Paystack / settlement architecture for “local payment language”
