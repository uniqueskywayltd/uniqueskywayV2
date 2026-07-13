# BRAND_ASSETS_SPECIFICATION.md

## Status

**Accepted for Stage 2 planning** — Milestone 5 / Wave A  
Companion to: `WAVE_A_UX_SPECIFICATION.md` (approved under `DEC-0028`)  
Visual direction: **Ink & Horizon** (see Wave A §6)

**No production pages should invent ad-hoc logos, icons, or illustration styles outside this document.**

## Purpose

Decide brand assets **before** Sprint A1 so implementation does not stall on logo/favicon/hero/illustration questions.

Until final artwork is delivered, Stage 2 may ship using the interim lockups defined here—but must not invent competing visual systems.

---

## 1. Brand system overview

| Layer | Authority |
| --- | --- |
| Product UX | `WAVE_A_UX_SPECIFICATION.md` |
| Brand assets | This document |
| UI primitives | `docs/design-system/*`, `globals.css`, `BrandMark` |
| Frozen engines | Unaffected |

**Wordmark:** Unique Sky Way  
**Tone:** Premium international investment; calm; Nigerian + international audience; never HYIP spectacle.

---

## 2. Logo lockups

### 2.1 Primary logo (marketing + public header)

| Spec | Requirement |
| --- | --- |
| Form | Monogram + wordmark horizontal |
| Interim | Existing `BrandMark` component (text + monogram) |
| Final | SVG lockup in `/public/brand/logo-primary.svg` |
| Clear space | ≥½ monogram height on all sides |
| Min width | Wordmark readable at 120px wide; monogram alone ≥24px |

### 2.2 Secondary / compact logo

| Spec | Requirement |
| --- | --- |
| Use | Dense UI, footer compact row, mobile header if needed |
| Form | Monogram only or monogram + short name |
| Interim | `BrandMark compact` |
| Final | `/public/brand/logo-mark.svg` |

### 2.3 Light-mode logo

| Spec | Requirement |
| --- | --- |
| Surface | Stone/off-white backgrounds |
| Color | Deep ink monogram + ink wordmark (Ink & Horizon) |
| File (final) | `logo-primary-light.svg`, `logo-mark-light.svg` |

### 2.4 Dark-mode logo

| Spec | Requirement |
| --- | --- |
| Surface | Dark app chrome (account/admin); marketing Wave A is light-primary |
| Color | Light mark on dark field; bronze accent optional only on monogram detail |
| File (final) | `logo-primary-dark.svg`, `logo-mark-dark.svg` |
| Wave A | Not required for public marketing launch; required before dark app chrome polish |

### 2.5 Usage rules

- Do not stretch, recolor arbitrarily, add gradients to the mark, or place on busy photography without scrim.
- Do not recreate the mark in CSS letterforms that diverge from approved SVG once final assets exist.
- Do not use crypto-coin / wing / globe cliché replacements.

---

## 3. Favicon and app icons

| Asset | Spec | Path (final) |
| --- | --- | --- |
| Favicon | 32×32 and 48×48 ICO/PNG; simplified monogram | `/public/favicon.ico`, `/public/brand/favicon.webp` |
| Touch icon | 180×180 | `/public/brand/apple-touch-icon.png` |
| PWA icon | 192 & 512 | `/public/brand/icon-192.png`, `icon-512.png` |
| Maskable | Safe zone compliant | `/public/brand/icon-maskable.png` |

**Interim:** Keep current favicon / monogram until final mark delivered. Sprint A1 must wire manifest to these paths without inventing a second icon family.

---

## 4. Social / Open Graph

| Asset | Spec |
| --- | --- |
| OG image | 1200×630 |
| Content | Brand lockup + short sober line (“Structured investment”) + Ink & Horizon atmosphere—**no fake AUM numbers** |
| Path | `/public/brand/og-image.webp` (or `.png`) |
| Twitter/X | Same asset unless crop requires `og-image-x.webp` |

---

## 5. Email assets

| Asset | Spec |
| --- | --- |
| Header | 600px-wide max; light background; primary logo; no heavy photography |
| Footer | Logo mark + entity line + support email + legal links |
| Paths | `/public/brand/email-header.png`, `email-footer.png` (or absolute URLs in template host) |
| Dark email clients | Prefer light email chrome for reliability |

Auth/security emails (Wave A Stage 2 polish) must use these—not raw HTML logo text of varying fonts.

---

## 6. Loading / splash

| Context | Spec |
| --- | --- |
| Web loading | Skeleton + optional monogram; no full-bleed splash video |
| Route loading | Existing `LoadingState` / skeletons |
| Forbidden | Spinner-only blank white; animated logo loops longer than 1.5s |

---

## 7. Empty-state illustrations

| Spec | Rule |
| --- | --- |
| Style | Minimal line geometry or soft Ink & Horizon abstract shapes |
| Color | Ink + muted stone + optional single bronze stroke |
| Tone | Calm, institutional—not cute mascots |
| Format | SVG preferred |
| Library | Small set: empty plans, empty FAQ results, empty contact confirmation variants, generic empty |
| Path | `/public/brand/illustrations/empty-*.svg` |
| Components | Prefer composing with `EmptyState` + illustration slot |

---

## 8. Hero illustrations / visuals

