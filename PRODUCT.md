# PRODUCT.md

## Purpose

This document defines the product constitution for Unique Sky Way V2.

Unique Sky Way V2 is a greenfield investment platform. The previous project may inform business behavior later, but it must not define the architecture, code organization, or implementation approach.

## Mission

Help customers invest with clarity, discipline, and trust by providing a transparent platform for investment plans, ROI settlement, wallet balances, referrals, notifications, and administrative operations.

The mission is not simply to collect deposits and display balances. The mission is to make every financial state understandable, auditable, and correct.

## Vision

Unique Sky Way V2 should become a durable investment platform that can grow from an early product into an institution-grade system.

The long-term product should support:

- Customer onboarding with identity, compliance, and risk awareness.
- Investment plan discovery and subscription.
- Wallets, deposits, withdrawals, ledger-backed balances, and audit trails.
- Deterministic ROI settlement based on a New York calendar.
- Admin review workflows for users, investments, payouts, settlements, email, and fraud signals.
- A future path to mobile, SMS, push notifications, advanced reporting, and multiple payment rails.

## Product Philosophy

1. Financial correctness comes before convenience.
   Every balance must be explainable from ledger entries. Cash-visible values must never depend on frontend state or ad hoc arithmetic.

2. Trust is a product feature.
   Customers should see clear statuses, timestamps, terms, and history. Admins should see why a decision was made and who made it.

3. The system must prefer explicit workflows.
   Investments, deposits, withdrawals, referrals, and settlements should move through named states. Hidden state transitions create support issues and financial risk.

4. The platform must not promise more than it can prove.
   ROI calculations, maturity dates, referral eligibility, and wallet balances must come from persisted source-of-truth records.

5. The platform should be calm and fast.
   The interface should feel like a financial operating system: clear, restrained, responsive, and focused on user decisions.

6. Compliance must be treated as a launch blocker, not a polish task.
   Investment products, ROI claims, referral rewards, deposits, and withdrawals may trigger securities, money transmission, tax, consumer protection, and anti-fraud requirements. Legal and compliance review is required before production launch.

## Customers

Primary customer types:

- New investor: wants to understand the platform, create an account, verify identity if required, fund a wallet, choose an investment plan, and track ROI.
- Active investor: wants to monitor active investments, wallet activity, maturity, referrals, notifications, and withdrawals.
- Returning investor: wants to reinvest matured funds, review transaction history, and trust that historical returns remain available.
- Referred investor: enters through a referral link or code and expects the referrer relationship to be recorded correctly.

## Customer Journey

### 1. Discovery

The customer learns what Unique Sky Way offers, reviews investment plans, understands risk disclosures, and decides whether to create an account.

Key product requirements:

- Public plan information must be clear but not misleading.
- Disclosures must be visible before investment.
- Any projected ROI must be labeled as a product term, not a hidden calculation.
- The system must not expose private investment, wallet, or admin data.

### 2. Account Creation

The customer signs up using managed authentication.

Key product requirements:

- Email verification is required before financial actions.
- MFA should be supported and encouraged.
- Suspicious signups should be rate limited and monitored.
- Terms acceptance and policy version should be stored.

### 3. Profile and Eligibility

The customer completes profile information and, when enabled, KYC or eligibility checks.

Key product requirements:

- The platform must separate profile completeness from investment eligibility.
- Admin override must be audited.
- Sensitive identity data should be minimized and delegated to a compliant provider where possible.

### 4. Wallet Funding

The customer initiates a deposit through an approved payment rail.

Key product requirements:

- A deposit is not spendable until confirmed.
- Payment provider callbacks must be idempotent.
- Failed, pending, reversed, and disputed deposits must remain visible.
- Wallet balance must be ledger-derived.

### 5. Investment Selection

The customer selects an available investment plan and commits wallet funds.

Key product requirements:

- Investment terms must be snapshotted at the moment of commitment.
- The platform must not depend on mutable plan values after an investment starts.
- Principal is locked or allocated according to plan rules.
- First ROI settlement eligibility must be explicit.

### 6. Active Investment

The customer monitors principal, accrued ROI, settlement history, maturity date, and current status.

Key product requirements:

- Daily ROI settlement follows America/New_York calendar dates.
- Settlement is deterministic and idempotent.
- Missed settlement days are caught up in order.
- Customer-visible ROI comes from ledger entries, not recalculated UI values.

### 7. Maturity

The investment reaches the end of its term.

Key product requirements:

- Maturity is a state transition after the final settlement is posted.
- Principal return, final ROI, and residual rounding behavior must be explicit.
- Matured funds become available according to plan rules.

### 8. Withdrawal

The customer requests withdrawal of available funds.

Key product requirements:

- Withdrawal requests are reviewed or automatically processed according to risk policy.
- Funds are reserved while withdrawal is pending.
- Approval, rejection, cancellation, provider payout, and failure are audited.
- Rejected or failed withdrawals release reserved funds through ledger entries.

### 9. Referral

The customer shares a referral code or link.

Key product requirements:

