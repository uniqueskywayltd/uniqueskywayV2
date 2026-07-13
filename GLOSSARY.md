# GLOSSARY.md

## Purpose

This is the definitive business glossary for Unique Sky Way V2.

Every business term used in code, documentation, UI, APIs, tests, and admin tools should use the definitions in this file. If a new term is needed, add it here before using it broadly.

## Terminology Rules

- Use one official term for each concept.
- Do not create synonyms in UI or API names without adding them here.
- Financial terms must distinguish estimates from ledger-posted facts.
- Customer-facing text may be simpler than internal language, but it must not change meaning.
- Code identifiers should prefer glossary terms where practical.

---

## Administrator

Meaning:

- A user with elevated permissions to operate or review the platform.

Purpose:

- Separates operational users from investors.

Where it is used:

- Admin dashboard, authorization, audit logs, role management.

Related terms:

- Support Agent, Finance Admin, Compliance Admin, Platform Admin, Super Admin.

## Authentication

Meaning:

- The process of proving a user's identity.

Purpose:

- Ensures only legitimate users can access accounts and admin tools.

Where it is used:

- Login, sessions, MFA, account recovery, admin access.

Related terms:

- Authorization, Session, MFA, Trusted Device.

## Authorization

Meaning:

- The process of deciding what an authenticated actor is allowed to do.

Purpose:

- Protects customer data, admin operations, and financial workflows.

Where it is used:

- Application services, route guards, RLS policies, admin permissions.

Related terms:

- Authentication, Administrator, Row Level Security, Audit Log.

## Audit Log

Meaning:

- An immutable record of security-sensitive, administrative, or financial actions.

Purpose:

- Provides accountability, investigation support, and compliance evidence.

Where it is used:

- Admin actions, KYC decisions, role changes, withdrawal review, settlement replays, ledger corrections.

Related terms:

- Business Event, Security Event, Ledger Transaction.

## Available Balance

Meaning:

- Wallet funds that are currently spendable or withdrawable according to platform rules.

Purpose:

- Tells an investor how much can be invested or withdrawn.

Where it is used:

- Customer wallet, investment creation, withdrawal request, admin user review.

Related terms:

- Wallet, Locked Balance, Pending Balance, Reserved Balance, Ledger.

## Balance Snapshot

Meaning:

- A rebuildable read model that stores a point-in-time balance derived from ledger entries.

Purpose:

- Improves read performance without replacing the ledger as source of truth.

Where it is used:

- Wallet dashboard, admin review, performance optimization.

Related terms:

- Ledger, Ledger Entry, Available Balance.

## Business Event

Meaning:

- A meaningful platform occurrence such as `investment.created`, `deposit.confirmed`, or `settlement.failed`.

Purpose:

- Communicates that something important happened and may trigger notifications, audit records, or background work.

Where it is used:

- Transactional outbox, notification system, email system, audit logs.

Related terms:

- Domain Event, Outbox Event, Notification.

## Compliance Admin

Meaning:

- An administrator responsible for KYC review, account restrictions, audit review, and suspicious activity workflows.

Purpose:

- Separates compliance authority from support and finance operations.

Where it is used:

- Admin roles, KYC workflows, account restriction, audit review.

Related terms:

- Administrator, KYC, Audit Log, Finance Admin.

## Commission

Meaning:

- A reward paid to an investor for a qualified referral, when permitted by business and compliance rules.

Purpose:

- Supports referral incentives without reducing the referred investor's principal or ROI.

Where it is used:

- Referral rewards, wallet credits, admin reporting.

Related terms:

- Referral, Referral Reward, Ledger Transaction.

## Credited ROI

Meaning:

- ROI that has been posted to the ledger and credited to the investor's wallet.

Purpose:

- Distinguishes official wallet value from estimates or unsettled earnings.

Where it is used:

- Wallet activity, investment detail, settlement history, customer statements.

Related terms:

