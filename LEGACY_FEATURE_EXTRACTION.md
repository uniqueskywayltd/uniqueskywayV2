# LEGACY_FEATURE_EXTRACTION.md

## Purpose

Product-only inventory of customer-facing features in legacy Unique Sky Way (V1), adopted as governance input for **Milestone 5 — Customer Experience Platform (`v3.0.0`)** under `DEC-0026`.

This is **feature extraction**, not migration.

**Status:** Accepted planning baseline. Implementation has not started. Do not ask Cursor to “rebuild V1.” Build one Milestone 5 wave at a time on certified V2 APIs; open V1 only as a design reference for the screen currently being designed.

- Source of truth for product behavior: primarily `uniqueskyway/platform` (production customer product).
- Secondary reference: classic PHP marketing and investor screens under `uniqueskyway/`.
- Explicitly ignored: architecture, PHP/Next implementation, schema, middleware, theme-kit plumbing, DexignZone demos.

**Frozen V2 core (do not reopen):** Investment Engine `v2.1.0`, Money Movement `v2.2.0`, Administrative Platform `v2.3.0`.

**V2 customer reality today:** Identity/auth, account shell (profile, security, sessions, trusted devices, notifications, activity, preferences), system pages (maintenance / offline / forbidden), foundation landing stub, and certified **customer APIs** for deposits/withdrawals. There is **no** customer money dashboard, portfolio UX, wallet UI, marketing website, referral hub, FAQ/contact, or investment browsing experience yet.

---

## How to read classifications

| Tag | Meaning |
| --- | --- |
| ALREADY IMPLEMENTED | Exists in V2 in a usable form (may still need UX polish) |
| REBUILD | Keep the business capability; redesign and rebuild on V2 |
| REDESIGN | Intent is valuable; V1 presentation/copy/rules need a better product form |
| MERGE | Fold into another planned surface (do not ship as a separate product) |
| IGNORE | Low value; skip for Milestone 5 |
| REMOVE | Must not return (theme debris, trust risk, or non-product) |
| NEW IDEA | Useful modern CX opportunity not clearly productized in V1 |

Complexity: **S** small · **M** medium · **L** large

Priority stars appear again in the final ranked section.

---

## 1. Marketing Website