- Referral attribution must be immutable once an eligible account is attached, except by audited admin correction.
- Referral rewards must not reduce the referred customer's principal or ROI.
- Rewards should be credited only after the qualifying investment event and any required cooling-off period.
- Multi-level referral behavior must not be added without compliance review.

## Admin Users

Admin roles:

- Support Admin: user lookup, read-only financial history, notification resend, limited account actions.
- Finance Admin: deposit review, withdrawal review, settlement monitoring, ledger read access.
- Compliance Admin: KYC review, account restrictions, audit review, suspicious activity flags.
- Platform Admin: plan management, feature flags, operational settings.
- Super Admin: role management and emergency controls. This role should be rare.

## Admin Journey

### 1. Secure Admin Login

Admins authenticate with MFA and device trust. Admin sessions should have shorter lifetimes than customer sessions.

### 2. Operations Dashboard

Admins see system health:

- Pending deposits.
- Pending withdrawals.
- Settlement run status.
- Failed outbox events.
- Email delivery failures.
- Suspicious login or transaction activity.
- Ledger imbalance alarms.

### 3. User Review

Admins can inspect a user profile, account status, KYC status, wallet accounts, investments, transactions, referrals, notifications, and audit history.

### 4. Financial Review

Admins can review deposits, withdrawals, and ledger transactions. Any mutation must require a reason and produce an audit event.

### 5. Investment Plan Management

Admins can create new plan versions and retire old ones. Active investments keep their original terms.

### 6. Settlement Operations

Admins can see daily settlement runs, catch-up runs, failures, retries, and affected investments. Manual rerun must be idempotent and permission-gated.

### 7. Communications

Admins can review email templates, delivery status, notification history, and resend eligible messages without causing duplicates.

## Investment Philosophy

Unique Sky Way V2 should present investments with precision, restraint, and accountability.

Product principles:

- Use exact terms, not vague claims.
- Show principal, ROI, start date, maturity date, status, and settlement history.
- Distinguish pending, available, locked, reserved, earned, and withdrawn funds.
- Show risk disclosures before commitment.
- Never hide fees, lockups, cancellation terms, or maturity rules.
- Treat all ROI as ledger events.

## Core Business Rules

### Accounts

- A customer must have one canonical user profile.
- Financial actions require verified email.
- High-risk actions require step-up authentication.
- Restricted users cannot deposit, invest, refer, or withdraw.

### Wallets

- Wallet balances are ledger-derived.
- Funds have categories: pending, available, locked, reserved, and withdrawn.
- Customer-facing balances must reconcile to ledger entries.
- Negative available balances are prohibited.

### Deposits

- Deposit intent creation does not credit available balance.
- Confirmed deposits create ledger entries.
- Duplicate provider events are ignored using idempotency keys.
- Reversals and disputes create compensating ledger entries.

### Investments

- Investment starts only after funds are committed.
- Plan terms are snapshotted at commitment.
- Principal is locked while investment is active unless plan rules say otherwise.
- ROI settlement starts on the first eligible New York settlement date.
- Investment cannot be deleted after financial activity.

### ROI

- ROI is settled daily by New York calendar date.
- ROI is posted to the ledger as earned income.
- Calculations are deterministic and use integer or fixed-precision arithmetic.
- Rounding residuals are carried forward.
- Settlement can be retried safely.

### Maturity

- Maturity occurs after the final eligible ROI settlement.
- Principal release is ledger-posted.
- Final status must be auditable.

### Withdrawals

- Withdrawal requests reserve available funds.
- Approval creates a payout instruction.
- Provider success marks withdrawal paid.
- Failure creates a release or retry path.
- Every admin decision requires an audit reason.

### Referrals

- One referred customer can have at most one referrer.
- Self-referral is prohibited.
- Referral rewards require a qualifying investment event.
- Rewards are platform expenses and must not be deducted from customer principal.

## Open Assumptions To Validate

The following must be answered before production feature implementation:

- Which countries and states will the platform serve?
- Are investment products securities or otherwise regulated financial products?
- Is KYC required for all users or only before financial actions?
- Which payment rails will be used for deposits and withdrawals?
- Are returns fixed, variable, promotional, or admin-configured per plan?
- Are returns paid daily, accumulated until maturity, or both?
- Can users cancel investments early?
- Are referral rewards cash, wallet credit, percentage ROI, or fixed bonuses?
- Are there fees?
- What tax reporting is required?

## Future Roadmap

Near-term product capabilities:

- Customer onboarding.
- Wallet deposits and withdrawals.
- Investment plan catalog.
- Investment lifecycle.
- Daily ROI settlement.
- Customer dashboard.
- Admin dashboard.
- Email and in-app notifications.
- Audit logs.

Mid-term capabilities:

- KYC and AML provider integration.
- Fraud scoring.
- SMS and push notifications.
- Advanced admin reporting.
- Tax document exports.
- Multi-currency architecture if legally required.
- Customer statements.
- Webhook-based payment provider reconciliation.

Long-term capabilities:

- Mobile application.
- Banking-grade reconciliation.
- Data warehouse and BI.
- Institutional reporting.
- Multi-region deployment.
- Dedicated event bus.
- Dedicated worker fleet.
- External accountant or auditor access.
- AWS migration path with isolated services.