- ROI, Daily ROI, Live Earnings, Settlement, Ledger Posting Date.

## Customer

Meaning:

- A person with a platform account. A customer becomes an investor when they use investment-related functionality.

Purpose:

- Provides a general account term for onboarding, profile, settings, and support contexts.

Where it is used:

- Authentication, profile, wallet, support, product documentation.

Related terms:

- Investor, Administrator, Customer Profile.

## Customer Profile

Meaning:

- The non-authentication account record containing customer details, onboarding status, preferences, and eligibility references.

Purpose:

- Separates product profile data from authentication credentials.

Where it is used:

- Onboarding, KYC status, settings, admin user review.

Related terms:

- Customer, KYC, Investor.

## Daily ROI

Meaning:

- The ROI amount calculated for one Earning Date according to the investment's snapshotted terms.

Purpose:

- Defines the daily return used by the settlement engine.

Where it is used:

- ROI engine, settlement items, investment detail, financial tests.

Related terms:

- ROI, Earning Date, Settlement Date, Credited ROI.

## Deposit

Meaning:

- A customer-initiated funding flow that may add money to the wallet after provider confirmation.

Purpose:

- Moves external funds into the platform.

Where it is used:

- Customer wallet, payment provider webhooks, admin deposit review.

Related terms:

- Wallet, Pending Balance, Available Balance, Payment Provider, Ledger Transaction.

## Domain Event

Meaning:

- A business event emitted by domain or application logic after meaningful state changes.

Purpose:

- Decouples core workflows from side effects.

Where it is used:

- Outbox, notification policy, email dispatch, admin alerts.

Related terms:

- Business Event, Outbox Event, Transactional Outbox.

## Email

Meaning:

- A transactional message sent to a user or administrator through the approved email provider.

Purpose:

- Delivers confirmations, security alerts, financial status updates, and operational alerts.

Where it is used:

- Email system, notifications, authentication, admin alerts.

Related terms:

- Notification, Business Event, Outbox Event.

## Earning Date

Meaning:

- The New York calendar date for which an active investment earns ROI.

Purpose:

- Defines which financial day ROI belongs to.

Where it is used:

- ROI engine, settlement items, maturity calculation, financial fixtures.

Related terms:

- Financial Day, New York Day, Settlement Date, Ledger Posting Date.

## Financial Day

Meaning:

- A calendar day measured in the `America/New_York` timezone for financial settlement purposes.

Purpose:

- Prevents ambiguity from UTC dates, server-local time, and daylight saving time.

Where it is used:

- ROI settlement, maturity, catch-up settlement, financial tests.

Related terms:

- New York Day, Earning Date, Settlement Date.

## Finance Admin

Meaning:

- An administrator responsible for financial operations such as deposit review, withdrawal review, settlement monitoring, and ledger investigation.

Purpose:

- Restricts financial authority to appropriate operational users.

Where it is used:

- Admin roles, withdrawal review, deposit review, settlement monitor.

Related terms:

- Administrator, Ledger, Withdrawal, Settlement.

## Investment

Meaning:

- A customer's committed principal placed into an active investment plan version with snapshotted terms.

Purpose:

- Represents a financial lifecycle from activation through maturity.

Where it is used:

- Customer dashboard, investment detail, settlement engine, admin investment review.

Related terms:

- Investment Cycle, Package, Principal, ROI, Maturity.

## Investment Plan

Meaning:

- A logical investment offering that may have one or more immutable versions.

Purpose:

- Groups related investment terms under a customer-facing product offering.

Where it is used:

- Plan catalog, admin plan management, investment creation.

Related terms:

- Investment Plan Version, Package, Investment.

## Investment Plan Version

Meaning:

- An immutable set of investment terms such as principal limits, term days, ROI rate, currency, and principal return policy.

Purpose:

- Preserves the exact terms used when an investment is created.

Where it is used:

