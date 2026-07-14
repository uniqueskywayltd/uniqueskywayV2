# LOCALIZATION_PRINCIPLES.md

## Status

**APPROVED** — Stage 1 (`DEC-0060`, score **99.8 / 100**)  
Companion to `GLOBAL_EXPERIENCE_SPECIFICATION.md` (Milestone 7 / `v3.3.0`)

## North star

> Can a customer understand and act safely in their language—without the product rewriting financial truth?

## Principles

### LOC-001: Presentation, not mutation

Localization changes **how we say and format**. It never changes **what was recorded**. Balances, fees, ROI postings, and statement totals remain projections of certified financial data.

### LOC-002: English is the meaning source

Catalog keys and canonical meaning originate in English. Other Phase 1 languages are equivalent presentations of that meaning—not alternate product policies.

### LOC-003: Prefer clarity over cleverness

Translated fintech UI must remain sober, precise, and scannable. Avoid slang, culture-specific jokes, and idioms that do not travel.

### LOC-004: Complete critical paths first

Money-critical flows (deposit, withdraw, invest confirmation, OTP/security) must not ship mixed-language half states for a supported locale. Prefer deliberate English fallback for incomplete catalogs over dangerous ambiguity.

### LOC-005: Format with `Intl`, do not invent formatters

Use platform/`Intl` locale formatting for numbers, dates, and lists. Do not hand-roll separators that disagree with CLDR expectations for the active locale.

### LOC-006: Identifiers stay stable

Do not localize:

- Transaction references  
- Wallet / account identifiers  
- Statement IDs  
- Plan codes used as APIs/storage keys  
- Provider references  

Display labels around them may localize; the identifier string does not.

### LOC-007: Respect explicit choice

Detection may suggest a language. Saved preference wins. Geo is never used to coerce.

### LOC-008: RTL is localization, not decoration

Arabic Phase 1 requires bidirectional layout discipline (`RTL_SUPPORT_GUIDE.md`). “Translate strings only” is insufficient.

### LOC-009: Legal and risk language needs owners

Terms, disclosures, and guarantee-adjacent copy require designated review per language. Marketing cannot ship legal locales unilaterally.

### LOC-010: Accessibility is part of localization

Translated UI must keep accessible names, focus order, and sufficient contrast. Expanding text must not bury primary money actions.

### LOC-011: Notifications follow the user’s language

Transactional mail/in-app copy uses the customer’s saved preference when a template exists; otherwise English with a clear path to change language—never silent forced locale.

### LOC-012: No regional financial fiction

Localization must not imply local rails, local currency ledgers, or local settlement guarantees the certified engines do not provide.

## Conflicts

`FINANCIAL_INVARIANTS.md` > this document > any marketing localization brief.
