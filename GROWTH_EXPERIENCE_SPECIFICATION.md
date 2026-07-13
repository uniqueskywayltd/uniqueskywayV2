# GROWTH_EXPERIENCE_SPECIFICATION.md

## Status

**APPROVED** — Stage 1 (`DEC-0045`, score **99.8 / 100**)  
Release target: **Customer Success Experience** **`v3.2.0`**  
(Filename retains “Growth”; product mission is Customer Success — growth is the result.)  
Program: Milestone 6  
Governance: `PLATFORM_CONSTITUTION.md` (`DEC-0044`), `DEC-0045`, `DEC-0046`, `DEC-0047`, `DEC-0027`, `EP-026`, `EP-029`  
Freeze baselines: `v2.1.0`–`v2.3.0`, `v3.0.0` (`DEC-0029`), `v3.1.0` (`DEC-0043`)

**Stage 2 may implement only what is approved in this package — one sprint at a time.**  
Deviation requires updating these Stage 1 documents first, or an ADR for philosophy changes.

### Companion authorities (required reading)

| Document | Role |
| --- | --- |
| `CUSTOMER_SUCCESS_FRAMEWORK.md` | Success definition, journeys, anti-patterns |
| `SUCCESS_METRICS_FRAMEWORK.md` | Measurable customer outcomes (not vanity KPIs) |
| `ENGAGEMENT_PRINCIPLES.md` | Retention without noise; calm return visits |
| `REFERRAL_EXPERIENCE_PRINCIPLES.md` | Referral hub UX (privacy-safe) |
| `STATEMENT_EXPERIENCE_GUIDE.md` | Statements / tax & account documents |
| `STATEMENT_DATA_DICTIONARY.md` | Required before G5 — field catalog (ledger-backed) |
| `CUSTOMER_EDUCATION_GUIDE.md` | Education surfaces & voice |
| `CUSTOMER_EXPERIENCE_PRINCIPLES.md` | Authenticated UX constitution (still in force) |
| `FINANCIAL_INVARIANTS.md` | Money truth (always wins) |
| `NOTIFICATION_EXPERIENCE_PRINCIPLES.md` | Communication rules (do not reopen noisily) |
| `WAVE_B_UX_SPECIFICATION.md` | Money UX baseline to extend, not replace |
| `PLATFORM_CONSTITUTION.md` | Strategic process |

### Frozen platform (do not redesign)

- Investment Engine `v2.1.0`  
- Money Movement `v2.2.0`  
- Administrative Platform `v2.3.0`  
- Public Wave A `v3.0.0`  
- Customer Money Experience Wave B `v3.1.0`  

Milestone 6 **consumes** certified reads and existing referral/notification/help foundations.  
It does **not** invent new financial engines, rewrite ledger math, or reopen deposit/withdrawal settlement.

---

## Purpose

| Era | Question answered |
| --- | --- |
| Wave A (`v3.0.0`) | Why trust us? |
| Wave B (`v3.1.0`) | How do I manage my money? |
| Milestone 6 (`v3.2.0`) | **Why should I keep coming back?** |

Internal product framing:

```text
Customer Success Experience
```

Growth is the **result**. Customer success is the **mission**. This train is not marketing volume; it makes customers more successful over time—clearer about their money, more confident to act, better able to share accurately, and less dependent on support for routine facts.

North-star test for every Milestone 6 surface:

> Does this help customers become more successful?

If the answer is noise, FOMO, casino psychology, fake streaks, or invented urgency — **out of scope**.

---

## Product philosophy (Milestone 6)

1. **Retention through clarity** — Return visits feel peaceful and oriented.  
2. **Success over spectacle** — Education, statements, referrals, and milestones reinforce real progress.  
3. **More peaceful over time** — After six months, a customer should see where money is, what changed, and what to do next—without hunting through banners or promotions.  
4. **Ledger truth remains supreme** — Statements and insights never invent balances.  
5. **Wave B money hub stays primary** — Growth surfaces support the money home; they do not compete with it for attention.  
6. **Privacy-first referrals** — Shareable accuracy without exposing others’ balances or PII.  
7. **No new engines** — No ROI formula changes, no payment provider work, no ledger redesign.

---

# 1. Personas (retention lens)

Personas from Wave B remain valid. Milestone 6 adds a **retention lens**.

## 1.1 Returning regular

| Lens | Detail |
| --- | --- |
| Goals | Quick re-orientation; confirm nothing urgent; optional next deposit/invest |
| Success | Dashboard answers “what changed?” in seconds; education unused unless needed |

