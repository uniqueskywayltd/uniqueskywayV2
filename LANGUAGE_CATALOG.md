# LANGUAGE_CATALOG.md

## Status

**APPROVED** — Stage 1 (`DEC-0060`)  
**Authority:** Single registry of languages the platform may offer.  
Companion to `GLOBAL_EXPERIENCE_SPECIFICATION.md`, `LANGUAGE_GOVERNANCE.md`

## Permanent catalog columns

| Column | Meaning |
| --- | --- |
| ISO / BCP 47 | Canonical tag used in preference storage and catalogs |
| Native name | Endonym shown in the language selector |
| English name | Internal / admin label |
| Direction | `ltr` or `rtl` |
| Status | `design` · `pilot` · `production` · `retired` |
| Reviewer | Named ownership for locale quality |
| Last updated | ISO date of last catalog governance change |

## Phase 1 languages

| ISO | Native name | English name | Direction | Status | Reviewer | Last updated |
| --- | --- | --- | --- | --- | --- | --- |
| `en` | English | English | LTR | production | Product (canonical) | 2026-07-13 |
| `es` | Español | Spanish | LTR | design | TBD | 2026-07-13 |
| `fr` | Français | French | LTR | design | TBD | 2026-07-13 |
| `ar` | العربية | Arabic | RTL | design | TBD | 2026-07-13 |
| `pt` | Português | Portuguese | LTR | design | TBD | 2026-07-13 |
| `hi` | हिन्दी | Hindi | LTR | design | TBD | 2026-07-13 |
| `bn` | বাংলা | Bengali | LTR | design | TBD | 2026-07-13 |
| `zh-Hans` | 简体中文 | Chinese (Simplified) | LTR | design | TBD | 2026-07-13 |
| `ru` | Русский | Russian | LTR | design | TBD | 2026-07-13 |
| `ja` | 日本語 | Japanese | LTR | design | TBD | 2026-07-13 |

Notes:

- **`en` is production** as the canonical source and current UI language.  
- Other Phase 1 rows are **design**-status until Sprint I-series certificates mark them `pilot` / `production`.  
- Portuguese canonical variant (`pt` vs `pt-BR`) is confirmed in Sprint I1 ADR if catalogs need a single file name—default registry tag remains `pt` until then.  
- Selector shows **native names**; this table remains the governance source.

## Status meanings

| Status | Meaning |
| --- | --- |
| `design` | Approved for Phase 1 intent; not yet offered as a complete customer locale |
| `pilot` | Selectable for limited surfaces; money-critical paths reviewed |
| `production` | Generally available for shipped Global Experience surfaces |
| `retired` | Removed from selector; preferences remapped per `LANGUAGE_GOVERNANCE.md` |

## Change control

- Adding/removing a language or changing direction/status requires updating this file in the same PR as catalog/code changes.  
- Implementation must read supported tags from a code module kept in sync with this table (Sprint I1).  
- Languages offered in the selector during Sprint I1 for infrastructure/RTL testing even while non-English rows remain `design` status; missing strings fall back to English until a locale is certified `pilot` / `production`.
