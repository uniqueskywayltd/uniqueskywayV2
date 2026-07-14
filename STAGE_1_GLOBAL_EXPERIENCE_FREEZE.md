# STAGE_1_GLOBAL_EXPERIENCE_FREEZE.md

## Status

**FROZEN** — 2026-07-13  
Consultancy score: **99.8 / 100**  
ADRs: `DEC-0060` (Accepted), `DEC-0061`, `DEC-0062`

## Package

| Document | Role |
| --- | --- |
| `GLOBAL_EXPERIENCE_SPECIFICATION.md` | Master |
| `LOCALIZATION_PRINCIPLES.md` | Language vs mutation |
| `LOCALE_EXPERIENCE_GUIDE.md` | How locale should *feel* |
| `INTERNATIONALIZATION_ARCHITECTURE.md` | Seams |
| `LANGUAGE_GOVERNANCE.md` | Process |
| `LANGUAGE_CATALOG.md` | Supported-language registry |
| `DATE_TIME_LOCALIZATION_GUIDE.md` | Dates / zones |
| `MULTI_CURRENCY_PRESENTATION_GUIDE.md` | Money presentation |
| `RTL_SUPPORT_GUIDE.md` | Bidirectional layout |
| `TRANSLATION_STYLE_GUIDE.md` | Voice |
| `TRANSLATION_KEYS_POLICY.md` | Keys mandatory |

## Freeze rule

Stage 1 design intent is frozen. Philosophy changes require ADR.  
Stage 2 proceeds **one sprint at a time**, starting with **Sprint I1 – Localization Infrastructure** only.

## Explicitly deferred

- Full-platform translation in one pass  
- Legacy content migration before I1 seams exist  
- Admin full localization  