| Feature | Business purpose | Customer value | Disposition | Priority | Complexity | Dependencies | Improvements / modern UX | AI? | Industry-typical? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Homepage hero + primary CTA | Position the firm; drive register/login | Instant orientation | **REBUILD** | ★★★★★ | M | Brand, auth routes | Brand-first composition; one CTA group; honest promise | No | Yes |
| Product preview (investor dashboard mock) | Show the product before signup | Reduces uncertainty | **REDESIGN** | ★★★★ | M | Design system | Real screenshots or branded illustration—no fake balances | No | Yes |
| Credibility stats ($AUM, investor counts, years) | Social proof | Trust shortcut | **REDESIGN** | ★★★ | S | Legal/marketing accuracy | Only publish verified figures; otherwise replace with credentials/process | No | Selective |
| Market ticker strip | Ambient markets credibility | Cosmetic professionalism | **IGNORE** | ★ | S | Market data feed | Skip unless authentic and maintained | No | Niche |
| Live activity FOMO popups | Urgency / social proof | Manipulative if simulated | **REMOVE** | ★ | S | — | Never ship fake peer activity | No | Anti-pattern |
| Services / sector storytelling | Explain diversification narrative | Where money goes story | **MERGE** into one Where we invest section | ★★★★ | M | Brand story | One honest narrative, not six fake products | No | Yes |
| Trust pillars | Brand promises | Differentiation | **REBUILD** | ★★★★ | S | Security/legal claims | Benefit language; link to Security + FAQ | No | Yes |
| How-it-works (4 steps) | Demystify signup to track | Lower anxiety | **REBUILD** | ★★★★★ | S | Plans, deposits | Align steps to real V2 money engine statuses | No | Yes |
| Investment plans grid (marketing) | Sell plan tiers before login | Compare packages | **REBUILD** | ★★★★★ | M | Certified plan catalog | Read-only from certified terms; clear risk disclosure | Explain plan differences | Yes |
| Plans coming soon empty marketing state | Avoid broken shop | Continuity when catalog empty | **REBUILD** | ★★★ | S | Plans admin | Keep | No | Yes |
| Testimonials marquee | Emotional trust | High risk if fabricated | **REMOVE** unless consented/real | ★ | S | Comms/legal | Prefer real case studies later | No | Risky |
| Final CTA band | Convert undecided visitors | Clear next action | **REBUILD** | ★★★★ | S | Auth | Keep simple | No | Yes |
| About / company story | Legitimacy and origin | Know the firm | **REDESIGN** | ★★★★ | M | Brand | Strip Gold Trafigura / sovereign-fund clone text | No | Yes |
| Certificates / insurance imagery | Visual trust | Peace of mind | **REDESIGN** | ★★★ | S | Verifiable docs | Show only real, dated proof | No | Selective |
| Services catalog page | Sector tiles | Narrative only | **MERGE** | ★★★ | S | About | Do not invent buyable loans/NFT products | No | Optional |
| How-it-works dedicated page | Full journey education | Expectation setting | **REBUILD** | ★★★★ | S | FAQ | Keep | No | Yes |
| Investments / pricing plans page | Dedicated plan shopping | Decision support | **REBUILD** | ★★★★★ | M | Plans | Disclose ROI terms from certified engine only | Calculator assist | Yes |
| FAQ / help center (public) | Self-serve answers | Fewer tickets | **REBUILD** | ★★★★★ | M | Support ops | Searchable FAQs by journey stage | FAQ chatbot later | Yes |
| Contact page + intake | Reach humans | Support path | **REBUILD** | ★★★★ | M | Ticketing/email | Working intake; SLA expectations | Triage assist | Yes |
| Live chat widget | Real-time help | Instant support | **REDESIGN** | ★★★ | S | Staffing | Only when agents are real and available | Suggest answers | Common |
| Referrals marketing page | Explain affiliate offer | Growth education | **REBUILD** | ★★★★ | M | Referral policy | Education only; real tracking in-app | No | Common in this niche |
| Regional Representative premium tier | High-tier affiliate promises | Power-user incentive | **REDESIGN** or defer | ★★ | L | Legal/ops capacity | Do not ship salary/loan promises without productization | No | Risky |
| Public Security page | Pre-deposit confidence | Trust | **REBUILD** | ★★★★★ | M | Real controls | Human language; no architecture lecture | No | Yes |
| Privacy Policy | Legal transparency | Rights / consent | **REBUILD** | ★★★★★ | M | Legal | Required | No | Required |
| Terms of Service | Investment rules and liability | Consent | **REBUILD** | ★★★★★ | M | Legal | Required; align with engine rules | No | Required |
| Marketing nav + footer | Wayfinding | Discoverability | **REBUILD** | ★★★★★ | S | Pages above | Clean IA | No | Yes |
| Dark mode on marketing | Comfort | Cosmetic | **IGNORE** | ★★ | S | Theme | Defer | No | Optional |
| Maintenance marketing page | Downtime communication | Expectation | **ALREADY IMPLEMENTED** (V2 `/maintenance`) | ★★★★ | S | Ops | Polish copy; customer-first CTA | No | Yes |
| Classic PHP loan pages / apply-loan | Borrowing product | Side narrative | **REMOVE** | ★ | L | Licensing | Not operating product unless truly licensed | No | No (here) |
| NFT / token / RWA novelty landings | Theme extensions | Confusion | **REMOVE** | ★ | M | — | DexignZone / Gold Trafigura debris | No | No |
| Blog / financial-analysis debris | Content hub | Near-zero | **IGNORE** | ★ | M | CMS | Skip until real content ops exist | Drafting later | Optional |

---

## 2. Customer Experience (journey and account foundation)

