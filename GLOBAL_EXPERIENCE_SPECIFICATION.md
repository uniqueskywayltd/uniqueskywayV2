# GLOBAL_EXPERIENCE_SPECIFICATION.md

## Status

**APPROVED & FROZEN** — Stage 1 (`DEC-0060`, score **99.8 / 100**)  
Release target: **Global Experience Platform** **`v3.3.0`**  
Program: Milestone 7  
Governance: `PLATFORM_CONSTITUTION.md` (`DEC-0044`), `DEC-0027`, `DEC-0059` (v3.2.0 freeze), `DEC-0060`, `DEC-0061`, `DEC-0062`  
Freeze baselines: `v2.1.0`–`v2.3.0`, `v3.0.0` (`DEC-0029`), `v3.1.0` (`DEC-0043`), `v3.2.0` (`DEC-0059`)  
Freeze record: `STAGE_1_GLOBAL_EXPERIENCE_FREEZE.md`

**Stage 1 is frozen. Stage 2 implements only what is approved—one sprint at a time, starting with I1.**  
Deviation requires updating these Stage 1 documents first, or an ADR for philosophy changes.

### Companion authorities (required reading)

| Document | Role |
| --- | --- |
| `LOCALIZATION_PRINCIPLES.md` | What we localize, what we never touch |
| `LOCALE_EXPERIENCE_GUIDE.md` | How locale should feel (numbers, dates, docs) |
| `INTERNATIONALIZATION_ARCHITECTURE.md` | Technical seams for catalogs, detection, UI |
| `LANGUAGE_GOVERNANCE.md` | Language rollout, ownership, review |
| `LANGUAGE_CATALOG.md` | Permanent supported-language registry |
| `DATE_TIME_LOCALIZATION_GUIDE.md` | Calendars, zones, settlement honesty |
| `MULTI_CURRENCY_PRESENTATION_GUIDE.md` | Display vs money-of-record |
| `RTL_SUPPORT_GUIDE.md` | Bidirectional layout for Phase 1 Arabic |
| `TRANSLATION_STYLE_GUIDE.md` | Voice, tone, financial microcopy rules |
| `TRANSLATION_KEYS_POLICY.md` | Keys mandatory; no raw production UI strings |
| `FINANCIAL_INVARIANTS.md` | Money truth (always wins) |
| `CUSTOMER_EXPERIENCE_PRINCIPLES.md` | Authenticated UX constitution |
| `PLATFORM_CONSTITUTION.md` | Strategic process |

### Frozen platform (do not reopen casually)

- Investment Engine `v2.1.0`  
- Money Movement `v2.2.0`  
- Administrative Platform `v2.3.0`  
- Public Wave A `v3.0.0`  
- Customer Money Experience `v3.1.0`  
- Customer Success Experience `v3.2.0`  

Milestone 7 **localizes presentation** of certified experiences.  
It does **not** invent new financial engines, dual ledgers, NGN money-of-record, regional settlement calendars, or manipulative growth localization.

---

## Purpose

| Era | Question answered |
| --- | --- |
| Wave A (`v3.0.0`) | Why trust us? |
| Wave B (`v3.1.0`) | How do I manage my money? |
| Milestone 6 (`v3.2.0`) | How can I become more successful? |
| Milestone 7 (`v3.3.0`) | **Can I use this platform in my language and locale—without losing trust?** |

Internal product framing:

```text
Global Experience Platform
```

Broader than “International Platform.” It covers **language, localization, accessibility of language choice, and regional presentation**—while keeping a single certified financial core.

North-star test for every Milestone 7 decision:

> Does this help an international customer understand and use the product safely—without translating or rewriting financial truth?

If the answer is marketing expansionism, unreviewed machine translation of money UI, dual-currency theater, or contact scraping for “local virality” — **out of scope**.

---

## Product philosophy (Milestone 7)