- Investment creation, plan management, ROI engine, audit.

Related terms:

- Investment Plan, Investment, Principal, ROI.

## Investment Cycle

Meaning:

- The full lifecycle of an investment from activation through final settlement, maturity, and principal unlock.

Purpose:

- Defines the phases an investment passes through.

Where it is used:

- Product workflows, ROI engine, admin review, tests.

Related terms:

- Investment, Earning Date, Maturity, Principal Unlock Date.

## Investor

Meaning:

- A customer who uses the platform to fund a wallet, create investments, track ROI, request withdrawals, or participate in referrals.

Purpose:

- Defines the primary customer role.

Where it is used:

- Product documentation, UI copy, authorization, support.

Related terms:

- Customer, Administrator, Support Agent.

## KYC

Meaning:

- Know Your Customer verification or eligibility review, usually handled by a specialized provider.

Purpose:

- Supports compliance, fraud prevention, and financial access control.

Where it is used:

- Onboarding, profile status, admin compliance review.

Related terms:

- Investor, Compliance Admin, Audit Log.

## Ledger

Meaning:

- The immutable financial record made of balanced ledger transactions and entries.

Purpose:

- Acts as the source of truth for all wallet and financial balances.

Where it is used:

- Wallet, investments, deposits, withdrawals, ROI, referrals, reconciliation.

Related terms:

- Ledger Transaction, Ledger Entry, Wallet, Reconciliation.

## Ledger Entry

Meaning:

- A single debit or credit line within a ledger transaction.

Purpose:

- Records one side of a balanced financial movement.

Where it is used:

- Ledger posting engine, reconciliation, admin ledger viewer.

Related terms:

- Ledger, Ledger Transaction, Wallet.

## Ledger Posting Date

Meaning:

- The UTC timestamp when a ledger transaction is committed.

Purpose:

- Establishes when a financial value became official.

Where it is used:

- Wallet activity, settlement history, audit, reconciliation.

Related terms:

- Settlement Date, Wallet Credit Date, Credited ROI.

## Ledger Transaction

Meaning:

- An immutable balanced group of ledger entries representing one financial movement.

Purpose:

- Records financial changes such as deposit confirmation, ROI credit, withdrawal reservation, principal lock, or referral commission.

Where it is used:

- Ledger, wallet activity, admin ledger search, financial reports.

Related terms:

- Ledger Entry, Transaction, Audit Log.

## Live Earnings

Meaning:

- A customer-visible estimate of earnings that may have accumulated according to investment terms but has not necessarily been posted to the ledger.

Purpose:

- Gives investors timely visibility without pretending the estimate is official wallet money.

Where it is used:

- Customer investment detail, dashboard display, optional charts.

Related terms:

- ROI, Daily ROI, Credited ROI, Accrued ROI, Ledger.

Important rule:

- Live Earnings are not spendable and are not the source of truth.

## Locked Balance

Meaning:

- Wallet funds committed to active investments and unavailable for withdrawal.

Purpose:

- Separates invested principal from spendable funds.

Where it is used:

- Wallet dashboard, investment lifecycle, admin user review.

Related terms:

- Principal, Available Balance, Wallet, Ledger.

## Maturity

Meaning:

- The state reached after the final Earning Date has been settled and the investment term is complete.

Purpose:

- Determines when the investment ends and principal release rules are applied.

Where it is used:

- Investment lifecycle, ROI engine, notifications, admin review.

Related terms:

- Maturity Date, Principal Unlock Date, Investment Cycle.

## MFA

Meaning:

- Multi-factor authentication, an additional identity verification factor beyond password or primary login.

Purpose:

- Reduces account takeover risk, especially for administrators and high-risk actions.

Where it is used:

- Admin login, step-up authentication, trusted devices, security settings.

Related terms:

- Authentication, Session, Trusted Device.

## Maturity Date

Meaning:

- The final Earning Date in the investment term.

Purpose:

