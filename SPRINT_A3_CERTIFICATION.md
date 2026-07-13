# SPRINT_A3_CERTIFICATION.md

## Result

**PASS — Sprint A3 Trust Experience certified**

Date: 2026-07-13  
Branch: `milestone-5-wave-a-sprint-a3`  
Authority: `WAVE_A_UX_SPECIFICATION.md`, `BRAND_ASSETS_SPECIFICATION.md`, `DEC-0028`, `SPRINT_A1_CERTIFICATION.md`, `SPRINT_A2_CERTIFICATION.md`

## Scope completed

Trust Layer public pages only:

| Page | Route | Single purpose | Status |
| --- | --- | --- | --- |
| About | `/about` | Build company credibility | PASS |
| How It Works | `/how-it-works` | Make investing feel simple | PASS |
| Security | `/security` | Answer “Is my money and my account safe?” | PASS |

Nothing else was implemented (no Plans, FAQ, Contact, Legal content pages).

## Architecture review

- Reuses certified A1 `PublicShell` / header / footer / navigation
- Server Components for all three pages (`page.tsx` + shared trust primitives)
- Content isolated in `src/features/public/content/trust-pages.ts`
- Shared layout primitives in `src/features/public/components/trust/trust-page.tsx`
- Client JS remains limited to A1 mobile menu (`FadeIn` is motion-safe / reduced-motion aware)
- No imports from investment engine, money movement, ledger, deposits, withdrawals, admin, or repositories
- Homepage unchanged (A2 remains frozen)

## Performance

| Item | Status |
| --- | --- |
| Server Components first | PASS |
| Minimal JavaScript | PASS |
| Static generation of `/about`, `/how-it-works`, `/security` | PASS (build output ○) |
| No heavy bitmaps required | PASS (Lucide + CSS atmosphere) |

## Accessibility

- Semantic `<article>`, landmarks via hero `aria-label` = page purpose
- Heading hierarchy H1 → H2
- Keyboardable CTAs and policy links
- Reduced-motion inherits A1 motion primitives
- WCAG AA+ target maintained (contrast via Ink & Horizon tokens)

## SEO

| Item | Status |
| --- | --- |
| Per-page metadata (`buildPageMetadata`) | PASS |
| Canonical URLs | PASS |
| Open Graph / Twitter | PASS |
| WebPage JSON-LD per trust page | PASS (`webPageJsonLd`) |
| Sitemap entries for three routes | PASS |
| Internal linking (About ↔ Security ↔ How it works ↔ Register/Contact) | PASS |

## Design compliance

- Ink & Horizon continuing from A1/A2
- Instrument Serif display + Geist UI
- Quiet, professional, international tone — no flashy marketing
- Cards used for scannable philosophy / journey / notes blocks — not as hero spectacle
- How It Works uses restrained Lucide step illustrations (not decorative collage)

## Trust compliance

| Rule | Status |
| --- | --- |
| No legacy Gold Trafigura / OFC / sovereign prestige copy | PASS |
| No invented certifications or audits | PASS |
| No guaranteed wealth / risk-free promise claims | PASS (Security explicitly rejects them) |
| No fabricated stats / testimonials / urgency | PASS |
| Claims limited to process, philosophy, and honest omissions | PASS |
| Legal policy links present with counsel-approval caveat | PASS |

### 5-Second Trust Test (permanent UX acceptance)

| Question | About | How It Works | Security |
| --- | --- | --- | --- |
| Does this page immediately communicate professionalism? | Yes | Yes | Yes |
| Does it reduce uncertainty instead of creating hype? | Yes | Yes | Yes |
| Is every claim verifiable or intentionally omitted? | Yes | Yes | Yes |
| Would a first-time visitor feel comfortable continuing? | Yes | Yes | Yes |
| Does the page encourage exploration without pressure? | Yes | Yes | Yes |

**All Yes — pages may be certified.**

## Verification

| Gate | Result |
| --- | --- |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm run test` | PASS — 39 files / 166 tests |
| `npm run build` | PASS |
| `npm run test:e2e` | PASS — 19 tests (includes A3 trust pages) |

## Files added

- `src/app/(public)/about/page.tsx`
- `src/app/(public)/how-it-works/page.tsx`
- `src/app/(public)/security/page.tsx`
- `src/features/public/components/trust/trust-page.tsx`
- `src/features/public/content/trust-pages.ts`
- `src/test/e2e/trust-pages.spec.ts`
- `SPRINT_A3_CERTIFICATION.md`

## Files modified

- `src/app/sitemap.ts` — include About / How It Works / Security
- `src/lib/seo/metadata.ts` — add `webPageJsonLd`
- `src/lib/seo/metadata.test.ts` — cover WebPage JSON-LD

## Deferred work (not A3)

- Plans, FAQ, Contact (Sprint A4)
- Counsel-approved Legal pages (Sprint A5)
- Final brand photography / final wordmarks beyond interim SVGs
- Live certified plans catalog binding
- Working Contact intake endpoint

## Readiness for Sprint A4

**READY** — freeze Sprint A3 Trust Experience.

Sprint A4 may implement **only**:

- Plans
- FAQ
- Contact

Do **not** reopen About / How It Works / Security except bugfix.
Do **not** touch frozen v2.1 / v2.2 / v2.3 engines, homepage flagship (A2), or auth/ledger/admin surfaces.

## Stop

Sprint A3 complete. Stop after this certification.