1. **One financial truth, many presentations** — Ledger, identifiers, and amounts of record stay immutable; copy and formatting adapt.  
2. **Saved preference beats automation** — Never override an explicit language choice.  
3. **Broad coverage, careful first ship** — Phase 1 targets ten widely spoken languages with governed reviews—not an infinite catalog.  
4. **Header language control** — Visible, calm, expected; never a growth experiment.  
5. **RTL is first-class for Arabic** — Not a late patch.  
6. **Accessibility travels with language** — Localized strings retain meaning; selectors remain keyboard- and screen-reader-usable.  
7. **No new engines** — No ROI, settlement, provider, or ledger redesign disguised as “localization.”  
8. **Legacy is content later** — After framework lands, selectively migrate illustrations, education, FAQs—never V1 business logic.

---

# 1. Customer questions this train answers

| Surface | Customer need |
| --- | --- |
| Language | “Can I read this product in a language I understand?” |
| Locale formatting | “Do dates and money formats match what I expect?” |
| Trust | “Did translation change my balances or references?” |
| Control | “If I pick a language, will the app fight me?” |
| Discovery | “Is language choice findable without hunting?” |

---

# 2. Phase 1 language set

Ordered for governance tracking (not UI sort order):

| # | Language | BCP 47 (primary) | Script | Notes |
| --- | --- | --- | --- | --- |
| 1 | English | `en` | Latin | Source of truth for keys and meaning |
| 2 | Spanish | `es` | Latin | Broad Americas + Spain coverage |
| 3 | French | `fr` | Latin | Africa + Europe coverage |
| 4 | Arabic | `ar` | Arabic | Requires RTL (see `RTL_SUPPORT_GUIDE.md`) |
| 5 | Portuguese | `pt` | Latin | Prefer `pt-BR` messaging where variants matter; document governance choice |
| 6 | Hindi | `hi` | Devanagari | |
| 7 | Bengali | `bn` | Bengali | |
| 8 | Chinese (Simplified) | `zh-Hans` | Hans | |
| 9 | Russian | `ru` | Cyrillic | |
| 10 | Japanese | `ja` | Japanese | |

### Explicit non-goals for Phase 1

- Full dialect completeness (e.g. every Spanish or Arabic regional variant)  
- Automatic translation of customer-generated content  
- Admin portal full localization (may follow after customer surfaces stabilize)  
- Marketing SEO in every locale on day one (coordinate under Stage 2 sprint plan)

---

# 3. Language resolution order

Exact priority (never reorder without ADR):

1. **Saved customer preference** (authenticated profile / durable preference store)  
2. **Browser `Accept-Language` / client locale** (first visit / anonymous)  
3. **Country locale hint** (only if appropriate and explicitly designed—never stronger than 1–2)  
4. **Default English (`en`)**

Rules:

- Explicit choice **must not** be silently overwritten by browser or geo.  
- Changing language updates UI immediately and persists for signed-in customers.  
- Guests may persist via cookie/local preference with the same precedence rules after they choose.  
- Country hint is **never** used to invent financial rules, currency of record, or legal regime.

Details: `INTERNATIONALIZATION_ARCHITECTURE.md`, `LANGUAGE_GOVERNANCE.md`.

---

# 4. Language selector UX

### Placement

| Context | Placement |
| --- | --- |
| Desktop authenticated / public header | Compact control after Account / Notifications: globe + current language label |
| Mobile | Inside the navigation menu—same semantic control, not a floating widget |

### Design constraints

- Not large, not distracting, not promotional.  
- Shows current language in that language’s endonym where practical (e.g., Español, Français, العربية).  
- Keyboard accessible; focus visible; name announces current selection.  
- Does not compete with money hierarchy on `/dashboard`.  
- Does not use urgency, “complete your language,” or gamified locale missions.

Wireframe intent (desktop):

```text
Account   Notifications   🌐 English
```

---

# 5. What may be translated

Allowed (presentation layer):

- UI chrome, navigation, buttons, labels, empty states  
- Help / education / Success Hub copy (after style review)  
- Marketing and legal surfaces that have approved locale versions  
- Emails / notifications templates that have approved locale versions  
- Error messages meant for humans (not stack traces)

Forbidden to “translate” as text replacement:

- Financial **values** (magnitudes remain the recorded amounts)  
- Ledger entries’ economic meaning  
- Account numbers, transaction references, wallet IDs, statement IDs  
- Plan codes / internal enums exposed as identifiers  
- Signatures, hash digests, provider reference codes  