| Spec | Rule |
| --- | --- |
| Home hero | Full-bleed atmosphere: architectural light, horizon, restrained geometry—**not** lifestyle wealth clichés |
| Format | WebP/AVIF still image; optional subtle CSS gradient plane |
| Treatment | Slight desaturation; cool depth; no neon |
| Overlay | If text on image, scrim for AA contrast |
| Motion | Static preferred; optional slow opacity only under motion system |
| Path | `/public/brand/hero/home.webp` (+ `@2x`) |

About / Security may reuse secondary stills from the same photographic family—not random stock.

---

## 9. Icon family

| Spec | Rule |
| --- | --- |
| UI icons | **Lucide** only (already in stack) |
| Stroke | 1.5–2px optical |
| Sizes | 16 / 20 / 24 |
| Marketing decorative icons | Lucide or custom SVG matching Lucide weight—do not mix Material + Font Awesome |
| Do not | Gradient icons, 3D coin icons, emoji as system icons |

---

## 10. Photography rules

| Allow | Deny |
| --- | --- |
| Architecture, light, desk documents, abstract horizon | Supercars, yachts, “rich lifestyle”, raining coins |
| Authentic consented staff (later) | Stock “handshake greed” tropes as primary brand |
| Nigerian / African context authenticity when real | Tokenized cultural clichés |

Grade: natural light, slight desaturation, consistent white balance across site.

---

## 11. Image treatment

| Spec | Value |
| --- | --- |
| Formats | AVIF/WebP with PNG/JPG fallback |
| Compression | Hero LCP-optimized; lazy below fold |
| Aspect | Hero ~16:9 or full-bleed crop; cards 4:3 sparingly |
| Alt text | Meaningful or empty if decorative |
| CLS | Explicit width/height or aspect-ratio always |

---

## 12. Illustration style

- Geometric / editorial, large negative space  
- Line weight consistent with Lucide  
- One accent color max (bronze)  
- No comic characters, no rocket-to-moon metaphors  

---

## 13. Background textures & patterns

| Spec | Rule |
| --- | --- |
| Default | Flat stone canvas + subtle cool gradient atmosphere |
| Texture | Optional ultra-soft noise ≤3% opacity—never obvious grain wallpaper |
| Patterns | No loud grids, no crypto-hex floods, no stock “tech circuit” |
| Glass | Nav blur only per Wave A motion/token rules |

---

## 14. Animation assets

| Spec | Rule |
| --- | --- |
| Source of truth | Wave A §20 Motion Design System |
| Asset types | Prefer CSS/Framer-free CSS transitions first; Lottie only if justified below |
| Files | Keep under `/public/brand/motion/` if any |

---

## 15. Lottie policy

| Policy | Detail |
| --- | --- |
| Default | **No Lottie** in Wave A |
| Allowed later | One tasteful success check or empty-state loop ≤2s, reduced-motion static fallback |
| Forbidden | Confetti, coin rain, looping sales mascots |
| Performance | Must not block LCP; load only on interaction/success |

---

## 16. Video policy

| Policy | Detail |
| --- | --- |
| Wave A | **No autoplay marketing video** |
| Allowed later | Muted optional product explainer with captions; user-initiated play |
| Forbidden | Loud unsolicited audio; heavy hero mp4 as LCP |

---

## 17. Marketing image standards

| Standard | Requirement |
| --- | --- |
| Claims | No unverified AUM, fake investor counts, or FOMO widgets in images |
| Text in images | Prefer real HTML text over text baked into JPG for SEO/a11y |
| Consistency | Same photography family + Ink & Horizon grade |
| Review | New campaign imagery must match this doc before merge |

---

## 18. Asset inventory checklist (delivery)

Use this as the handoff list for design ownership before Sprint A2+ polish:

- [ ] `logo-primary-light.svg` / `logo-primary-dark.svg`
- [ ] `logo-mark-light.svg` / `logo-mark-dark.svg`
- [ ] Favicon + apple-touch + PWA 192/512 + maskable
- [ ] `og-image.webp`
- [ ] Email header / footer
- [ ] Hero still (`home.webp` + 2x)
- [ ] Empty-state SVG set (min 3)
- [ ] Optional secondary About/Security stills

**Interim ship rule:** Sprint A1–A5 may proceed with `BrandMark` + token atmosphere if checklist incomplete; do not block shell/homepage structure. Replace interim with finals without redesigning IA.

---

## 19. Mapping to implementation sprints

| Sprint | Brand asset expectations |
| --- | --- |
| A1 Public shell | Favicon wiring, BrandMark in nav/footer, token atmosphere, OG placeholder path |
| A2 Homepage | Hero still or approved CSS atmosphere; no rogue stock |
| A3 Content pages | Shared illustration/photo family |
| A4 Plans/FAQ/Contact | Empty-state SVGs; form success quiet |
| A5 Legal/polish | OG final if available; a11y of image alts |

---

## 20. Change control

- Visual philosophy changes require updating this document **and** `WAVE_A_UX_SPECIFICATION.md` when they conflict.
- Philosophy-level changes require ADR (`DEC-0028` companion rule).
- Swapping interim → final SVG files does not require ADR if lockup geometry matches approval.

---

**Related:** `DEC-0028`, `WAVE_A_UX_SPECIFICATION.md` §6 / §21 / §25, `docs/design-system/ACCESSIBILITY.md` (logo gap note).