| Feature | Business purpose | Customer value | Disposition | Priority | Complexity | Dependencies | Improvements | AI? | Industry-typical? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Register / login / logout | Access | Entry | **ALREADY IMPLEMENTED** | ★★★★★ | — | Identity | Polish branding on auth screens | No | Yes |
| Forgot / reset password | Recovery | Regain access | **ALREADY IMPLEMENTED** | ★★★★★ | — | Email | Keep | No | Yes |
| Email verification gate | Reduce fake accounts | Safer funding | **ALREADY IMPLEMENTED** (flow exists) | ★★★★★ | S | Email | Stronger post-verify next steps | No | Yes |
| Register with plan + referral code | Capture intent and sponsor | Faster to first investment | **REDESIGN** | ★★★★ | M | Plans, referrals | Consider verifying first, then choosing plan | Recommend plan | Common |
| Pending investment / Awaiting funding bridge | Connect plan choice to first deposit | Converts signup to funded | **REBUILD** | ★★★★★ | M | Deposits, plans | Day-1 checklist: verify → fund → activate | Nudge stagnant users | Yes |
| Session inactivity auto-sign-out | Safety | Protect funds | **REBUILD** (policy UX) | ★★★★ | S | Sessions | Communicate timeout calmly | No | Yes |
| Forbidden / offline / 404 / error moments | Graceful failure | Trust under stress | **ALREADY IMPLEMENTED** (foundation) | ★★★★ | S | Shell | Align copy with brand CX | No | Yes |
| Day-1 onboarding checklist | Activation | Higher funding rate | **NEW IDEA** | ★★★★ | M | Account + wallet | Primary Milestone 5 onboarding surface | Coach next step | Yes |
| Risk / plan disclosures at commit | Informed consent | Trust and compliance | **NEW IDEA** | ★★★★★ | S–M | Legal, plans | Mandatory before invest/deposit confirm | Summarize risks | Yes |

---

## 3. Dashboard

| Feature | Business purpose | Customer value | Disposition | Priority | Complexity | Dependencies | Improvements | AI? | Industry-typical? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Customer home / overview | Daily command center | Situational awareness | **REBUILD** | ★★★★★ | L | Wallet, portfolio, activity APIs | Money-first home (not account-settings-first) | Priority insights | Yes |
| Welcome / identity strip | Personalization | Belonging | **REDESIGN** | ★★★ | S | Profile | Keep light | No | Yes |
| Quick actions (Deposit / Withdraw / Invest / Wallet) | Speed | Completes core jobs | **REBUILD** | ★★★★★ | S | Money UX | Sticky on mobile | No | Yes |
| Balance buckets (available / pending / invested / locked / withdrawable) | Truthful money map | Prevent confusion | **REBUILD** | ★★★★★ | M | Ledger | Accrued ≠ credited ≠ withdrawable language everywhere | Explain bucket | Yes |
| Lifetime totals (deposited / withdrawn / ROI / referral) | Progress | Motivation | **REBUILD** | ★★★★ | M | Ledger | Must reconcile to ledger | No | Yes |
| Live earnings hero (animated accrual) | Make ROI feel alive | Engagement | **REDESIGN** | ★★★★ | L | Settlement/ROI display | Must never imply uncredited money is withdrawable | Maturity countdowns | Niche |
| Charts (growth / history / earnings) | Visual history | Insight | **REBUILD** | ★★★ | M | Ledger history | Strong empty states | Annotate anomalies | Yes |
| Recent activity / notification previews | Continuity | Catch-up | **MERGE** with Activity/Notifications | ★★★★ | S | Existing centers | Cards linking to full centers | Prioritize actionable | Yes |
| Theme chrome chat / fake notes (PHP kit) | Decorative | None | **REMOVE** | ★ | — | — | Kill | No | No |

---

## 4. Investments

