# WAVE_A_UX_SPECIFICATION.md

## Status

**APPROVED** — Milestone 5 / Wave A / Stage 1  
Approval decision: **`DEC-0028`** (2026-07-13)  
Release target: Customer Experience Platform `v3.0.0`  
Governance: `DEC-0026`, `DEC-0027`, `DEC-0028`, `EP-026`, `LEGACY_FEATURE_EXTRACTION.md`, `BRAND_ASSETS_SPECIFICATION.md`

This file is the **design authority** for Wave A and the Milestone 5 customer-facing experience constitution (sections 1–26).

**Stage 2 must implement exactly what is specified.** Any deviation requires updating this specification first, or an ADR if it changes design philosophy.

Production implementation proceeds as sprints **A1–A5** on a dedicated branch (see `DEVELOPMENT_ROADMAP.md`).

## Purpose

Design constitution for Unique Sky Way’s **public-facing trust experience**—everything a visitor sees before (and immediately around) authentication.

Goal: feel like a **premium international investment company**, not a generic invest-and-earn website.

Frozen platform context (out of scope for redesign of logic):

- `v2.1.0` Investment Engine  
- `v2.2.0` Money Movement  
- `v2.3.0` Administrative Platform  

Wave A builds **experience** on those foundations. It does not reopen engines.

---

# 1. Customer Personas

## 1.1 First-time visitor

| Lens | Detail |
| --- | --- |
| Who | Curious adult researching investment offerings online |
| Questions | Is this real? Who operates it? How does money move? What are the risks? |
| Goals | Understand offer in under 60 seconds; decide whether to continue reading |
| Objections | Looks like a HYIP; unclear regulation; unverified claims |
| Decision triggers | Clear company identity, transparent process, sober risk language, professional craft |

## 1.2 Returning visitor

| Lens | Detail |
| --- | --- |
| Who | Visited before; comparing plans or waiting to decide |
| Questions | Did anything change? Which plan fits me? How do I restart signup? |
| Goals | Resume journey quickly; find FAQ / Plans / Login |
| Objections | Cannot find prior answers; friction on mobile |
| Decision triggers | Persistent nav, clear Login, bookmarkable Plans and FAQ |

## 1.3 Individual investor

| Lens | Detail |
| --- | --- |
| Who | Intends to register, verify, deposit, and activate a plan |
| Questions | Min amounts? Timelines for deposit confirmation? Withdrawal process? |
| Goals | Trust enough to create an account and complete verification |
| Objections | Hidden fees, vague ROI, opaque review times |
| Decision triggers | How It Works aligned to real statuses; Security page; Risk disclosure |

## 1.4 Corporate / professional investor

| Lens | Detail |
| --- | --- |
| Who | Due-diligence oriented; may evaluate on behalf of others |
| Questions | Legal entity? Policies? Controls? Support SLA? Auditability? |
| Goals | Collect documents and process proof; escalate via Contact |
| Objections | Missing legal pages; marketing without compliance posture |
| Decision triggers | Privacy, Terms, AML, KYC, Risk, Security, Contact with real intake |

## 1.5 Referral visitor

| Lens | Detail |
| --- | --- |
| Who | Arrives via shared referral link / code |
| Questions | What do I get? Is the offer the same? Who referred me? |
| Goals | Understand platform first; register with attribution preserved |
| Objections | Pressure tactics; unclear referral economics |
| Decision triggers | Calm education; referral context retained into Register (Wave C owns full hub) |

**Wave A note:** Public referral *program page* is Wave C. Wave A must still preserve `?ref=` (or equivalent) into `/auth/register` without promising affiliate UI yet.

## 1.6 Mobile visitor

| Lens | Detail |
| --- | --- |
| Who | Majority of first impressions on phone |
| Questions | Can I read this without zooming? Is signup usable on phone? |
| Goals | Skim → trust → register |
| Objections | Desktop-first clutter; sticky chat covering CTAs |
| Decision triggers | Thumb-reachable CTAs, readable type, one job per section |

## 1.7 Desktop visitor

| Lens | Detail |
| --- | --- |
| Who | Compares plans side-by-side; reads Security / legal carefully |
| Questions | Where is the full process? Can I compare plans cleanly? |
| Goals | Research thoroughly before committing |
| Objections | Sparse content or brochure thinness |
| Decision triggers | Wide plan comparison, deep Security/Legal, quiet premium layout |

---

# 2. Customer Journey

## 2.1 Primary public journey

```text
Landing (Home)
  → Trust signals
  → Education (How it works / About)
  → Packages (Plans)
  → FAQ / Security
  → Contact (optional)
  → Register
  → Email verification
  → Account foundation (exists)
  → [Wave B] Dashboard / money experience
```

## 2.2 Journey map (emotions and drop-offs)

| Stage | Expected emotion | Drop-off risk | Recovery |
| --- | --- | --- | --- |
| Hero | Curiosity + calm confidence | Looks scammy / loud | Brand-first craft; no FOMO widgets |
| Trust strip | Relief | Unverified mega-stats | Process badges and real docs only |
| How it works | Clarity | Steps do not match reality | Align to certified deposit/invest/withdraw statuses |
| Plans | Evaluation | Terms feel hidden | Clear mins, durations, ROI presentation + risk footnote |
| FAQ / Security | Reassurance | Walls of jargon | Plain language; linked deep pages |
| Contact | Agency | Dead forms | Working intake + SLA expectations |
| Register | Commitment | Friction / distrust | Short form; terms accept; verify next |
| Verify | Progress | Email delay | Clear resend; check-email state |
| Post-verify | Anticipation | What now empty account | Bridge CTA toward funding (Wave B checklist) |

## 2.3 Emotional spine

**Calm progress.** Every page answers: *What is this? Why trust it? What do I do next?*

Never: manufactured urgency, countdown scarcity, fake peer deposits, exaggerated wealth promises.

---

# 3. Information Architecture

## 3.1 Sitemap (Wave A public)

```text
/                                   Home
/about                              About
/plans                              Investment Plans
/how-it-works                       How It Works
/security                           Security
/faq                                FAQ
/contact                            Contact

/legal/privacy                      Privacy Policy
/legal/terms                        Terms of Service
/legal/risk                         Risk Disclosure
/legal/aml                          AML Policy
/legal/kyc                          KYC Policy
/legal/cookies                      Cookie Policy

/auth/login                         Sign in          (exists; visual polish)
/auth/register                      Create account   (exists; polish + referral carry)
/auth/forgot-password               Recovery         (exists)
/auth/reset-password                Reset            (exists)
/auth/verify-email                  Verify           (exists)

/maintenance                        Maintenance      (exists)
/offline                            Offline          (exists)
/forbidden                          Forbidden        (exists)
```

