# TRANSLATION_KEYS_POLICY.md

## Status

**APPROVED** — Stage 1 (`DEC-0060` / `DEC-0062`)  
Companion to `GLOBAL_EXPERIENCE_SPECIFICATION.md` (Milestone 7 / `v3.3.0`)

## One rule

> **Never use raw strings in production UI.**  
> Every user-facing production string must have a translation key.

## Examples

Preferred:

```text
dashboard.available_balance
```

Not:

```text
"Available Balance"
```

## Scope

| Surface | Policy |
| --- | --- |
| Production UI (public + authenticated customer) | Keys mandatory (`DEC-0062`) |
| Customer emails / in-app notification templates | Keys mandatory once mail locale templates ship |
| Admin portal | Phase 1 may remain English; when localized, keys mandatory |
| Unit / e2e tests | Raw strings allowed when asserting visible text |
| Temporary prototypes / Storybook-only | Raw strings allowed if clearly non-production |
| Logs, metrics names, OpenTelemetry | Not user-facing — exempt |
| Financial identifiers displayed as data | Not copy — do not key-translate the ID value |

## Key naming

| Rule | Example |
| --- | --- |
| Dot-separated, lowercase, stable | `wallet.available_balance` |
| Domain first, then surface | `auth.login.submit` |
| No English sentences as keys | Avoid `Available Balance` as key |
| Plural forms via ICU / catalog features | `referrals.count` with plural categories |
| Do not encode locale in the key | Never `es.wallet.balance` |

## Authoring order (`DEC-0061`)

1. Write English meaning in the English catalog under the new key.  
2. Product-approve the English string.  
3. Add translations for supported languages under governance review.  

English remains the **canonical authoring language**. Other locales must not invent divergent product policy.

## Fallbacks

- Missing translation for an active locale → English catalog value.  
- Missing English key → engineering defect (fail tests / visible key only in non-prod if needed).  
- Never ship blank labels on money-critical controls.

## Enforcement intent (Sprint I1+)

- Shared `t(key)` (or framework equivalent) is the only production copy path for covered surfaces.  
- New PRs that add raw user-visible strings on covered routes should be rejected in review.  
- Catalog CI may grow to detect obvious hardcoded chrome (progressive, not big-bang).

## Exceptions (narrow)

- User-generated content (names, messages the customer typed)  
- Provider / brand legal names required verbatim  
- Numeric / date formatted output from `Intl` (formatting, not copy keys)

## Conflicts

`LANGUAGE_GOVERNANCE.md` and `TRANSLATION_STYLE_GUIDE.md` govern meaning and tone; this policy governs **how strings enter the product**.
