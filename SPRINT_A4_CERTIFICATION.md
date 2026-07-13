# SPRINT_A4_CERTIFICATION.md

## Result

**PASS — Sprint A4 Conversion Experience certified**

Date: 2026-07-13  
Branch: `milestone-5-wave-a-sprint-a4`  
Authority: `WAVE_A_UX_SPECIFICATION.md`, `BRAND_ASSETS_SPECIFICATION.md`, `DEC-0028`, `SPRINT_A1_CERTIFICATION.md`, `SPRINT_A2_CERTIFICATION.md`, `SPRINT_A3_CERTIFICATION.md`

## Scope completed

Conversion Layer public pages only:

| Page | Route | Single purpose | Status |
| --- | --- | --- | --- |
| Investment Plans | `/plans` | Help visitors understand opportunities before registering | PASS |
| FAQ | `/faq` | Remove objections with expandable, categorized answers | PASS |
| Contact | `/contact` | Make the company feel reachable with honest channels | PASS |

Nothing else was implemented (no Legal / Privacy / Terms / AML / KYC / Cookies / Blog / dashboard).

## Architecture compliance

- Reuses A1 `PublicShell` and A3 trust page primitives (`TrustPageHero`, `TrustSection`, `TrustCtaBand`)
- Plans page is Server Components only
- FAQ uses minimal client JS for search + category tabs; accordions are native `<details>`
- Contact uses a client form + Server Action intake (`submitContactIntake`) — **no frozen APIs modified**
- No imports from investment engine, money movement, ledger, ROI calculators, admin, or repositories
- Homepage / About / How It Works / Security untouched

## Performance

| Item | Status |
| --- | --- |
| Server Components first | PASS |
| Minimal client JS (FAQ filter + Contact form) | PASS |
| Static generation of `/plans`, `/faq`, `/contact` | PASS (build ○) |
| No fabricated media / heavy assets | PASS |

## Accessibility

- Semantic article / headings / lists / native FAQ accordion
- Labeled form fields; contact success via `aria-live`
- Keyboardable category tabs and form controls
- Reduced-motion inherits A1 motion primitives on shared heroes/CTAs
- WCAG AA+ target maintained via Ink & Horizon tokens

## SEO

| Item | Status |
| --- | --- |
| Per-page metadata | PASS |
| Canonical / Open Graph / Twitter | PASS |
| WebPage JSON-LD | PASS |
| FAQPage JSON-LD on `/faq` | PASS (`faqPageJsonLd`) |
| Sitemap entries | PASS |
| Internal linking (Plans ↔ How it works ↔ Risk ↔ FAQ ↔ Contact ↔ Register) | PASS |

## Trust review

| Rule | Status |
| --- | --- |
| No fake urgency / countdowns | PASS |
| No fabricated customer counts / testimonials / media logos | PASS |
| No fake compliance badges | PASS |
| No hardcoded fake returns / frontend ROI math | PASS |
| Plans use certified-catalog placeholders only | PASS |
| Contact channels marked pending when unapproved | PASS |
| FAQ answers match certified platform behavior | PASS |

### 5-Second Trust Test

| Question | Plans | FAQ | Contact |
| --- | --- | --- | --- |
| Does it feel professional? | Yes | Yes | Yes |
| Does it reduce uncertainty? | Yes | Yes | Yes |
| Are all claims verifiable? | Yes | Yes | Yes |
| Does it encourage confidence? | Yes | Yes | Yes |
| Does it respect customer intelligence? | Yes | Yes | Yes |

### 60-Second Confidence Test (Wave A permanent rule)

> If a first-time visitor spends 60 seconds on this page, do they feel informed enough to continue toward registration without feeling pressured?

| Page | Result |
| --- | --- |
| Plans | **Yes** — placeholders, lifecycle, eligibility, and risk note without scarcity theater |
| FAQ | **Yes** — objections cleared by category; CTA remains optional |
| Contact | **Yes** — reachable intake with honest pending channels; no invented prestige address |

## Conversion review

| Criterion | Status |
| --- | --- |
| Plans → Register CTAs present without pressure | PASS |
| FAQ clears practical objections before signup | PASS |
| Contact form works (validated intake + confirmation) | PASS |
| Unpublished contact channels marked pending | PASS |
| Risk disclosure linked from Plans | PASS |

## Verification

| Gate | Result |
| --- | --- |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm run test` | PASS — 40 files / 170 tests |
| `npm run build` | PASS |
| `npm run test:e2e` | PASS — 22 tests (includes A4 conversion pages) |

## Files added

- `src/app/(public)/plans/page.tsx`
- `src/app/(public)/faq/page.tsx`
- `src/app/(public)/contact/page.tsx`
- `src/features/public/content/conversion-pages.ts`
- `src/features/public/components/conversion/faq-explorer.tsx`
- `src/features/public/components/conversion/contact-form.tsx`
- `src/features/public/actions/contact-intake.ts`
- `src/features/public/actions/contact-intake.test.ts`
- `src/test/e2e/conversion-pages.spec.ts`
- `SPRINT_A4_CERTIFICATION.md`

## Files modified

- `src/app/sitemap.ts` — add Plans / FAQ / Contact
- `src/lib/seo/metadata.ts` — add `faqPageJsonLd`
- `src/lib/seo/metadata.test.ts` — cover FAQ JSON-LD
- `.env.example` — document optional `CONTACT_SUPPORT_EMAIL`

## Deferred work (not A4)

- Sprint A5 Legal pages (Privacy, Terms, Risk, AML, KYC, Cookies) — counsel-required
- Live certified plans catalog binding (replace placeholders when public read contract exists)
- Staff inbox email delivery when `CONTACT_SUPPORT_EMAIL` is ops-approved
- Final brand photography / entity lock

## Readiness for Sprint A5

**READY** — freeze Sprint A4 Conversion Experience.

Sprint A5 may implement **only**:

- Legal pages + polish + Wave A certification

Do **not** reopen Plans / FAQ / Contact except bugfix.
Do **not** touch frozen A1–A3 pages or v2.1 / v2.2 / v2.3 engines.

## Stop

Sprint A4 complete. Stop after this certification.
