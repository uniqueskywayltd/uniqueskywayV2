# ENGAGEMENT_PRINCIPLES.md

## Status

**APPROVED** — `DEC-0045`  
Companion to `GROWTH_EXPERIENCE_SPECIFICATION.md` (Milestone 6 / `v3.2.0`)

## North star

> Why should I keep coming back?

Answer: because the product remains **useful, calm, and honest**—not because it nags.

## Principles

### ENG-001: Peace over push

The platform should become **more peaceful** over time. Returning customers should not face accumulating banners, pop-ups, or promo stacks.

### ENG-002: Orient, then invite

On return: (1) what changed, (2) where money is, (3) optional next success action. Never reverse that order.

### ENG-003: Facts before feelings

Milestones and insights must map to real events (first confirmed deposit, first maturity, identity verified, first paid withdrawal, statement available). No fictional progress.

### ENG-004: One quiet cue max on money home

Dashboard may show at most one optional, dismissible success cue. Primary money hierarchy from Wave B is inviolable.

### ENG-005: Opt-in depth

Education, milestones detail, and referral coaching live in Success / Account surfaces. Customers who only want money tools can ignore them.

### ENG-006: No casino psychology

Forbidden: confetti storms, slot motion, scarcity timers, “deposit now or lose bonus” theater, fake social proof, streaks that pressure funding.

### ENG-007: Notification discipline

Engagement messages are **System**—never outrank Security or Financial failures. Prefer in-app unread over email spam. Follow `NOTIFICATION_EXPERIENCE_PRINCIPLES.md`.

### ENG-008: Personalized insights are bounded

Allowed examples (if data exists):

- “Deposit confirmed — available updated.” (deep link; may already be a notification)  
- “Investment matured — principal handling explained.”  
- “Statement for [period] is ready.”  
- “Referral reward credited” (ledger-backed)  

Disallowed:

- Predictive “you should invest more” advice presented as fact  
- Peer comparison earnings  
- Risk scores without methodology and legal review  

### ENG-009: Achievements are acknowledgement, not economy

No redeemable points, no levels gatekeeping features, no “complete 5 deposits this week.” Show a modest timeline of **completed real events**; allow hide/mute.

### ENG-010: Brand continuity

Same calm financial UX as Wave B. Soft confirmation only. Motion respects `prefers-reduced-motion`.

## Milestone surface rules

| Surface | Do | Don’t |
| --- | --- | --- |
| Milestones | Chronology of verified life events | Progress bars to “level up” money features |
| Insights | Short, sourced, actionable | Feed of marketing cards |
| Success hub | Clear path to Learn / Statements / Refer / Help | Second portfolio of balances |

## Acceptance checklist (implementation)

- [ ] No forced modal on wallet/deposit/withdraw critical paths for growth upsell  
- [ ] No streak UI tied to funding  
- [ ] Milestone claims can be explained from system events  
- [ ] Dashboard money density not reduced to make room for promo  
- [ ] Customer can complete money tasks never opening Success Center  