- Defines the last financial day for ROI eligibility.

Where it is used:

- Investment detail, settlement engine, customer notifications.

Related terms:

- Earning Date, Settlement Date, Principal Unlock Date.

## New York Day

Meaning:

- A calendar date in `America/New_York`.

Purpose:

- Provides the official date basis for ROI settlement.

Where it is used:

- Settlement, maturity, catch-up jobs, tests.

Related terms:

- Financial Day, Earning Date, Settlement Date.

## Notification

Meaning:

- A message delivered in-app, by email, or in the future by SMS or push.

Purpose:

- Informs investors and administrators about important events.

Where it is used:

- Notification center, email system, admin alerts.

Related terms:

- Business Event, Email, Outbox Event.

## Outbox Event

Meaning:

- A persisted event stored in the transactional outbox for asynchronous processing.

Purpose:

- Reliably connects committed database changes to side effects.

Where it is used:

- Email delivery, notifications, admin alerts, background jobs.

Related terms:

- Business Event, Domain Event, Transactional Outbox.

## Package

Meaning:

- Product-facing term for an investment offering. In technical documentation and code, prefer `Investment Plan` or `Investment Plan Version`.

Purpose:

- Gives customers a simple label for investment options while preserving precise internal modeling.

Where it is used:

- Customer-facing plan browsing and marketing copy, if approved.

Related terms:

- Investment, Investment Plan, Investment Plan Version, Principal, ROI.

## Payment Provider

Meaning:

- An external service used to process deposits, withdrawals, or payout-related events.

Purpose:

- Connects platform wallet operations to external money movement.

Where it is used:

- Deposits, withdrawals, webhooks, reconciliation.

Related terms:

- Deposit, Withdrawal, Webhook, Idempotency Key.

## Payment Provider Event

Meaning:

- A provider-originated event such as deposit confirmation, payout success, reversal, dispute, or failure.

Purpose:

- Synchronizes external payment state with platform financial workflows.

Where it is used:

- Payment webhooks, deposit lifecycle, withdrawal lifecycle, reconciliation.

Related terms:

- Payment Provider, Webhook, Idempotency Key.

## Platform Admin

Meaning:

- An administrator responsible for platform configuration, operational settings, feature flags, and technical operations.

Purpose:

- Separates platform control from support, compliance, and finance duties.

Where it is used:

- Admin roles, configuration, outbox retry, operational settings.

Related terms:

- Administrator, Super Admin, Audit Log.

## Pending Balance

Meaning:

- Funds associated with initiated but not yet confirmed deposits.

Purpose:

- Shows money in progress without making it spendable.

Where it is used:

- Wallet dashboard, deposit history, admin deposit review.

Related terms:

- Deposit, Available Balance, Wallet.

## Principal

Meaning:

- The amount of investor funds committed to an investment, excluding ROI and commissions.

Purpose:

- Defines the base amount used for investment lifecycle and ROI calculation.

Where it is used:

- Investment creation, ledger principal lock, maturity, ROI engine.

Related terms:

- Investment, Locked Balance, Principal Unlock Date, ROI.

## Principal Unlock Date

Meaning:

- The ledger posting time when locked principal is released according to the investment's terms.

Purpose:

- Defines when principal becomes available again.

Where it is used:

- Maturity processing, wallet activity, investment detail.

Related terms:

- Maturity, Maturity Date, Locked Balance, Available Balance.

## Referral

Meaning:

- An attribution relationship where one investor refers another eligible investor.

Purpose:

- Supports referral rewards and growth tracking.

Where it is used:

- Referral center, commission logic, admin reporting.

Related terms:

- Commission, Referral Reward, Investor.

## Referral Reward

Meaning:

- A ledger-backed wallet credit paid to a referrer after qualification rules are satisfied.

Purpose:

- Records referral compensation without affecting the referred investor's principal or ROI.

Where it is used:

