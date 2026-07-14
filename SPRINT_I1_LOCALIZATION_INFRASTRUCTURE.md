# SPRINT_I1_LOCALIZATION_INFRASTRUCTURE.md

## Status

**IN PROGRESS** — Authorized by Stage 1 freeze (`DEC-0060`)  

## Goal

Ship **localization infrastructure only** — not a full translation of Wave A or the customer portal.

## Scope

| Include | Exclude |
| --- | --- |
| Language catalog module (synced with `LANGUAGE_CATALOG.md`) | Full Wave A string migration (I2) |
| Locale resolver (preference → browser → country → en) | Customer money/success catalogs (I3) |
| Message catalogs + `t(key)` path | Email/notification templates (I4) |
| Cookie + authenticated preference persistence | Production certification (I5) |
| Header / mobile language selector | Translating every existing screen |
| `html lang` / `dir` (RTL shell for Arabic) | New financial features |

## Acceptance

1. Changing language updates cookie and (when signed in) `customer_preferences.language`.  
2. Explicit choice is never overwritten by browser detection.  
3. Missing keys fall back to English.  
4. Arabic selection sets `dir="rtl"`.  
5. Unit tests cover resolver + translate fallback.  
6. Lint / typecheck / unit / build pass.  
