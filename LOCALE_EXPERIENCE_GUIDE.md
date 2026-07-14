# LOCALE_EXPERIENCE_GUIDE.md

## Status

**APPROVED** — Stage 1 (`DEC-0060`, score **99.8 / 100**)  
Companion to `GLOBAL_EXPERIENCE_SPECIFICATION.md` (Milestone 7 / `v3.3.0`)

## Distinction

| Concern | Question | Primary authority |
| --- | --- | --- |
| Localization / language | What language is the UI in? | `LOCALIZATION_PRINCIPLES.md`, `LANGUAGE_CATALOG.md` |
| **Locale experience** | How should numbers, dates, names, and documents *feel*? | **This guide** |

Language choice and locale formatting are related but not identical. A customer may select French and still deserve French-appropriate date/number presentation without any change to money-of-record.

## Principles

### LEX-001: Locale formats presentation only

Locale never changes ledger amounts, settlement calendar math, or identifiers.

### LEX-002: Prefer `Intl` / CLDR

Use platform `Intl` APIs driven by the active BCP 47 tag (or a documented formatting locale derived from it). Do not invent separator rules.

### LEX-003: Money figures stay honest

- Magnitudes unchanged.  
- Currency of record remains USD unless a future ADR says otherwise.  
- Grouping/decimal glyphs may follow locale; economic value does not.

### LEX-004: Dates stay unambiguous for money

Prefer locale-correct `Intl.DateTimeFormat` forms. Settlement expectancy language still follows `DATE_TIME_LOCALIZATION_GUIDE.md`.

### LEX-005: Time-of-day preference

| Preference | Treatment |
| --- | --- |
| 12-hour vs 24-hour | Follow locale default via `Intl` unless the customer has an explicit time-format preference later |
| Absolute vs relative | Critical money events offer absolute local time on detail views |

### LEX-006: Name order

- Collect structured name parts where product already does.  
- Display order may follow locale conventions; do not invent legal-name rewrites.  
- Brand and legal entity names follow legal guidance, not informal locale whim.

### LEX-007: Address & phone presentation

- Format for readability using locale conventions when displaying.  
- Storage remains structured fields / E.164-style where existing models require it.  
- Do not “pretty translate” postal codes or identifiers.

### LEX-008: Documents & email chrome

| Surface | Locale role |
| --- | --- |
| PDF statements | Localized chrome/headers; amounts formatted; IDs stable; period math unchanged |
| Email footers | Localized boilerplate; links and entity names accurate |
| Sorting | Locale-aware collation for display lists when performance allows |
| Search normalization | Case/diacritic folding per language rules; never rewrite financial IDs in indexes |

### LEX-009: One formatting boundary

Feature UI must not hand-roll `toFixed` / string concatenate for customer money. Shared formatters receive locale + minor units + currency.

## Examples (illustrative)

Number grouping for the same `1250.00` USD (presentation only):

| Locale feel | Example |
| --- | --- |
| Group comma / decimal point | `$1,250.00` |
| Space grouping / decimal comma | forms via `Intl` for that locale |
| Dot grouping / decimal comma | forms via `Intl` for that locale |

Dates:

| Locale feel | Example |
| --- | --- |
| Month-first prose | July 21, 2026 |
| Day-first prose | 21 July 2026 |
| ISO-informed | 2026-07-21 |

## Anti-patterns

- Using locale to imply a local currency ledger  
- Reordering statement columns so totals no longer reconcile visually to policy  
- Locale-specific “rounding for display” that disagrees with minor units  

## Conflicts

`FINANCIAL_INVARIANTS.md` > `MULTI_CURRENCY_PRESENTATION_GUIDE.md` / `DATE_TIME_LOCALIZATION_GUIDE.md` > this guide.