- Referral system, wallet activity, admin reporting.

Related terms:

- Referral, Commission, Ledger Transaction.

## Reconciliation

Meaning:

- The process of proving that ledger records, wallet balances, provider events, and admin reports agree.

Purpose:

- Detects financial inconsistencies and supports recovery.

Where it is used:

- Operations, testing, production certification, incident response.

Related terms:

- Ledger, Balance Snapshot, Payment Provider.

## Reserved Balance

Meaning:

- Wallet funds held for a pending withdrawal or other temporary hold.

Purpose:

- Prevents the same available funds from being withdrawn or invested twice.

Where it is used:

- Withdrawal requests, wallet dashboard, admin review.

Related terms:

- Available Balance, Withdrawal, Wallet.

## ROI

Meaning:

- Return on investment calculated according to the investment's snapshotted terms.

Purpose:

- Defines the customer's investment return behavior.

Where it is used:

- Investment plans, investment detail, settlement engine, financial reports.

Related terms:

- Daily ROI, Credited ROI, Live Earnings, Accrued ROI.

## Accrued ROI

Meaning:

- ROI that is associated with an Earning Date but has not yet been credited to the wallet.

Purpose:

- Distinguishes earned or estimated return from ledger-posted wallet money.

Where it is used:

- Internal financial reasoning, investment detail, settlement previews.

Related terms:

- Live Earnings, Credited ROI, Settlement.

## Accrued Interest

Meaning:

- A legally sensitive synonym sometimes used in finance for return that has accrued but not yet been paid.

Purpose:

- Exists in this glossary to prevent accidental misuse.

Where it is used:

- Avoid in product UI and code unless legal/compliance explicitly requires interest terminology.

Related terms:

- Accrued ROI, ROI, Credited ROI.

## Settlement

Meaning:

- The process that calculates and posts ROI for one or more Earning Dates.

Purpose:

- Converts eligible ROI into official ledger-backed wallet credit.

Where it is used:

- ROI engine, settlement jobs, admin settlement monitor.

Related terms:

- Settlement Date, Earning Date, Ledger Posting Date.

## Settlement Date

Meaning:

- The New York calendar date being settled.

Purpose:

- Identifies which financial day a settlement item belongs to.

Where it is used:

- Settlement runs, settlement items, investment history.

Related terms:

- Earning Date, Financial Day, Ledger Posting Date.

## Support Agent

Meaning:

- An administrator with limited support permissions.

Purpose:

- Allows customer assistance without broad financial or platform control.

Where it is used:

- Admin roles, support workflows, audit logs.

Related terms:

- Administrator, Investor, Audit Log.

## Transaction

Meaning:

- A generic event or action. For financial records, use the precise term `Ledger Transaction`.

Purpose:

- Avoids ambiguity between HTTP requests, provider events, database transactions, and financial ledger transactions.

Where it is used:

- UI copy only when the context is obvious; code should prefer precise names.

Related terms:

- Ledger Transaction, Database Transaction, Payment Provider Event.

## Transactional Outbox

Meaning:

- A database-backed pattern where events are written in the same transaction as business state changes and processed asynchronously.

Purpose:

- Prevents side effects from becoming inconsistent with committed state.

Where it is used:

- Notifications, email, admin alerts, provider side effects.

Related terms:

- Outbox Event, Business Event, Domain Event.

## Trusted Device

Meaning:

- A user-approved device record that can reduce friction for future step-up authentication.

Purpose:

- Balances security and usability.

Where it is used:

- Sessions, step-up authentication, security notifications.

Related terms:

- Session, MFA, Security Event.

## Wallet

Meaning:

- The customer-facing view of funds derived from ledger accounts.

Purpose:

- Shows available, pending, locked, reserved, and historical withdrawn funds.

Where it is used:

- Customer dashboard, investment creation, withdrawals, admin user review.

Related terms:

- Ledger, Available Balance, Pending Balance, Locked Balance, Reserved Balance.