| Feature | Business purpose | Customer value | Disposition | Priority | Complexity | Dependencies | Improvements | AI? | Industry-typical? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Plan selection (active catalog) | Choose terms | Clear commitment | **REBUILD** | ★★★★★ | M | Frozen investment engine | Terms from certified snapshots only | Compare plans | Yes |
| Portfolio list + status summary | See all positions | Portfolio control | **REBUILD** | ★★★★★ | M | Engine read models | Mobile card layout | Flag maturing soon | Yes |
| Investment detail (terms, progress, timeline, credits) | Deep transparency | Confidence | **REBUILD** | ★★★★★ | L | Engine + ledger | Accrued vs credited; maturity CTA | Explain progression | Yes |
| Auto-reinvest toggle | Continuity | Hands-off compounding | **REBUILD** | ★★★★ | M | Engine rules | Explicit disclosure of what auto-does | No | Common |
| Manual reinvest flow | Reallocate after maturity/balance | Growth loop | **REBUILD** | ★★★★★ | M | Wallet + engine | Dedicated flow—not buried in deposit | Suggest options | Yes |
| Maturity action center | Decision moment | Clear next step | **NEW IDEA** | ★★★★ | M | Reinvest/withdraw | Matured — withdraw or reinvest hub | Recommend | Yes |
| Investment calculator (marketing/tooling) | Expectation setting | Education | **REDESIGN** | ★★★★ | M | Certified math only | Read-only projection; labeled non-guaranteed | What-if scenarios | Yes |
| Theme portofolio.html demos | Kit filler | None | **REMOVE** | ★ | — | — | Kill | No | No |

---

## 5. Wallet

| Feature | Business purpose | Customer value | Disposition | Priority | Complexity | Dependencies | Improvements | AI? | Industry-typical? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Wallet overview | Money home | Understand balances | **REBUILD** | ★★★★★ | M | Ledger | Buckets + recent movements | Explain balance | Yes |
| Deposit list + filters + pagination | Track funding | Status clarity | **REBUILD** | ★★★★★ | M | Deposit APIs (exist) | Status timeline; why pending | No | Yes |
| Deposit wizard (plan → method → details → confirm) | Fund account / activate plan | Completes funding | **REBUILD** | ★★★★★ | L | Frozen deposit engine + provider policy | Align to certified Paystack/USD rails; drop hardcoded QR theater | Network/amount checks | Yes |
| Deposit success receipt | Confirmation | Reassurance | **REBUILD** | ★★★★ | S | Deposits | Reference ID, ETA, next steps | No | Yes |
| Withdrawal list + statuses | Track payouts | Cash-out confidence | **REBUILD** | ★★★★★ | M | Withdrawal APIs (exist) | Status timeline | No | Yes |
| Withdrawal wizard + confirmation | Request payout | Get money out | **REBUILD** | ★★★★★ | L | Frozen withdrawal engine | Saved destinations; clear fees/ETAs | Flag unusual amounts | Yes |
| Withdrawal success receipt | Confirmation | Reassurance | **REBUILD** | ★★★★ | S | Withdrawals | Keep | No | Yes |
| Customer ledger / money history | Explain every balance | Audit comfort | **REBUILD** | ★★★★★ | M | Ledger reads | Search/filter; export later | Classify rows | Yes |
| Where is my deposit/withdrawal tracker | Cut support load | Stress reduction | **REDESIGN** | ★★★★★ | M | Status machines | Timestamped state machine UI | ETA coaching | Yes |
| Saved payout destinations | Faster withdraw | Convenience | **NEW IDEA** | ★★★★ | M | Profile/security | Verify destination ownership | No | Yes |
| Statements export (CSV/PDF) | Personal records | Audit comfort | **NEW IDEA** | ★★★ | M | Reporting patterns | After core money UX | No | Yes |
| Hardcoded payment addresses as truth | Ops shortcut | High risk | **REMOVE** | ★ | — | — | Addresses from live ops config only | No | No |
| Theme wallet/transaction HTML demos | Kit filler | None | **REMOVE** | ★ | — | — | Kill | No | No |
| alert() money confirmations | Crude feedback | Anxiety | **REMOVE** | ★ | — | — | Calm inline/toast UX | No | No |

---

## 6. Profile