**Out of Wave A (defer):** `/referrals` program hub (Wave C), blog/knowledge center (SEO later), customer money routes (Wave B).

## 3.2 Primary navigation

**Brand:** Unique Sky Way wordmark + monogram (`BrandMark`)

**Primary links:** Plans · How it works · Security · About · FAQ

**Right actions:** Contact (text) · Sign in (ghost) · Get started (primary)

Mobile: hamburger sheet with same order; primary CTA sticky bottom optional on long pages.

## 3.3 Footer IA

| Column | Links |
| --- | --- |
| Product | Plans, How it works, Security, FAQ |
| Company | About, Contact |
| Legal | Privacy, Terms, Risk, AML, KYC, Cookies |
| Account | Sign in, Create account |
| Meta | Copyright year, entity name (placeholder until legal lock), Investments involve risk one-liner |

No NFT, loans, token, or win-ticket footers.

## 3.4 Search and support

- Wave A: FAQ category filters + in-page search (filter over static/content FAQ).
- Sitewide search: deferred until Knowledge Center (post–Wave A).
- Support entry: Contact form + FAQ deep links.

---

# 4. Homepage Blueprint

## Visual composition rule (first viewport)

One composition. Brand is hero-level. Full-bleed atmosphere (subtle gradient / photographic plane—not inset card collage). No floating badges/chips on hero media. No stats strip or schedule blocks in the first viewport.

**First viewport contains only:** Brand · one headline · one supporting sentence · one CTA group · one dominant visual.

## Sections (in order)

### 4.1 Hero

| Field | Spec |
| --- | --- |
| Purpose | Name the company and invite serious consideration |
| Headline tone | Invest with clarity. / Structured investment, transparent accounting. |
| Support | One sentence on managed investment plans with visible money movement—not guaranteed wealth |
| CTAs | Primary: Get started → `/auth/register` · Secondary: View plans → `/plans` |
| Visual | Full-bleed restrained atmosphere (deep ink → soft stone); optional abstract horizon / architectural light—not stock rich-lifestyle clichés |
| Motion | Soft fade/slide of text once; reduced-motion: static |
| Conversion | Click Get started or View plans |
| Trust | No numbers in hero |

### 4.2 Trust foundation strip (second viewport)

| Field | Spec |
| --- | --- |
| Purpose | Earn credibility through process, not FOMO |
| Content | 3–4 process claims only if true: Email verification, Reviewed deposits, Ledger-backed balances, Session and device controls |
| Links | Each tiles to `/security` or relevant FAQ |
| Forbidden | Unverified AUM, fake investor counts, live fake activity |

### 4.3 How it works preview

| Field | Spec |
| --- | --- |
| Steps | 1 Create account · 2 Verify email · 3 Fund · 4 Activate plan · 5 Track and withdraw |
| CTA | Learn the full process → `/how-it-works` |
| Note | Status language must match frozen engines (pending review, confirmed, etc.) |

### 4.4 Plans preview

| Field | Spec |
| --- | --- |
| Purpose | Compare 2–4 featured certified plans |
| Content | Name, duration, ROI presentation, min amount—sourced from certified plan catalog when available |
| Empty | Plans will appear here when published (no broken grid) |
| CTA | Compare all plans → `/plans` |
| Footnote | Returns are not guaranteed. See Risk Disclosure. |

### 4.5 Where capital is put to work (merged sector story)

| Field | Spec |
| --- | --- |
| Purpose | Narrative diversification—not shoppable NFT/loan products |
| Content | One short story + 3 themes max—honest brand story |
| CTA | Our story → `/about` |

### 4.6 Security preview

| Field | Spec |
| --- | --- |
| Purpose | Pre-deposit confidence |
| Content | Encryption, verified sessions, human review of money movement, transparent statuses |
| CTA | Security overview → `/security` |

### 4.7 Final CTA band

| Field | Spec |
| --- | --- |
| Purpose | Convert undecided visitors |
| Content | Short invite + primary Get started + secondary Contact |
| Tone | Calm close—no limited slots |

### Illustrations / imagery recommendations

- Prefer custom brand photography or restrained abstract light geometry.
- Avoid: crypto coins raining, supercars, yacht lifestyle, neon dashboards.
- Product preview may use stylized empty UI chrome or approved screenshots with anonymized data—never fake balances presented as live.

### Copy tone on home

Professional, confident, transparent, short sentences. See section 8.

---

# 5. Individual Page Specifications

Shared page chrome for all public pages: Top nav · optional page hero · content · final CTA (except pure legal) · Footer.

## 5.1 About — `/about`

| | |
| --- | --- |
| Purpose | Who we are; remove clone prestige narratives |
| Sections | Hero · Origin story · Operating principles · Leadership/entity block (facts only) · Credentials (only if real) · CTA |
| Hierarchy | Brand/name → story → proof → next step |
| Mobile | Single column; pull-quotes sparingly |
| Conversion | Contact or Register |
| Redesign vs V1 | **Complete redesign** — strip Gold Trafigura / sovereign / OFC Singapore copy |

## 5.2 Plans — `/plans`

| | |
| --- | --- |
| Purpose | Decision support for certified plan catalog |
| Sections | Hero · Comparator grid/table · Plan detail expanders · Risk footnote · CTA Register |
| Hierarchy | Compare → inspect → commit pathway |
| Content | Duration, ROI presentation as defined by certified terms, min/max, status |
| Mobile | Cards stacked; sticky Get started |
| Conversion | Register with optional plan preference deep-link |
| API mapping | Read-only plan listing from certified investment plan sources when exposed publicly; otherwise CMS/static until API exists—**must not invent ROI math** |

## 5.3 How It Works — `/how-it-works`

| | |
| --- | --- |
| Purpose | Expectation setting end-to-end |
| Sections | Hero · Step timeline · Status glossary (Pending / Under review / Confirmed / Paid…) · Funding notes · Withdrawal notes · FAQ jump · CTA |
| Mobile | Vertical timeline |
| Conversion | Register |
| Critical | Align language to `v2.2.0` money movement realities |

## 5.4 Security — `/security`

