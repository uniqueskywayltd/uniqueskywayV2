# REFERRAL_EXPERIENCE_PRINCIPLES.md

## Status

**DRAFT — awaiting consultancy approval**  
Companion to `GROWTH_EXPERIENCE_SPECIFICATION.md` (Milestone 6 / `v3.2.0`)

## Purpose

Govern the **customer referral experience** over the existing frozen referral domain (codes, links, rewards ledger postings).

This document does **not** redesign referral commission math, eligibility engines, or admin reward settlement. Those remain governed by financial / referral domain rules and `FINANCIAL_INVARIANTS.md`.

## North star (`EP-029`)

> How do I invite someone correctly and privately?

## Principles

### REF-001: Accuracy over hype

Share copy must not invent returns, guarantees, or “risk-free” language. Public Wave A trust rules still apply to any shareable text.

### REF-002: Privacy absolute

Never show referred users’ balances, investment details, or PII beyond what policy explicitly allows (typically masked identity + high-level status such as pending / qualified / rewarded).

### REF-003: Code & link clarity

Primary objects: default referral code, shareable link, copy actions, optional native share. Explain where the code is applied (registration).

### REF-004: Eligibility honesty

Display reward **policy summary** in customer language: when a reward becomes due, what “pending” means, what fails qualification. Link deeper education if needed.

### REF-005: Status vocabulary

Use `STATUS_SYSTEM.md` / microcopy alignment. Examples: Invited (if tracked) · Registered · Qualified · Reward pending · Reward credited · Not eligible. Do not invent parallel slang.

### REF-006: Money from referrals is ledger money

Credited rewards appear as wallet/ledger truth—not a separate “points balance.” Deep-link to ledger/notification when credited.

### REF-007: History without spyglass

List the customer’s referral outcomes they are allowed to see. Pagination/filters OK; no download of others’ sensitive data.

### REF-008: No pressure UX

No “you’re behind your friends,” countdown to invite, or forced share walls blocking wallet access.

### REF-009: Continuity with B4

Sprint B4 shipped a read-oriented referrals summary. Milestone 6 **evolves** that surface into a full hub; it does not redesign Communication Center philosophy or notification priority.

### REF-010: Admin/policy changes surface carefully

If policy text changes, version or date the customer-visible summary. Do not silently alter share claims.

## Screen intentions

| Block | Content |
| --- | --- |
| Hero | One-sentence how referrals work + primary copy/share actions |
| Policy | Short eligibility + reward explanation |
| Stats | Counts / rewarded totals **only if ledger-backed** |
| History | Privacy-safe rows |
| Help | Deep link to education (“Referral rewards explained”) + support |

## Empty states

- No referrals yet → teach how to share; never shame.  
- Rewards pending → expectancy without false ETAs if ops-dependent.  
- Code missing (edge) → support path; do not invent codes client-side.

## Out of scope

- Multi-level marketing trees as social networks  
- Public leaderboards  
- Auto-posting to social with exaggerated claims  
- Changing reward posting rules without ADR + financial recertification  

## Acceptance checklist

- [ ] Share text legally/product-safe (no guaranteed ROI)  
- [ ] No cross-customer financial leakage  
- [ ] Credited amounts reconcile to ledger projections  
- [ ] Money critical paths unblocked by referral upsell  