| Feature | Business purpose | Customer value | Disposition | Priority | Complexity | Dependencies | Improvements | AI? | Industry-typical? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Profile view/edit + avatar | Identity | Control | **ALREADY IMPLEMENTED** | ★★★★ | S | Account APIs | Visual polish only | No | Yes |
| Preferences (theme/locale/comms) | Personalization | Comfort | **ALREADY IMPLEMENTED** (split from profile — keep) | ★★★★ | S | Preferences API | Good V2 split; keep | No | Yes |
| Security center / password | Account safety | Protection | **ALREADY IMPLEMENTED** | ★★★★★ | — | Auth | Polish | No | Yes |
| Trusted devices | Device trust | Safety | **ALREADY IMPLEMENTED** | ★★★★★ | — | Auth | Keep | No | Yes |
| Active sessions revoke | Session hygiene | Safety | **ALREADY IMPLEMENTED** | ★★★★★ | — | Auth | Keep | No | Yes |
| Referral code + share link in profile | Growth | Invite others | **MERGE** into Referral hub | ★★★★ | S | Referrals product | Do not leave as profile footnote only | Suggest share copy | Common |
| PHP passport photo / thin profile | KYC-lite | Weak | **MERGE** into KYC journey | ★★★ | M | KYC | Modern document flow later | Document check | Yes |

---

## 7. Notifications

| Feature | Business purpose | Customer value | Disposition | Priority | Complexity | Dependencies | Improvements | AI? | Industry-typical? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| In-app notification center | Status awareness | Engagement | **ALREADY IMPLEMENTED** | ★★★★★ | S | Notification APIs | Wire financial events when CX ships | Prioritize actionable | Yes |
| Activity timeline | Personal audit | Transparency | **ALREADY IMPLEMENTED** | ★★★★ | S | Activity API | Keep distinct from money ledger | No | Yes |
| Preference-controlled channels | Respect attention | Control | **ALREADY IMPLEMENTED** (prefs) | ★★★★ | S | Notification policy | Expand channels later | No | Yes |
| Push / SMS approvals | Mobile trust | Faster awareness | **NEW IDEA** | ★★★ | L | Providers | After email + in-app solid | No | Common |
| Theme Gmail-like inbox UI | Fake email client | Confusion | **REMOVE** | ★ | — | — | Never rebuild | No | No |

---

## 8. Support

| Feature | Business purpose | Customer value | Disposition | Priority | Complexity | Dependencies | Improvements | AI? | Industry-typical? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Public FAQ | Self-serve | Faster answers | **REBUILD** | ★★★★★ | M | Content | Journey-based articles | Retrieval Q&A | Yes |
| Public contact / ticket intake | Human help | Escalation | **REBUILD** | ★★★★ | M | Email/ops | Case IDs | Triage | Yes |
| Live chat | Instant help | Convenience | **REDESIGN** | ★★★ | M | Staffing | Hours-gated | Copilot for agents | Common |
| In-app Help hub | Context help next to money flows | Lower friction | **NEW IDEA** | ★★★★ | M | FAQ + cases | Deep-link open deposit status | Guided troubleshoot | Yes |
| Theme chatbox / notes widgets | Demo chrome | None | **REMOVE** | ★ | — | — | Kill | No | No |

---

## 9. Trust & Verification

| Feature | Business purpose | Customer value | Disposition | Priority | Complexity | Dependencies | Improvements | AI? | Industry-typical? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Email verification | Ownership proof | Integrity | **ALREADY IMPLEMENTED** | ★★★★★ | — | Auth | Keep | No | Yes |
| Security claims page | Pre-deposit trust | Confidence | **REBUILD** | ★★★★★ | M | Real controls | Only true claims | No | Yes |
| New-device / password-changed alerts | Fraud signal | Safety | **REBUILD** (email + in-app) | ★★★★★ | M | Outbox/email | Required | No | Yes |
| Deposit/withdrawal review expectancy | Set SLA | Fewer tickets | **REBUILD** | ★★★★ | S | Ops policy | Show on every money confirm | No | Yes |
| Insurance / certification claims | Institutional reassurance | Risk transfer signal | **REDESIGN** | ★★★ | S | Proof docs | Prove or remove | No | Selective |
| KYC / eligibility before high limits | Compliance and trust | Safer platform | **NEW IDEA** | ★★★★★ | L | Admin KYC (exists) | Customer KYC UX still missing | Doc assist | Yes |
| Fake stats / fake testimonials / FOMO widgets | Manufactured trust | Trust destruction | **REMOVE** | ★ | — | — | Never | No | Anti-pattern |
| Gold Trafigura / OFC Singapore / sovereign fund clone identity | Prestige theater | Brand fraud risk | **REMOVE** | ★ | — | — | Never | No | No |