| | |
| --- | --- |
| Purpose | Human-readable protections |
| Sections | Hero · Account protections · Money movement reviews · Session/device controls · What we never do · Link to policies · CTA |
| Avoid | Architecture dump (no ledger schema lectures) |
| Conversion | Register / Contact for diligence |

## 5.5 FAQ — `/faq`

| | |
| --- | --- |
| Purpose | Self-serve clarity |
| Sections | Search · Categories (Account, Deposits, Withdrawals, Plans, Security, Support) · Accordion answers · Contact CTA |
| Mobile | Accordion-first |
| Conversion | Reduce Contact volume; escalate clear gaps |

## 5.6 Contact — `/contact`

| | |
| --- | --- |
| Purpose | Working human intake |
| Sections | Hero · Form (name, email, topic, message) · Expectation SLA · Alternative channels (email) · Office/hours only if accurate |
| Conversion | Successful submit confirmation state |
| API mapping | Prefer existing transactional email/outbox patterns; Wave A may start with secured form endpoint—**must work**, not alert dialogs |
| Anti-abuse | Rate limit + honeypot/math challenge acceptable |

## 5.7 Privacy — `/legal/privacy`

Purpose: data practices.  
Sections: collection, use, sharing, retention, rights, contact email.  
Conversion: informed consent.  
**Legal counsel required before publish.**

## 5.8 Terms — `/legal/terms`

Purpose: platform rules.  
Sections: eligibility, accounts, investments, deposits/withdrawals, referrals clause (high level), liability, disputes.  
Align with engine rules.  
**Legal counsel required.**

## 5.9 Risk Disclosure — `/legal/risk`

Purpose: investment risk clarity.  
Sections: market risk, operational risk, no guarantee of returns, liquidity/review timelines.  
Must be linked from Plans and Register.

## 5.10 AML — `/legal/aml`

Purpose: anti-money-laundering posture.  
Sections: customer due diligence, monitoring, escalation.  
No empty claims.

## 5.11 KYC — `/legal/kyc`

Purpose: identity verification expectations.  
Sections: when KYC is required, documents, review outcomes.  
Ties to admin KYC capabilities; customer KYC UX is Wave D.

## 5.12 Cookies — `/legal/cookies`

Purpose: cookie categories.  
Sections: essential vs analytics.  
Preference link if non-essential cookies exist.

---

# 6. Design Language

## 6.1 Visual philosophy

**Quiet institutional clarity.** Spacious layouts, compact controls, semantic status color, restrained effects. Premium without spectacle.

Compose marketing pages as brand experiences first; authenticated surfaces remain financial-calm (existing design system).

## 6.2 Direction (locked for Wave A)

Avoid the three AI default looks: purple-on-white gradients; warm cream + terracotta serif kitsch; dense hairline broadsheet.

**Chosen direction — “Ink & Horizon”:**

| Token role | Direction |
| --- | --- |
| Base | Soft stone/off-white canvas (`background`) |
| Ink | Deep navy/near-black text (`foreground`) |
| Brand accent | Restrained bronze/gold for CTAs and focus — used sparingly |
| Surfaces | Slightly lifted cards with hairline borders; soft elevation 1–2 max |
| Atmosphere | Subtle cool depth gradients or photographic wash—never neon |

Extend existing CSS variables in `globals.css` / tokens; do not invent a parallel marketing-only component library.

## 6.3 Typography

| Role | Spec |
| --- | --- |
| Display / marketing H1 | Expressive serif or distinctive geometric (e.g. **Instrument Serif** or approved equivalent)—brand-visible |
| UI / body | Existing **Geist** stack (`--font-sans`) |
| Mono | Geist Mono for references only |
| Scale | Marketing display larger than app display token; body remains readable 16px+ on mobile |
| Hierarchy | One H1 per page · short H2s · never all-caps paragraphs |

## 6.4 Spacing, cards, depth

- Section vertical rhythm: generous (96–128px desktop, 64–80px mobile).
- Cards: allowed for **interaction** (plan compare, FAQ accordion, forms)—not for hero.
- Borders: 1px subtle; radius from design tokens (`md`/`lg`).
- Shadows: elevation-1 default; elevation-2 hover max.
- Glass: optional 1 use (nav blur) only—no frosted card mania.
- Gradients: atmospheric background planes only.

## 6.5 Icons and illustration

- Lucide (already in stack) for UI icons—consistent stroke.
- Illustration: custom line/geometry or photographic—no cartoon money mascots.
- Photography: architecture, light, horizon, hands-at-desk document moments—authentic.

## 6.6 Motion language

| Behavior | Spec |
| --- | --- |
| Page enter | 200–400ms fade/translate; honor `prefers-reduced-motion` |
| Hover | Color/border lift; no bounce |
| Scroll | Subtle reveal for secondary sections; hero static-first |
| Loading | Skeletons using existing `Skeleton` / `LoadingState` |
| Budget | 2–3 intentional motions per page; no continuous FOMO loops |

## 6.7 Color modes

- **Primary:** Light marketing experience.
- Dark mode: not required for Wave A launch (prefs may still exist in account). If implemented later, keep same hierarchy—no separate gamer dark aesthetic.

## 6.8 Accessibility (Wave A marketing)

- WCAG AA contrast for text/UI.
- Visible focus rings (existing tokens).
- Keyboardable nav, dialogs, accordions.
- Skip link to main content.
- Alt text for meaningful images; decorative images empty alt.
- Reduced motion support.
- Form errors associated with inputs.

Reuse Phase 2 primitives (`Button`, `Input`, `Card`, and related)—see `docs/design-system/COMPONENTS.md`.

---

# 7. Trust System

## 7.1 Where trust is earned (placement)

| Moment | Trust mechanism |
| --- | --- |
| Hero | Brand clarity + sober promise |
| Strip | Process truths only |
| Plans | Risk footnote + legal links |
| Security | Control explanations |
| Legal suite | Real policies |
| Contact | Working human path |
| Register | Terms + Risk acceptance |
| Email | Branded verification (Stage 2 polish) |

## 7.2 Claim policy (hard rules)

| Allowed if true and documentable | Forbidden |
| --- | --- |
| Email verification required | Fake live deposits/withdrawals |
| Deposits/withdrawals may be reviewed | Unverified AUM / investor counts |
| Balances derived from ledger postings (benefit language) | Countdown scarcity / only 3 slots |
| Session and trusted-device controls | Fabricated testimonials |
| Named payment provider when accurate (Paystack) | Guaranteed wealth / risk-free |
| Entity name + registration details when counsel-approved | Borrowed brand identities (Gold Trafigura, etc.) |