## 1.2 Sharing-minded referrer

| Lens | Detail |
| --- | --- |
| Goals | Share accurately; understand reward status; avoid policy mistakes |
| Success | Clear code/link, honest eligibility, privacy-safe history |

## 1.3 Document-seeking customer

| Lens | Detail |
| --- | --- |
| Goals | Download statements for taxes, banking, or personal audit |
| Success | Period selection → preview of truth → export; dates/amounts reconcile to ledger |

## 1.4 Learning customer

| Lens | Detail |
| --- | --- |
| Goals | Understand accrued vs credited, settlement timing, withdrawal review |
| Success | Short, honest lessons linked from empty states and Help—never gamified quizzes for money theater |

## 1.5 Achievement-aware customer

| Lens | Detail |
| --- | --- |
| Goals | Acknowledge real milestones (first deposit, first maturity, identity verified) |
| Success | Quiet recognition of facts that already happened; no points economy |

## 1.6 Support-seeking customer

| Lens | Detail |
| --- | --- |
| Goals | Resolve a stuck status without waiting on chat for facts the app already knows |
| Success | Contextual help, searchable success center, clear escalation path |

---

# 2. Information architecture

## 2.1 Primary question map (`EP-029`)

| Surface | Primary question |
| --- | --- |
| Customer Success Hub | How can I become more successful? (`DEC-0046`) |
| Education home / article | What should I learn next? |
| Referral hub | How do I recommend this responsibly? |
| Statements home | Can I understand my financial history? |
| Statement detail / export | Does this match my ledger? (`DEC-0047`) |
| Achievements / milestones | What real progress have I already made? |
| Personalized insights (bounded) | What changed that deserves calm attention? |
| Help Center (expanded) | How do I fix or understand this without shouting? |

Wave B surfaces keep their existing primary questions. Milestone 6 must not replace Dashboard’s “How am I doing today?” with promotional chrome.

## 2.2 Suggested routes (Stage 2; editable upon approval)

| Route | Intent |
| --- | --- |
| `/account/success` | Customer Success Hub (`DEC-0046`) |
| `/account/learn` | Education index (G3 deepens content) |
| `/account/learn/[slug]` | Education article (G3) |
| `/account/referrals` | Referral hub (G4 deepens; B4 baseline remains) |
| `/account/statements` | Statements entry (G2 deepens) |
| `/account/statements/[id]` | Statement view / download (G2) |
| `/account/milestones` | Achievements / milestones shell (G1; content later as needed) |
| `/account/help` (expand) | Help Center (G3 topics + existing B4) |
| Deep links from notifications / empty states | Context-sensitive education & help |

## 2.3 Navigation placement

| Rule | Detail |
| --- | --- |
| Money nav remains sacred | Dashboard · Portfolio · Wallet · Activity (or established Wave B order) — no growth spam in money primary nav |
| Success / Learn / Statements | Account area or secondary “Success” entry—not a permanent flashing dashboard module |
| Referrals | Remain under Account / Communication continuity from B4 |
| Dashboard | At most **one** quiet success cue (e.g. “Something changed” / milestone toast once)—never stacked promo cards |

---

# 3. Capability catalog (in scope)

| Capability | Success contribution | Notes |
| --- | --- | --- |
| Referral Experience | Accurate sharing → sustainable, honest growth | UX over frozen referral domain; no engine rewrite |
| Financial / Tax / Account Statements | Auditability & trust over time | Ledger-backed; exportable |
| Customer Education | Competence → fewer anxiety tickets | Honest terms only |
| Help Center Expansion | Self-serve success | Extends B4 help; searchable |
| Achievements & Milestones | Recognition of **real** progress | Fact-based; optional to dismiss |
| Personalized insights | Calm “what changed” | Derived from certified data only |
| Customer Success Center | Orientation hub for all of the above | Not a second dashboard for money |

---

# 4. Explicit out of scope

- New financial engines (investment, deposit, withdrawal, settlement, ROI posting)  
- Payment provider changes / multi-PSP  
- Language pack / i18n (`v3.3.0`)  
- PWA / push platform work (`v3.4.0`)  
- Partner / public API (`v4.0.0`)  
- Live chat staffing product (may deep-link contact only)  
- Casino gamification, streaks-for-deposits, scarcity timers, fake social proof  
- Marketing pop-ups that interrupt money tasks  
- Leaderboards that expose other customers’ balances  
- NFT / crypto novelty / loan products (`LEGACY_FEATURE_EXTRACTION.md` REMOVE list)  

---

# 5. Sprint plan (Stage 2 — approved sequence)