---

## 10. Mobile Experience

| Feature | Business purpose | Customer value | Disposition | Priority | Complexity | Dependencies | Improvements | AI? | Industry-typical? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Mobile shell / hamburger IA | Usable on phone | Access anywhere | **REBUILD** (customer money shell) | ★★★★★ | M | Dashboard | Deposit/withdraw as mobile-primary | No | Yes |
| Stacked money wizards | Fund/payout on phone | Completeness | **REBUILD** | ★★★★★ | L | Wallet UX | Large tap targets; copy helpers | No | Yes |
| Dense tables on small screens | History | Pain today | **REDESIGN** | ★★★★ | M | Lists | Cards first on mobile | No | Yes |
| Account shell mobile nav (V2) | Settings on phone | Works | **ALREADY IMPLEMENTED** | ★★★★ | — | Customer shell | Extend for money routes later | No | Yes |

---

## 11. Performance UX

| Feature | Business purpose | Customer value | Disposition | Priority | Complexity | Dependencies | Improvements | AI? | Industry-typical? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Route loading skeletons | Perceived speed | Calm waits | **ALREADY IMPLEMENTED** (foundation) + **REBUILD** for money routes | ★★★★ | S | Shell | Keep pattern | No | Yes |
| Empty states with CTA | Guide next action | Activation | **REBUILD** | ★★★★★ | S | Design system | Money-specific empties | Suggest next action | Yes |
| Error + retry | Recoverability | Trust | **ALREADY IMPLEMENTED** pattern | ★★★★ | S | Shell | Reuse everywhere | No | Yes |
| Success receipts | Closure | Confidence | **REBUILD** | ★★★★★ | S | Money flows | Critical for deposits/withdrawals/invest | No | Yes |
| Quiet charts when empty | Avoid alarm | Clarity | **REBUILD** | ★★★ | S | Charts | Keep philosophy | No | Yes |
| Theme preloaders / alert spam | Kit habits | Anxiety | **REMOVE** | ★ | — | — | Calm system feedback only | No | No |

---

## 12. Email Experience

| Feature / flow | Business purpose | Customer value | Disposition | Priority | Complexity | Dependencies | Improvements | AI? | Industry-typical? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Welcome + verify | Activate account | Start journey | **REBUILD** | ★★★★★ | M | Outbox/email catalog | Brand-aligned; merge verify variants | No | Yes |
| Registration next-step welcome | Orient new investor | Know what to do | **REBUILD** | ★★★★ | S | Onboarding | Checklist CTA | No | Yes |
| Password reset / changed | Recovery + security | Safety | **REBUILD** | ★★★★★ | S | Auth events | Keep minimal sensitive data | No | Yes |
| New device login | Fraud alert | Protection | **REBUILD** | ★★★★★ | S | Auth events | Keep | No | Yes |
| Deposit lifecycle emails | Status without checking app | Fewer tickets | **REBUILD** | ★★★★★ | M | Money events | Submit/approve/credit/reject | No | Yes |
| Withdrawal lifecycle emails | Payout clarity | Confidence | **REBUILD** | ★★★★★ | M | Money events | Include ETA and reference | No | Yes |
| Investment activated / matured / reinvested | Lifecycle clarity | Decision moments | **REBUILD** | ★★★★★ | M | Engine events | Institutional tone | No | Yes |
| Daily ROI credited | Retention engagement | Habit loop | **REDESIGN** | ★★★ | M | Settlement events | Tone down hype; optional preference | Summarize week | Niche |
| Referral commission / new referral | Growth reinforcement | Motivation | **REBUILD** | ★★★★ | M | Referrals product | After referral hub | No | Common |
| Suspended / reactivated | Access clarity | Critical | **REBUILD** | ★★★★ | S | Admin status | Keep | No | Yes |
| Broadcast / maintenance announcement | Platform news | Awareness | **REBUILD** | ★★★ | M | Ops | Prefer status page + email | Draft | Yes |