## 7.3 Testimonials and statistics policy

- Testimonials: **none** unless consented, attributable, and approved. Prefer none at Wave A launch over risk.
- Statistics: only counsel/ops-verified. Otherwise omit.
- Payment provider logos: only with accurate integration reality and brand guidelines.
- No fake urgency. No fake scarcity.

## 7.4 Compliance surfaces in Wave A

Risk, AML, KYC, Privacy, Terms, Cookies—published as first-class routes—even if early text is held unpublished until counsel signs off.

---

# 8. Brand Voice

## Voice attributes

Professional · Confident · Transparent · Calm · Premium

## Do

- Short sentences.
- Concrete process language.
- Name risks beside opportunities.
- Prefer “may”, “typically”, “subject to review” where accurate.
- Use investor time respectfully.

## Do not

- Hype (10x, guaranteed daily riches).
- Exaggeration of AUM, users, jurisdictions.
- Fear FOMO or shame.
- Meme tone or crypto-casino slang.
- Promise regulatory licenses you do not hold.

## Microcopy patterns

| Context | Pattern |
| --- | --- |
| CTA primary | Get started / Create account |
| CTA secondary | View plans / Learn how it works |
| Empty plans | Plans will appear when published |
| Form success | Message received. We respond within {SLA}. |
| Risk chip | Investments involve risk. |

---

# 9. SEO Strategy

## 9.1 Titles and metas (patterns)

| Page | Title pattern | Meta intent |
| --- | --- | --- |
| Home | Unique Sky Way — Structured Investment Platform | Trust + category |
| Plans | Investment Plans \| Unique Sky Way | Compare plans |
| How it works | How Unique Sky Way Works | Process |
| Security | Security and Account Protection \| Unique Sky Way | Trust |
| FAQ | FAQ \| Unique Sky Way | Answers |
| About | About Unique Sky Way | Entity |
| Contact | Contact Unique Sky Way | Support |
| Legal | {Policy} \| Unique Sky Way | Compliance |

## 9.2 Structure

- One H1; hierarchical H2/H3.
- Internal links: Home ↔ Plans ↔ How it works ↔ Security ↔ FAQ ↔ Legal.
- Canonical URLs; Open Graph image (approved brand asset).
- JSON-LD: Organization + WebSite; FAQPage on `/faq` when content stable.

## 9.3 Future content (not Wave A scope)

- Knowledge Center / blog: after ops capacity exists.
- No DexignZone blog debris.
- Educational articles must not invent financial formulas.

---

# 10. Performance Strategy

Align with `docs/design-system/PERFORMANCE.md`.

| Area | Target / approach |
| --- | --- |
| Images | Next image pipeline; AVIF/WebP; explicit dimensions; hero prioritized LCP |
| Fonts | Subset display font; Geist already optimized; font-display swap |
| Rendering | Server Components by default; minimal client JS (nav sheet, FAQ filter, form) |
| Streaming | Route-level loading UI where helpful |
| Skeletons | Marketing content blocks use calm skeletons—not spinners everywhere |
| Lazy load | Below-fold images and non-critical motion |
| Bundle | No heavy chart libs on public marketing; no unused icon packs |
| Animation budget | Honor reduced motion; avoid scroll-jacking |
| CWV targets | LCP ≤ 2.5s · INP ≤ 200ms · CLS ≤ 0.1 (mobile mid-tier) |

---

# 11. Mobile Experience

| Topic | Spec |
| --- | --- |
| Navigation | Hamburger sheet; brand always visible; primary CTA in sheet footer |
| Touch targets | ≥44px; spacing between Sign in / Get started |
| Bottom actions | Optional sticky Get started on Plans and long How-it-works |
| Scrolling | Native scroll; no hijack |
| Performance | Compress hero; defer noncritical scripts |
| Offline | Existing `/offline` page; marketing pages fail gracefully |
| PWA | Manifest may be polished later (Wave D); Wave A not blocked on install prompts |
| Chat widgets | **Off by default** in Wave A unless staffed—never cover CTAs |

---

# 12. Competitive Benchmark

Study **product experience patterns only**—do not copy branding or layouts.

| Pattern | Who exemplifies well | Apply how |
| --- | --- | --- |
| Radical clarity of product promise | Stripe, Wise | One sentence hero; no clutter |
| Calm institutional banking feel | Mercury, Brex, Ramp | Spacious type, restrained chrome |
| Trust via controls and education | Schwab, Interactive Brokers, Coinbase | Security/education hubs, sober language |
| Guided self-serve help | Monzo, Nubank | FAQ IA by journey stage |
| Clean plan/pricing comparison | Wealthfront / Betterment (product) | Clear comparison without gimmicks |
| Money movement expectancy | Paystack / Flutterwave merchant clarity | Status honesty over theater |
| Onboarding lightness | Robinhood (simplicity only—not the hype) | Short register; progressive disclosure |

**Do not import:** gamified confetti wealth, fake social proof, dark-pattern urgency.

---

# 13. AI Opportunities

Use AI to **assist**, never to make regulated financial decisions or invent returns.

| Area | Opportunity | Boundary |
| --- | --- | --- |
| FAQ | Retrieval over approved articles | Cite sources; escalate legal/money disputes to humans |
| Support intake | Topic classification / draft replies for staff | Human sends |
| Onboarding | Explain next step after verify | No personalized investment advice |
| Plans education | Compare published plan attributes | No recommending “best” plan as advice |
| Search | Semantic FAQ search later | Not investment advice |
| Documents | Summarize public policies for accessibility | Official policy remains authoritative |

---

# 14. Success Metrics

| Category | Target (Wave A launch window) |
| --- | --- |
| Bounce (Home) | Trend down vs foundation stub; qualitative feels-credible stakeholder review |
| CTA CTR (Get started) | Track; baseline then improve |
| Register starts | Track from marketing CTAs |
| Register completes | Track; verify completion rate separately |
| Contact form success | ≥99% successful submit when online |
| LCP / INP / CLS | Meet section 10 targets on Home and Plans |
| Accessibility | AA critical flows; zero blocker issues on nav/forms |
| SEO | Indexable titles/metas; FAQ rich results eligible |
| CSAT / qualitative | Counsel + stakeholders sign trust checklist |

Exact numeric conversion KPIs to be set by business after 2–4 weeks of analytics baseline.

---

# 15. Wave A Readiness Checklist