Implement **one sprint at a time**. Review and approve before the next.

| Sprint | Scope | Primary question | Exit |
| --- | --- | --- | --- |
| **G1** | Customer Success Hub: success dashboard, learning shell, milestones shell, statements entry, referral entry, progress framework — **no business logic** | How can I become more successful? | Certified slice |
| **G2** | Statements: monthly, investment summaries, ledger summaries, download history, timeline — **no accounting changes**; `DEC-0047` | Can I understand my financial history? | Certified slice |
| **G3** | Education: basics, security, platform guides, FAQ, articles, optional video, progress tracking | What should I learn next? | Certified slice |
| **G4** | Referral Experience: dashboard, rewards history, invite flow, privacy, status, education — **no gamification** | How do I recommend this responsibly? | Certified slice |
| **G5** | Certification only (perf, a11y, UX, security, docs) + `STATEMENT_DATA_DICTIONARY.md` + tag **`v3.2.0`** + freeze | — | Freeze ADR |

Each sprint: Implement → Test → Review here → Approve → next. Never reopen frozen money UX for convenience.

---

# 6. Screen-level intentions

## 6.1 Customer Success Center

- Answer: **How do I succeed here?**  
- Cards/links: Learn · Referrals · Statements · Milestones · Help  
- Short “Since your last visit” optional strip — only if data-backed and quiet  
- Never show withdrawable balances competing with Dashboard  

## 6.2 Education

Authority: `CUSTOMER_EDUCATION_GUIDE.md`.

## 6.3 Referrals

Authority: `REFERRAL_EXPERIENCE_PRINCIPLES.md`.

## 6.4 Statements

Authority: `STATEMENT_EXPERIENCE_GUIDE.md`.

## 6.5 Engagement / milestones / insights

Authority: `ENGAGEMENT_PRINCIPLES.md` + `CUSTOMER_SUCCESS_FRAMEWORK.md`.

## 6.6 Help expansion

- Journey-staged FAQs (fund → invest → withdraw → referrals → statements)  
- Deep links from money error/help CTAs already in Wave B  
- Case/contact escalation without inventing ticket engines if contact already exists  

---

# 7. Cross-cutting rules

## 7.1 Calm brand continuity

Ink & Horizon / Wave B financial psychology continues. Soft confirmation only. No confetti for deposits. Milestone recognition is a quiet badge or one-line note.

## 7.2 Accessibility

Same bar as Wave B: text alternatives for amounts, no color-only status, focus order, mobile targets, polite live regions, WCAG AA+.

## 7.3 Security & privacy

- Ownership checks on all statement and referral reads  
- No cross-customer data in referral UI  
- Exports are personal documents; audit downloads where appropriate  
- CSRF / same-origin on mutations (mark prefs, copy events if logged, etc.)

## 7.4 Empty / loading / error

Reuse `EMPTY_STATES_GUIDE.md`, `STATUS_SYSTEM.md`, `FINANCIAL_MICROCOPY_GUIDE.md`. Growth empties teach success next steps—not shame.

## 7.5 Notifications

Do not spam. Milestone/education prompts follow `NOTIFICATION_EXPERIENCE_PRINCIPLES.md`: Financial and Security stay above System; marketing never drowns money.

---

# 8. Certification gates (preview for G5)

- Lint, typecheck, unit, e2e, build (`db:check` if schema)  
- Experience audit: calm retention, no casino patterns  
- Statement reconciliation spot-checks vs ledger  
- Referral privacy audit  
- A11y / performance smoke on new routes  
- Freeze ADR + `v3.2.0` annotated tag  

---

# 9. Stage 1 acceptance criteria

This Stage 1 package is ready for **Approve** when:

1. North-star retention question and Customer Success framing are clear.  
2. Companions cover education, referrals, statements, engagement, and success framework.  
3. Frozen cores and “no new engines” are explicit.  
4. Anti-patterns (noise, fake gamification) are rejected in writing.  
5. Provisional sprint map G1–G5 is enough to start implementation **after** approval.  
6. Consultancy sign-off recorded (future DEC).

---

# 10. Relationship to Wave C / earlier roadmap language

Historical roadmap “Wave C / Wave D” items (referrals polish, education, statements, help) are **absorbed** into Milestone 6 `v3.2.0` under this specification. Prefer this document over older Wave C/D blurbs when they conflict.

---

## Closing

Milestone 6 should make Unique Sky Way feel like a platform customers **grow with**—quietly competent, document-ready, accurately shareable—without ever becoming a noisy engagement machine.