Formatting of numbers and dates **may** adapt to locale; the underlying value and money-of-record do **not**. See `MULTI_CURRENCY_PRESENTATION_GUIDE.md` and `DATE_TIME_LOCALIZATION_GUIDE.md`.

Example:

| Layer | Example |
| --- | --- |
| Label (localizable) | Available Balance → (es) Saldo disponible |
| Value (not rewritten) | `$1,250.00` (locale may affect grouping/decimal glyphs; USD remains unit of record) |

---

# 6. Scope surfaces (design intent)

| Area | Milestone 7 intent |
| --- | --- |
| Public Wave A | Localized chrome and approved page copy |
| Auth / account shell | Localized; language selector always reachable |
| Money Experience (`v3.1.0`) | Labels/help localized; amounts/invariants untouched |
| Success Experience (`v3.2.0`) | Guidance/learning/referral copy localized under style + ethics guides |
| System emails / notifications | Templated locales; financial figures still formatting-only |
| Admin (`v2.3.0`) | Optional Phase 1b / Phase 2—default English until scheduled |

---

# 7. Accessibility & regional adaptation

- Localized strings must preserve meaning; do not shorten financial warnings into ambiguous fluff.  
- Font stack must support Phase 1 scripts (Latin, Arabic, Devanagari, Bengali, Hans, Cyrillic, Japanese).  
- Layout reflows for longer translations and RTL mirrors per `RTL_SUPPORT_GUIDE.md`.  
- Language control itself is an a11y surface (labels, expanded/collapsed state, current language).  
- Regional adaptation means **presentation and communication**, not alternate financial engines.

---

# 8. Legacy content lane (post-framework)

Once the Global Experience framework is approved and implementation seams exist:

**Eligible to evaluate (content / experience only):**

- Illustrations and visual storytelling  
- Onboarding narrative ideas  
- Educational articles and FAQs  
- Help center structures and flows  

**Never migrate as-is:**

- Business logic, posting rules, provider orchestration  
- Architecture patterns that conflict with V2  
- Unreviewed marketing copy that invents guarantees  

Legacy remains a **feature / content library** (`PLATFORM_CONSTITUTION.md`)—not a repo Cursor re-analyzes by default.

---

# 9. Stage 2 sprint shape (authorized after Stage 1 freeze)

| Sprint | Intent |
| --- | --- |
| **I1** | Localization infrastructure — framework, locale resolver, header selector, persistence, RTL shell, catalog loading |
| **I2** | Public Experience (Wave A) only — do not localize customer portal yet |
| **I3** | Customer Experience — dashboard, wallet, portfolio, statements, Success Hub |
| **I4** | Emails & notifications — all customer-facing comms templates |
| **I5** | Certification & freeze (`v3.3.0`) |

Do **not** translate the entire platform in one pass. Infrastructure first, then one experience train at a time.

**English remains the canonical authoring language** (`DEC-0061`). New features are written in English first; translations follow approval.  
**Translation keys are mandatory** for production UI strings (`DEC-0062`).

---

# 10. Anti-patterns (forbidden)

- Drive-by string swaps outside this train  
- Machine-translate-to-production for financial UI without human review  
- Leaderboards / MLM reframed by locale  
- Dual-ledger NGN theater  
- Overriding saved language with geo IP  
- Translating transaction references “for clarity”  
- Shipping half-localized money screens (mixed languages without intentional fallback policy)  
- Contact scraping / address-book “local growth” tools  

---

# 11. Stage 1 exit criteria (met)

1. Master specification and companions (including locale experience, keys policy, language catalog) exist.  
2. **Global Experience Platform** naming reflected in roadmap / constitution.  
3. Consultancy score **99.8 / 100**; `DEC-0060` Accepted; Stage 1 frozen.  
4. Stage 1 commit contains design/governance only (implementation begins in I1+).

Stage 2 begins with **Sprint I1** only.

---

## Authority conflict rule

If any Global Experience guidance conflicts with money truth:

```text
FINANCIAL_INVARIANTS.md wins.
```