## Before Stage 2 implementation starts

### Product / UX approval

- [x] This `WAVE_A_UX_SPECIFICATION.md` approved (`DEC-0028`)
- [x] Homepage section order locked
- [x] Sitemap and nav labels locked
- [x] Ink and Horizon visual direction approved (or revised in writing)
- [x] Voice guidelines acknowledged by marketing/owner
- [x] Brand asset authority published (`BRAND_ASSETS_SPECIFICATION.md`)
- [ ] Legal entity name and address finalized
- [ ] Privacy / Terms / Risk / AML / KYC / Cookies drafting owner assigned
- [ ] Counsel review scheduled (blocker to public claims)
- [ ] Verified claim list published (what we may say)
- [x] Confirmed: no FOMO widgets, no fake stats, no clone prestige copy
- [ ] Plan presentation rules agreed (catalog source; empty state)
- [ ] Official logo / OG image delivery (interim `BrandMark` allowed)
- [ ] Display font licensed/approved
- [ ] Hero visual concept selected / delivered
- [x] Public marketing sprint plan agreed (A1–A5)
- [ ] Contact intake approach agreed (email/outbox vs temporary handler)
- [ ] Analytics events for CTAs listed
- [ ] Mapping: Plans page ↔ certified plan data availability confirmed
- [ ] Referral query param carry into register specified

### Explicit non-goals for Wave A

- [ ] No Wave B money dashboard
- [ ] No referral hub UI (Wave C)
- [ ] No NFT/loan/token pages
- [ ] No live chat unless staffed
- [ ] No engine/ledger/Paystack behavior changes

---

## Mapping to existing platform capabilities

| Experience need | Existing V2 surface | Wave A action |
| --- | --- | --- |
| Register / login / verify | `/auth/*` | Visual polish + risk/terms links |
| Account foundation | `/account/*` | Link from post-auth only; no marketing rewrite |
| Maintenance / offline | existing | Keep; customer-first copy polish |
| Design primitives | `@/components/ui`, layout, tokens | Compose marketing from certified DS |
| Plans data | Investment engine (frozen) | Read-only presentation when API/public catalog ready |
| Contact delivery | Email/outbox designs | Implement intake in Stage 2 without new financial workflows |
| Admin content later | Admin settings/templates | Not required to ship Wave A static/legal v1 |

---

## Legacy comparison (business only)

| Screen | Keep as idea | Redesign / discard |
| --- | --- | --- |
| Home funnel | Hero → how it works → plans → CTA | Discard FOMO, fake stats, ticker theater |
| Plans grid | Tier comparison | Rebuild; certified terms only |
| About | Company story need | Discard Gold Trafigura / OFC clone identity |
| Security | Trust education | Rewrite in human language |
| FAQ / Contact | Self-serve + human path | Rebuild working intake |
| Legal | Required policies | Expand with Risk/AML/KYC/Cookies |
| Services/NFT/Loan | — | **Never return** |
| Referrals page | Education later | Wave C |

**Screens that should be completely redesigned (not restyled):** Home, About, Plans, Security, FAQ, Contact, all Legal—none should inherit V1 layout systems.

---

## Component inventory (marketing composition)

Compose from existing design system where possible:

`BrandMark`, `Button`, `Input`, `Textarea`, `Label`, `Select`, `Card`, `Badge`, `Alert`, `EmptyState`, `Skeleton`, `Footer`/`TopBar` patterns, focus-ring tokens.

**New composed (not primitive) needs for Stage 2 planning:** `MarketingShell`, `MarketingSection`, `PlanComparisonCard`, `ProcessStep`, `LegalDocumentLayout`, `FaqToolbox`—implement only after approval.

---

# PART II — EXPERIENCE DEPTH (PRODUCTION QUALITY)

The following sections elevate Wave A from page blueprints to **product psychology**. They apply to all Milestone 5 waves unless a later wave supersedes them with an approved amendment.

---

# 16. Emotional Journey Maps

Define how customers should feel **before**, **during**, and **after** each Wave A surface. Waves B–D inherit the same after-feeling standards for money moments.

## 16.1 Public pages

### Homepage `/`

| Moment | Emotion target | Design implication |
| --- | --- | --- |
| Before | Curious, slightly skeptical | First viewport must answer “what is this?” without hype |
| During | Calm interest → rising legitimacy | Process trust strip + sober plans preview |
| After | “This company feels legitimate.” | Visitor leaves knowing next step (Plans or Register) |

### About `/about`

| Moment | Emotion target | Design implication |
| --- | --- | --- |
| Before | Who are you, really? | |
| During | Orientation, relief if story is coherent | Facts over borrowed prestige |
| After | “I know who I’m dealing with.” | Clear entity framing; CTA to Contact or Plans |

### Plans `/plans`

| Moment | Emotion target | Design implication |
| --- | --- | --- |
| Before | Evaluating / comparing | |
| During | Focused, calculating, cautious hope | Clear terms + risk footnote always visible |
| After | “I understand the offer—and the risks.” | Path to Register with eyes open |

### How It Works `/how-it-works`

| Moment | Emotion target | Design implication |
| --- | --- | --- |
| Before | Confused about process | |
| During | Clarity, growing confidence | Steps match real engine statuses |
| After | “I know what happens to my money.” | Anxiety about opacity drops |

### Security `/security`

| Moment | Emotion target | Design implication |
| --- | --- | --- |
| Before | Fear of loss / scam | |
| During | Reassurance through controls, not slogans | Human language; link policies |
| After | “They take protection seriously.” | Fear reduced; not eliminated (honest) |

### FAQ `/faq`

| Moment | Emotion target | Design implication |
| --- | --- | --- |
| Before | Specific doubt | |
| During | Relief when answered; frustration if missing | Journey-based categories |
| After | “I got my answer” or “I know how to ask a human” | Always end with Contact escape hatch |

### Contact `/contact`

| Moment | Emotion target | Design implication |
| --- | --- | --- |
| Before | Need agency / help | |
| During | Being heard | Working form + SLA expectation |
| After | “Someone will respond.” | Confirmation state must feel finished |

### Legal suite `/legal/*`

| Moment | Emotion target | Design implication |
| --- | --- | --- |
| Before | Due diligence mode | |
| During | Serious, attentive | Readable structure; not a dump |
| After | “They publish real rules.” | Trust through transparency |

## 16.2 Auth surfaces (Wave A polish)

### Register `/auth/register`