V2 has email/notification system design and admin template catalogs; customer-facing branded delivery UX is still a Milestone 5 build over frozen event contracts.

---

## 13. PWA Features

| Feature | Business purpose | Customer value | Disposition | Priority | Complexity | Dependencies | Improvements | AI? | Industry-typical? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Web app manifest / installability | Home-screen icon | Convenience | **REDESIGN** | ★★★ | S | Brand assets | Proper icons + start URL to dashboard when logged in | No | Common |
| Service worker / offline investor mode | Offline use | Continuity | **IGNORE** (not in V1 product) | ★★ | L | Caching strategy | Do not invent early; V2 already has offline page | No | Optional |
| V2 /offline surface | Graceful offline | Clarity | **ALREADY IMPLEMENTED** | ★★★ | — | Shell | Pair later with PWA if desired | No | Yes |

---

## 14. Nice-to-have Features

- Soft sector photography / atmosphere (only as brand storytelling)
- Optional live chat when staffed
- Charts after first credit
- Install-to-home-screen polish
- Preferred currency display polish
- Weekly ROI digest instead of daily noise
- Referral marketing page polish (educational)
- Dark mode preference (already in V2 prefs path)

---

## 15. Features that should NEVER return

1. NFT collect/buy/sell marketplace pages
2. Tokenized energy / RWA / natural-energy novelty landings under alien brands
3. Stand-alone loan acquisition funnels (unless separately licensed and productized)
4. Fake live deposit/withdraw FOMO widgets
5. Fabricated testimonials
6. Unverified inflated AUM / investor / market-count claims
7. Gold Trafigura / Ocean Financial Centre Singapore / sovereign wealth clone identity
8. Win tickets / gambling skins on investment plans
9. DexignZone theme demos (ecommerce, charts kits, faux Gmail, faux chat, fake wallets/portfolio HTML)
10. Hardcoded payment addresses as the source of truth in UI
11. `alert()`-driven money confirmations
12. Affiliate tables exposing other users' emails/photos without privacy redesign
13. In-product Regional Rep salary / loan / volume-guarantee promises without legal productization
14. Any balance theater that disagrees with the ledger
15. Multi-level MLM tree UI without explicit compliance go-ahead

---

## 16. Missing opportunities discovered

| Opportunity | Why it matters | Suggested disposition |
| --- | --- | --- |
| Customer Experience Platform as Milestone 5 (`v3.0.0`) | Unify marketing + money UX + communications | Rename roadmap away from Phase 9 Communications only |
| First-class money shell (home, wallet, portfolio, invest) | V2 APIs exist; customer UI does not | **REBUILD** core |
| Referral hub (privacy-safe) | PHP Affiliate was valued; Next under-shipped | **REBUILD** |
| Onboarding checklist for unfunded accounts | Converts signup to funded | **NEW IDEA** |
| Deposit/withdrawal status tracker | #1 support driver | **REDESIGN** |
| Customer KYC submission UX | Admin KYC exists; customer flow thin | **NEW IDEA** |
| Maturity action center | Returning-investor moment | **NEW IDEA** |
| Honest Accrued vs Credited vs Withdrawable language | Stops live-earnings confusion | **REDESIGN** |
| Proof center (real policies/documents) | Replaces fake social proof | **NEW IDEA** |
| In-app Help + case ID | Better than contact support text | **NEW IDEA** |
| Saved payout methods | Withdraw friction down | **NEW IDEA** |
| Statement export | Investor audit comfort | **NEW IDEA** |
| Investment calculator tied to certified math only | Education without breaking freeze | **REDESIGN** |

---

## 17. Recommended phase / milestone order

Treat this as **Milestone 5 — Customer Experience Platform**, targeting **`v3.0.0`**, built on frozen core.

### Wave A — Trust and public presence (no financial math changes)

1. Brand marketing site (home, about, how-it-works, plans, security, legal, FAQ, contact)
2. Auth/account visual polish over existing V2 identity
3. Branded transactional email templates for auth/security events