## Wallet Credit Date

Meaning:

- The time when a ledger posting makes funds available in the wallet.

Purpose:

- Defines when credited ROI, deposits, commissions, or principal releases become spendable.

Where it is used:

- Wallet activity, settlement, maturity, referral rewards.

Related terms:

- Ledger Posting Date, Available Balance, Credited ROI.

## Withdrawal

Meaning:

- A customer request to move available wallet funds out of the platform.

Purpose:

- Allows investors to receive funds according to platform and provider rules.

Where it is used:

- Customer wallet, admin review, payment provider payouts.

Related terms:

- Available Balance, Reserved Balance, Payment Provider, Ledger Transaction.

## Webhook

Meaning:

- A provider-initiated HTTP event sent to the platform.

Purpose:

- Communicates external state changes such as payment confirmation, payout status, email delivery, or KYC updates.

Where it is used:

- Payment provider events, Resend delivery events, KYC provider updates.

Related terms:

- Payment Provider, Idempotency Key, Business Event.

## Idempotency Key

Meaning:

- A unique key used to ensure retrying the same operation does not create duplicate effects.

Purpose:

- Protects financial actions, webhooks, jobs, and email sends from duplicate processing.

Where it is used:

- Deposits, withdrawals, ledger postings, settlements, provider webhooks, email dispatch.

Related terms:

- Webhook, Ledger Transaction, Transactional Outbox.

## Database Transaction

Meaning:

- A database unit of work that commits or rolls back atomically.

Purpose:

- Ensures related financial and workflow records remain consistent.

Where it is used:

- Ledger posting, investment creation, settlement, withdrawal reservation.

Related terms:

- Ledger Transaction, Repository, Service Layer.

## Repository

Meaning:

- A persistence boundary that exposes business-oriented database operations.

Purpose:

- Keeps application services independent from database implementation details.

Where it is used:

- Infrastructure database layer, application service dependencies.

Related terms:

- Service Layer, Drizzle ORM, Database Transaction.

## Service Layer

Meaning:

- The application layer that orchestrates use cases, authorization, transactions, repositories, domain logic, and outbox events.

Purpose:

- Provides one clear home for business workflows.

Where it is used:

- Investment creation, settlement, withdrawal review, referral rewards.

Related terms:

- Repository, Domain Model, Business Event.

## Drizzle ORM

Meaning:

- The selected TypeScript database access layer for PostgreSQL.

Purpose:

- Provides typed SQL-oriented database access without hiding SQL behavior.

Where it is used:

- Infrastructure repositories, migrations or schema definitions where adopted.

Related terms:

- Repository, PostgreSQL, Supabase.

## Row Level Security

Meaning:

- PostgreSQL policy enforcement that restricts row access based on database policies.

Purpose:

- Provides defense in depth for customer-accessible data.

Where it is used:

- Supabase database tables exposed to authenticated users.

Related terms:

- Authorization, Supabase, Service Role Key.

## Session

Meaning:

- An authenticated user state used to access the platform.

Purpose:

- Allows secure continuity between requests.

Where it is used:

- Customer app, admin app, authorization, step-up authentication.

Related terms:

- Trusted Device, MFA, Authentication.

## Security Event

Meaning:

- A recorded security-relevant occurrence such as login failure, MFA change, trusted device change, rate limit hit, or suspicious activity.

Purpose:

- Supports account protection, monitoring, audit, and incident response.

Where it is used:

- Security logs, audit review, admin operations, account recovery.

Related terms:

- Audit Log, Authentication, Session, Trusted Device.

## Super Admin

Meaning:

- A highly restricted administrator role with authority over role management and emergency controls.

Purpose:

- Provides controlled access to the most sensitive administrative capabilities.

Where it is used:

- Role grants, break-glass operations, emergency administration.

Related terms:

- Administrator, Platform Admin, Audit Log.