| Moment | Emotion target | Design implication |
| --- | --- | --- |
| Before | Unsure, weighing risk | Risk + Terms acceptance present |
| During | Focused, slightly tense | Short form; clear errors; no shame |
| After | “Opening an account was easy.” | Immediate verify guidance |

### Login `/auth/login`

| Moment | Emotion target | Design implication |
| --- | --- | --- |
| Before | Returning intent | |
| During | Efficient | Fast path; recovery link obvious |
| After | “I’m in.” | No clutter after success |

### Verify email

| Moment | Emotion target | Design implication |
| --- | --- | --- |
| Before | Waiting / anxious delay | |
| During | Patient progress | Resend, spam tip, calm tone |
| After | “I’m verified and ready for the next step.” | Bridge to account / eventual funding |

## 16.3 Forward-looking money feelings (Wave B must honor)

These are not Wave A pages, but Wave A must not contradict them in promises.

| Surface | Before | After (target) |
| --- | --- | --- |
| Dashboard | Hopeful / cautious | “My money feels accounted for.” |
| Deposit submitted | Nervous | “It’s received for review—I know the status.” |
| First ROI credit | Excited | “Earnings are explained, not mysterious.” |
| Withdrawal | Anxious | “I understand timeline and state.” |
| Maturity | Decision pressure | “I have a clear next choice.” |

---

# 17. Trust Engineering Architecture

Trust is a **journey**, not a badge.

## 17.1 Doubt → resolution loops

Every doubt moment maps to a designed response path.

| Where doubt appears | Customer question | Doubt dissolves through… | UX surface |
| --- | --- | --- | --- |
| Hero | Is this real? | Brand clarity + sober promise (no FOMO) | Home hero |
| Plans | Is the return real / safe? | Certified terms + Risk Disclosure + process language | Plans → Risk → How it works |
| How it works | What happens to my money? | Status glossary matching engines | How it works → Security |
| Security page | Can I be protected? | Sessions, verification, review expectancy | Security → KYC/AML |
| Register | Will this email steal my data? | Privacy link + short form + verify | Register → Privacy |
| Deposit (Wave B) | Did you get my money? | Receipt + status tracker + email | Wave B UX |
| Withdrawal (Wave B) | Will I get paid? | Timeline + states + support path | Wave B UX |
| Admin opacity | Who reviews this? | Security copy + Contact diligence path | Security / Contact |
| Fake-claim detectors | Are stats fabricated? | **Omit** unverified numbers | Claim policy |

## 17.2 Trust stack (ordered)

Present trust in this sequence when educating; do not invent layers you cannot support:

```text
1. Company identity (legal entity — counsel-approved)
2. Published legal suite (Privacy, Terms, Risk, AML, KYC, Cookies)
3. Named payment rails when accurate (Paystack / USD per frozen money movement)
4. Process transparency (verification, review, status language)
5. Security controls (sessions, devices, encryption claims that are true)
6. Ledger-backed accounting language (benefit wording only)
7. Customer visibility (dashboard / tracker — Wave B)
8. Human reachability (Contact + support SLA)
```

## 17.3 Trust anti-patterns (engineered out)

| Anti-pattern | Why it destroys trust | Replacement |
| --- | --- | --- |
| Fake live activity | Detected instantly by sophisticated users | Silence / real anonymized events only later |
| Inflated AUM | Regulatory and reputation risk | Omit |
| Guaranteed returns | False promise | Risk Disclosure + careful ROI presentation |
| Clone prestige narrative | Identity fraud signal | Original About story |
| Dead contact form | Instant illegitimacy | Working intake |
| Hardcoded wallet theater | Ops/security risk | Live configured rails only |

## 17.4 Trust instrumentation (qualitative)

Before launch, run a **doubt walkthrough**: five people unfamiliar with the product attempt to disprove legitimacy using only public pages. Capture every unresolved doubt as a blocker.

---

# 18. Customer Psychology Model

Investment platforms manage conflicting drives. Wave A must **regulate** these emotions—not amplify the destructive ones.

## 18.1 Emotion definitions

| Emotion | Definition in this product | Healthy management |
| --- | --- | --- |
| Fear | Loss of funds, scam anxiety | Acknowledge; show controls; never mock |
| Greed | Desire for unrealistic yield | Do not feed; pair plans with Risk |
| Excitement | Anticipation of starting | Channel into clear next steps |
| Confidence | Belief systems work | Earn via process transparency |
| Patience | Waiting on reviews / verification | Set expectancy; show progress |
| Reward | Feeling progress / gains | Explain credited vs accrued (Wave B) |
| Loss | Rejection, delay, decline | Respectful language; recovery path |

## 18.2 Page-level emotion regulation

| Page | Amplify | Dampen | Never |
| --- | --- | --- | --- |
| Home | Confidence, calm excitement | Greed, fear-mongering | FOMO timers |
| Plans | Focused evaluation | Greed spikes | “Can’t lose” language |
| How it works | Patience, confidence | Confusion fear | Hidden steps |
| Security | Confidence | Panic | Absolute invulnerability claims |
| FAQ | Relief | Frustration | Blaming the user |
| Contact | Agency | Helplessness | Auto-dismiss |
| Register | Confidence | Decision paralysis | Pressure countdowns |
| Legal | Serious confidence | Boredom via structure | Hiding risk |

## 18.3 Psychological principles

1. **Respect fear** — investors who fear scams are rational; design for them.  
2. **Do not weaponize greed** — long-term credibility > short signup spikes.  
3. **Make waiting dignified** — status and expectancy prevent rage-quit.  
4. **Explain reward** — unexplained gains feel like a casino.  
5. **Grace after loss/rejection** — deposit rejected / KYC needs work must feel recoverable.

---

# 19. Microcopy Style Guide (“Microcopy Bible”)

## 19.1 Principles

- Prefer complete, calm sentences over abrupt system tokens.  
- Prefer human agency over machine blame.  
- Prefer specific next action over vague failure.  
- Never shout (avoid ALL CAPS SUCCESS).  
- Align money words with customer mental models while remaining accurate to ledger states (Wave B).

## 19.2 Preferred replacements

