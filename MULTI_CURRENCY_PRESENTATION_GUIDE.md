# MULTI_CURRENCY_PRESENTATION_GUIDE.md

## Status

**APPROVED** — Stage 1 (`DEC-0060`, score **99.8 / 100**)
Companion to `GLOBAL_EXPERIENCE_SPECIFICATION.md` (Milestone 7 / `v3.3.0`)

## One rule above all

> **Never translate financial values.**  
> Translate only presentation (labels, help, and locale-aware formatting).

Ledger currency of record remains **USD** under certified money movement unless a future ADR changes money-of-record (out of Milestone 7 scope).

## Presentation vs mutation

| Allowed | Forbidden |
| --- | --- |
| Locale-aware grouping/decimal separators | Changing `125000` minor units to another amount |
| Locale-aware currency formatting for USD display | Showing a parallel NGN ledger balance as if it were of record |
| Translating “Available balance” | Translating “TXN-…” references |
| Educational mention of local funding channels **if accurate** | Promising local-currency balances the engine does not hold |

## Amount formatting

1. Domain passes **integer minor units** + ISO currency code (`USD`).  
2. Presentation uses `Intl.NumberFormat(locale, { style: "currency", currency })`.  
3. Do not float-format money from JS `number` approximations in new code paths.  
4. Percentages and ratios use locale percent formatting without inventing ROI math.

### Illustrative displays

Same economic value, different locale formatting:

| Locale | Example presentation |
| --- | --- |
| `en` | `$1,250.00` |
| `de` (if ever) | `1.250,00 $` / locale-typical currency form |
| `fr` | formatting per `fr` conventions for USD |

Phase 1 does **not** require every locale’s currency glyph placement to be hand-tuned beyond `Intl` defaults unless UX review finds harm.

## Multi-currency language (careful wording)

| Intent | Guidance |
| --- | --- |
| Customer funds via familiar rails | Explain the rail; still credit **USD ledger** outcomes honestly |
| Market education | May discuss approximate local purchasing context **without** binding FX rates as product truth |
| FX conversion tables | Not a Phase 1 product feature; requires separate ADR and data source |

## Identifiers and documents

- Statement totals: formatted for locale; totals equal ledger projections.  
- PDF/CSV monetary columns: same magnitudes; headers may localize.  
- QR / referral codes: not currency; do not localize payload.

## Anti-patterns

- Dual-currency dashboards implying two money-of-record balances  
- Auto-FX “available in your local currency” without certified conversion engine  
- Symbol swaps (`$` → `₦`) that imply currency change  
- Rounding theater that disagrees with ledger minor units  

## Conflicts

`FINANCIAL_INVARIANTS.md` and certified USD ledger wins. This guide only shapes presentation.
