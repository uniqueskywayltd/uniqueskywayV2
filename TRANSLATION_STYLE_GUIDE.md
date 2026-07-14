# TRANSLATION_STYLE_GUIDE.md

## Status

**APPROVED** — Stage 1 (`DEC-0060`, score **99.8 / 100**)
Companion to `GLOBAL_EXPERIENCE_SPECIFICATION.md` (Milestone 7 / `v3.3.0`)

## Voice

Unique Sky Way remains:

- Calm  
- Precise  
- Premium without hype  
- Honest about process and timing  

Localization must **preserve** that voice—not inject market-local hype, pressure, or casual slang around money.

## Global style rules

1. **Prefer plain words** for money states: available, pending, processing, failed, credited, accrued.  
2. **Keep certified distinctions** (e.g. accrued vs credited) even if a language needs longer phrasing.  
3. **No fake urgency** in any language (“last chance,” countdown bonuses, invite quotas).  
4. **No MLM / recruitment** vocabulary. Referral copy stays recommendation-ethics aligned (`REFERRAL_ETHICS_GUIDE.md`).  
5. **Address the customer respectfully**; avoid overly intimate or command-heavy tones in financial warnings.  
6. **Do not invent guarantees** the English source does not make.  
7. **Brand name** “Unique Sky Way” stays Latin-script brand form unless a legal brand localization exists.

## What not to translate / alter

| Item | Rule |
| --- | --- |
| Amounts | Format only |
| Stable IDs / references | Keep verbatim; isolate in RTL |
| Provider names (e.g. Paystack) | Keep official brand form |
| Plan codes used as keys | Keep verbatim; display name may localize |
| Legal entity names | Per legal guidance |

## Financial microcopy

Follow the spirit of `FINANCIAL_MICROCOPY_GUIDE.md` and language-specific review:

- Errors explain **what happened** and **what to do next** without blaming the customer falsely.  
- Empty states teach without shaming.  
- Settlement timing language stays conservative.

## Inclusive language

- Avoid gendered assumptions where the language allows neutral forms.  
- Avoid regional stereotypes or geopolitical framing in product UI.  
- Disability-aware language: prefer person-respectful terms consistent with a11y practices.

## Length and layout

- Expect ±30–40% expansion vs English for some languages; UI must tolerate wrap.  
- Do not truncate mid-amount or mid-reference.  
- Prefer wrapping labels over shrinking money figures.

## Consistency

Maintain a per-language glossary of recurring terms (wallet, portfolio, deposit, withdrawal, statement, referral). Update `GLOSSARY.md` equivalents tables in Stage 2 as languages ship.

## Review checklist (per string set)

- [ ] Meaning matches English source  
- [ ] No altered financial promise  
- [ ] Identifiers untouched  
- [ ] Tone matches calm premium brand  
- [ ] Fits UI without crushing CTAs  
- [ ] Arabic: RTL reviewed when applicable  

## Anti-patterns

- Marketing team shipping locale pages that contradict money UI terminology  
- Emoji-heavy financial alerts  
- Translating “pending” into a word that means “failed” in common usage  
- Softening security warnings to sound friendlier