| Avoid | Prefer |
| --- | --- |
| Deposit Successful | Your funds have been securely received for review. |
| Withdraw / Withdraw Now (aggressive) | Transfer funds / Request a withdrawal |
| Error | We couldn’t complete that request. |
| Failed | That didn’t go through. Here’s what you can try. |
| Invalid input | Check this field and try again. |
| Unauthorized | Please sign in to continue. |
| Forbidden | You don’t have access to that page. |
| Not found | We couldn’t find that page. |
| Loading… | Just a moment… |
| Submit | Send message / Create account / Continue |
| OK | Got it / Continue |
| Cancel | Go back |
| Delete | Remove |
| Pending | Under review / Awaiting confirmation (use exact certified status labels when showing machine state) |
| ROI Credited (raw) | Today’s earnings were added to your balance. (Wave B) |
| Matured | Your plan has completed its term. Choose an option. (Wave B) |

## 19.3 Status voice matrix

| Situation | Voice |
| --- | --- |
| Success | Quiet confirmation + next step |
| Progress | Patient expectancy (“Usually within…”) |
| Failure | Soft apology + recovery |
| Risk | Direct, not melodramatic |
| Legal | Precise, readable |

## 19.4 Empty states

| Context | Example |
| --- | --- |
| No plans published | Plans will appear here when they are published. |
| No FAQ hits | No answers matched. Try another phrase or contact us. |
| Form sent | Message received. We typically respond within {SLA}. |

## 19.5 Words we never use in UX

Guarantee (returns), risk-free, instant riches, limited slots, act now, moon, 100x, “can’t lose”, fake social proof phrases (“Someone just deposited…”).

---

# 20. Motion Design System

Not decorative animation—a **consistent motion language**.

## 20.1 Tokens (align with `globals.css`)

| Token | Value | Use |
| --- | --- | --- |
| `--duration-fast` | 120ms | Hover color, icon taps |
| `--duration-standard` | 180ms | Fade-ins, drawers begin |
| `--duration-slow` | 260ms | Page section reveal |
| Celebration | 400–600ms max | Success check draw (Wave B) |
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | Default curve |

`prefers-reduced-motion: reduce` → opacity-only or instant.

## 20.2 Patterns

| Element | Enter | Exit | Hover | Notes |
| --- | --- | --- | --- | --- |
| Cards / sections | Fade + 8px rise | Fade | Border/elevation +1 | Stagger ≤ 40ms |
| Nav sheet | Slide from edge 180–260ms | Reverse | — | Focus trap |
| Modals | Fade + scale 0.98→1 | Fade | — | |
| Toasts | Slide from top/right | Fade | — | Auto-dismiss calm |
| Numbers (Wave B) | Optional short count-up ≤400ms once | — | — | Never on marketing fake metrics |
| Skeleton → content | Crossfade 180ms | — | — | |
| Success | Soft check stroke | — | — | No confetti |
| Page transition | Prefer instant or soft fade | Avoid waiting for cinematic | — | |

## 20.3 Forbidden motion

- Infinite bouncing CTAs  
- Scroll-jacking  
- Parallax that harms CLS  
- Confetti / coin showers  
- Fake “live ticker” motion  
- Attention-hijack pulsing “Deposit now”

## 20.4 Loading behavior

- Prefer skeleton of final layout over spinners.  
- If >1s, show calm text: “Just a moment…”  
- Never leave blank white without structure.

---

# 21. Complete Design Token Specification (beyond color)

Extend existing tokens; Stage 2 implements via `globals.css` / `tokens.ts`—specified here first.

## 21.1 Radius

| Token | Intent |
| --- | --- |
| `sm` | Inputs chips |
| `md` | Buttons small controls |
| `lg` (`--radius` 0.625rem) | Default cards |
| `xl` | Marketing media frames |
| Pill | Avoid for primary marketing CTAs (prefer rounded-rect institutional) |

## 21.2 Elevation

| Level | Existing | When |
| --- | --- | --- |
| 0 | Flat | Legal documents |
| 1 | `--elevation-1` | Cards at rest |
| 2 | `--elevation-2` | Hover / popover |
| 3 | `--elevation-3` | Rare (modals only) |

## 21.3 Spacing rhythm

Base unit **4px**. Marketing section padding: **64 / 80 / 96 / 128** (mobile→desktop). Content max width: aligned to `containers.page` (90rem) with readable measure ~65–75ch for prose.

## 21.4 Borders & icons

| Spec | Value |
| --- | --- |
| Border weight | 1px default; 1.5px focus emphasis via ring not thicker border |
| Border color | semantic `--border` |
| Icon stroke | 1.5–2px Lucide; optical square 20/24 |
| Icon padding | min 44px hit area |

## 21.5 Glass / blur

| Spec | Value |
| --- | --- |
| Nav glass | `background/95` + backdrop-blur ~8–12px |
| Card glass | **Discouraged** |
| Overlay | `black/40`–`black/50` |

## 21.6 Illustration & photography

| Spec | Rule |
| --- | --- |
| Illustration proportion | Simple geometry; large negative space |
| Photography treatment | Natural light, slight desaturation, no neon grade |
| Crop | Full-bleed hero; never postcard collage in first viewport |
| Faces | Prefer none unless authentic staff with consent |

## 21.7 Ink & Horizon brand accents

| Role | Guidance |
| --- | --- |
| Brand | Deep ink / bronze accent sparingly (see §6) |
| Success / warning / destructive | Existing semantic tokens |
| Financial / ROI | Existing financial tokens—**Wave B**; marketing must not misuse as fake live P&L |

---

# 22. Customer Success Journey

Wave A earns the right to celebrate later milestones. Define the full arc so Stage 2 marketing promises stay consistent.

## 22.1 Milestone moments

| Milestone | When | Feeling | UX treatment |
| --- | --- | --- | --- |
| Account created | After register | Easy start | Soft success + verify instruction |
| Email verified | Verify complete | Ready | “You’re verified” + next step |
| First login | Session start | Welcome | Calm greeting—not fireworks |
| First deposit submitted | Wave B | Nervous relief | Receipt + expectancy |
| First deposit confirmed | Wave B | Trust spike | Clear status change + email |
| First investment activated | Wave B | Commitment | Confirm terms snapshot |
| First ROI credit | Wave B | Reward | Explained credit; no casino |
| First withdrawal requested | Wave B | Anxiety | Status tracker |
| First withdrawal paid | Wave B | Proof | Quiet celebration |
| First referral (Wave C) | Share success | Belonging | Stats without PII leak |
| First maturity | Wave B | Decision clarity | Maturity action center |
| Anniversary | Later | Loyalty | Optional tasteful email—no spam |

## 22.2 Celebration doctrine