### Wave B — Money customer experience (UI over frozen engines)

4. Customer money shell + dashboard
5. Wallet + deposit UX + success/status tracker
6. Withdrawal UX + success/status tracker
7. Portfolio list/detail + reinvest/maturity center
8. Customer ledger view
9. Financial lifecycle emails + in-app notification wiring

### Wave C — Growth and support

10. Referral hub (privacy-safe) + referral emails
11. In-app Help + FAQ deep links
12. Onboarding checklist / unfunded nudges

### Wave D — Polish and later

13. Charts, PWA install polish, optional chat
14. Customer KYC UX, saved payout destinations, statement export
15. Push/SMS (only after email/in-app are solid)

**Hard rule:** every Wave B screen consumes certified engines/APIs. No new ledger, ROI, deposit, withdrawal, webhook, or Paystack behavior without ADR + recertification.

---

## Final ranking — every extracted feature

### ★★★★★ Critical

- Marketing homepage + conversion funnel
- How-it-works aligned to real statuses
- Public plans experience (certified terms only)
- FAQ + contact intake
- Privacy + Terms
- Public Security trust page
- Customer money dashboard / home
- Balance buckets with Accrued ≠ Credited ≠ Withdrawable
- Deposit list + wizard + receipt + status tracker
- Withdrawal list + wizard + receipt + status tracker
- Portfolio list + detail + manual reinvest
- Customer ledger
- Risk disclosures at commit
- Auth/security/email-verification (already in V2 — keep first-class)
- Deposit/withdrawal/investment lifecycle emails
- Password/security alert emails
- Mobile-primary money journeys
- Empty/success/error states for money flows
- Await-funding / onboarding bridge after signup

### ★★★★ Important

- About / brand story (cleaned)
- Trust pillars / where-we-invest narrative
- Referral marketing education + in-app referral hub
- Live earnings UI (truthful redesign)
- Auto-reinvest
- Maturity action center
- Investment calculator (certified math only)
- Quick actions / chart suite (after first data)
- New-device / session safety UX polish
- Day-1 checklist
- In-app Help hub
- Customer KYC submission UX
- Saved payout destinations
- Financial notification wiring into existing center
- Maintenance/offline moments (already exist — keep polished)
- Mobile card layouts for tables

### ★★★ Useful

- Optional charts deep polish
- Live chat when staffed
- Cert/insurance proof center (if real)
- Weekly ROI digest (instead of noisy daily)
- Broadcast announcements
- Statement export
- PWA installability redesign
- Preferred currency polish
- Soft market atmosphere (not fake ticker FOMO)

### ★★ Optional

- Dark mode emphasis on marketing
- Regional Representative program (only if legally productized)
- Push/SMS
- Offline service worker ambitions

### ★ Ignore / never revive

- Market ticker as product
- Fake FOMO activity popups
- Fabricated testimonials
- NFT / token / RWA novelty pages
- Loan funnels-as-product
- Theme-kit demos (ecommerce, Gmail, chat, fake wallets)
- Hardcoded wallet addresses theater
- `alert()` money UX
- PII-leaky affiliate trees / unverified salary-loan promises
- Gold Trafigura / OFC / sovereign clone identity
- Broken blog / financial-analysis debris
- Win-ticket gambling skins

---

## Decision summary for V3 planning

**Already strong in V2 (do not rebuild from V1):** identity, sessions, trusted devices, profile, preferences, notifications center, activity, foundation error/offline/maintenance, certified money engines + admin ops.

**Must extract and rebuild as Customer Experience:** marketing website, money dashboard, wallet deposits/withdrawals UX, portfolio/reinvest, customer ledger, honest earnings language, status trackers, branded financial emails, referral hub, FAQ/help.

**Must discard:** theme debris, fake social proof, non-products (NFTs/loans/tokens), and any UX that lies about money.

**Outcome of this audit:** Unique Sky Way can stop migrating a website and start shipping a **better product** than V1—protected by the frozen core, guided by extracted business value only.

---

*No code was implemented. No V2 application surfaces were modified beyond creating this report.*
