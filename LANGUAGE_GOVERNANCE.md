# LANGUAGE_GOVERNANCE.md

## Status

**APPROVED** — Stage 1 (`DEC-0060`, score **99.8 / 100**)
Companion to `GLOBAL_EXPERIENCE_SPECIFICATION.md` (Milestone 7 / `v3.3.0`)

## Purpose

Define how languages are **added, reviewed, shipped, and corrected**—so Phase 1’s ten languages remain trustworthy.

## Source of truth

| Artifact | Role |
| --- | --- |
| English catalogs | Canonical product meaning |
| `TRANSLATION_STYLE_GUIDE.md` | Tone and financial phrasing |
| `GLOSSARY.md` | Domain terms (prefer stable equivalents across locales) |
| This document | Process and ownership |

## Phase 1 supported set

`en`, `es`, `fr`, `ar`, `pt` (canonical variant TBD in Stage 2 ADR), `hi`, `bn`, `zh-Hans`, `ru`, `ja`

Adding an 11th language requires:

1. Design note + glossary impact  
2. Translator / reviewer coverage  
3. Font and layout validation (especially new scripts)  
4. ADR or Stage 2 sprint authorization  

## Roles

| Role | Responsibility |
| --- | --- |
| Product owner | Priority of surfaces and launch readiness |
| Engineering | Catalog seams, resolver, CI checks for missing keys |
| Language reviewer | Accuracy, tone, financial caution per locale |
| Legal (as needed) | Terms, disclosures, complaint language |
| Support | Knows which locales are live; does not freestyle financial translation |

## Review bar for financial UI copy

Required before marking a locale **customer-money ready**:

- Labels for balances, pending, accrued vs credited preserve certified distinctions  
- Error and failure copy does not invent settlement promises  
- No substitution of currency symbols that imply non-USD money-of-record  
- RTL review completed for Arabic  

Non-financial marketing pages may lag money surfaces under an explicit readiness matrix—but must not claim broader localization than exists.

## Machine translation policy

| Use | Allowed? |
| --- | --- |
| Drafting aid for reviewers | Yes, with disclosure |
| Direct production publish for money UI | No |
| Bulk SEO pages without review | No |
| Internal prototype screenshots | Yes |

## Change control

- English key changes that alter meaning require coordinated updates across shipped locales or temporary English fallback with tracking.  
- Hotfix mistranslations that could mislead money actions are **priority patches** and may ship outside feature freezes with ADR note if freeze language requires it.  
- Cosmetic wording PRs still need language reviewer for non-English.

## Preference & privacy

- Language preference is customer settings data—not marketing segmentation to sell externally.  
- Do not infer sensitive attributes beyond language/locale needs.  
- Detection logs should avoid retaining raw full `Accept-Language` longer than operationally necessary.

## Deprecated / incomplete locales

If a locale must be withdrawn:

1. Stop offering it in the selector.  
2. Map existing preferences to English (or nearest approved fallback) with in-app notice once.  
3. Keep catalogs archive for audit.

## Anti-patterns

- Crowdsourced unmoderated edits to live catalogs  
- Different financial meanings per language “for market fit”  
- Shipping a language in the selector before money-critical strings pass review  
- Using geo to permanently lock language