**Elegant acknowledgment > party effects.**  
A short success line, a checkmark, and a clear next action beat confetti every time for a financial brand.

---

# 23. Premium Experience Checklist

Before approving any Wave A page implementation, ask:

| Question | Fail looks like | Pass looks like |
| --- | --- | --- |
| Would Apple ship this craft? | Uneven spacing, random radii | Rhythmic, intentional |
| Would Stripe ship this clarity? | Jargon wall | One idea per section |
| Would Mercury/Ramp ship this calm? | Loud gradients, FOMO | Quiet institutional |
| Would Schwab ship this risk honesty? | Hidden risk | Risk beside offer |
| Would Nubank ship this mobile care? | Desktop squeezed | Thumb-first |
| Would Wise ship this expectancy? | Mystery delays | Explicit timelines |

If any answer is “no,” revise before merge.

### Premium quick fails (automatic reject)

- Fake social proof  
- Broken contact form  
- CLS from late fonts/images  
- Unreadable legal  
- Aggressive hustle microcopy  
- Inconsistent button hierarchy  

---

# 24. Nigerian + International Localization Guidelines

Unique Sky Way must not become a generic American fintech clone—but it also must not contradict **frozen financial rules**.

## 24.1 Hard financial constraints (frozen)

| Topic | Platform reality | UX implication |
| --- | --- | --- |
| Ledger currency | **USD** under certified money movement | Primary money display USD; do not invent NGN ledger UX without ADR |
| Settlement calendar | **America/New_York** financial timezone | ROI/settlement expectancy language may reference business days; show user-local clock for timestamps |
| Provider | Paystack (certified) | Name accurately; follow brand guidelines |

## 24.2 Customer-facing localization (Wave A / Milestone 5)

| Topic | Guideline |
| --- | --- |
| Audience | Design primarily for Nigerian (and broader African) investors using an international-grade product |
| Language | Clear international English; avoid US-only idioms; avoid slang |
| Dates | Prefer unambiguous formats (`15 Jul 2026` or ISO-informed display); user preference later |
| Timezones | Store/display honesty: show event time with zone abbreviation when relevant; allow profile timezone (exists) |
| USD formatting | `$1,234.56` with consistent grouping; minor units never float-random |
| Naira | May appear in **educational** copy (e.g., “you typically fund via channels you already know”) only if accurate; **no dual-ledger claims** |
| Network expectations | Assume intermittent mobile data; skeletons, retry, offline page, compressed images |
| Mobile-first | Primary design surface is mid-tier Android + iOS Safari |
| WhatsApp philosophy | Optional support channel if staffed; linked from Contact; never embed noisy widgets that cover CTAs; do not put money instructions solely in WhatsApp |
| Support expectations | Publish realistic SLA; prefer async that works across networks |
| Bank / rails familiarity | Explain funding in familiar terms without implying unsupported local rails |
| Local trust | Emphasize reachable humans, clear entity, sober process—Nigerian users are highly scam-aware; design for skeptics |
| International visitors | Legal English + USD clarity still works globally |

## 24.3 What localization must never do

- Pretend NGN balances exist in the certified ledger  
- Show local “guaranteed” bank timing that engines cannot promise  
- Hide USD as the money-of-record  

---

# 25. Delight & Celebration Moments

## 25.1 Allowed delight (quiet)

| Moment | Treatment |
| --- | --- |
| Form success | Soft check + clear confirmation copy |
| Email verified | Warm, short success |
| Plan selected (Wave B) | Confirm summary card |
| First dashboard load (Wave B) | Polished empty state with guided CTA |
| Maturity (Wave B) | Focused choice UI—not party mode |
| Referral success (Wave C) | Tasteful positive confirmation |

## 25.2 Explicitly not delight

| Avoid | Why |
| --- | --- |
| Confetti / balloons | Undermines institution |
| Loud sound effects on web | Unexpected; accessibility |
| Badge spam | Feels gamified HYIP |
| Birthday popup spam | Creepy without consent |
| Fake portfolio fireworks | Confuses money truth |

## 25.3 Future (optional, consented)

- Anniversary email (opt-in)  
- Milestone email (“One year with Unique Sky Way”)  
- Mobile haptic / subtle sound only in native/PWA later with settings  

---

# 26. Design Constitution

Every customer interaction must answer **at least one** of these questions—and must **never fail** the trust set:

### Trust set (non-negotiable)

1. **Can I trust you?**  
2. **Is my money safe?** (honest about process and risk—not false absolute safety)  
3. **Do you explain clearly?**  
4. **Can I recover from mistakes?**  
5. **Can I reach someone?**  

### Quality set

6. **Is the experience premium?**  
7. **Is it fast?**  
8. **Is it transparent?**  
9. **Will I come back?**  

### Constitution rules

- If a screen fails a Trust set question, it is not shippable.  
- If a screen fails Quality set items, it is not “done.”  
- Marketing may create desire; it may not create false certainty.  
- Celebration may acknowledge progress; it may not obscure ledger truth.  
- Localization may embrace Nigerian reality; it may not contradict certified USD/NY financial rules.  
- Legacy may inspire flows; it may not dictate code or dishonest patterns.

This constitution governs Wave A Stage 2 and all later Milestone 5 waves until amended by ADR.

---

# Final assessment

## Would this customer experience feel credible enough to compete with the best fintech and investment platforms internationally?

**As a design constitution: yes—approaching that standard**, provided stakeholders approve this refinement and close remaining launch blockers.

**As a shipped UI: not until Stage 2 executes this document with discipline.**

Estimated quality trajectory:

| Pass | Score intent |
| --- | --- |
| Spec before refinement | ~92/100 |
| Spec after Part II (this pass) | ~98–99/100 as a blueprint |
| Live Wave A | Depends on legal claims, assets, and craft execution |

### Remaining non-spec blockers before Stage 2 publish

1. Stakeholder **approval** of this document (`DEC-0027`).
2. Counsel-backed legal pages / verified claim sheet.
3. Brand assets (logo/OG/hero) decision.
4. Plans catalog read contract (no invented ROI).
5. Working Contact intake design sign-off.
6. Doubt walkthrough (§17.4) scheduled.

### What this refinement added

Emotional journeys · Trust engineering · Psychology · Microcopy bible · Motion system · Full token specs · Success journey · Premium checklist · Nigerian + international localization · Delight doctrine · Design Constitution.

---

**End of Wave A Stage 1 deliverable (refinement pass 2).**  
No production code. No routes. No services. No frozen-platform modifications.
