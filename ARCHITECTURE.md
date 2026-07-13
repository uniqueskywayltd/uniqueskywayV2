# ARCHITECTURE.md

## Purpose

This document defines the technical architecture for Unique Sky Way V2.

This architecture is a greenfield design. It does not inherit structure, services, controllers, middleware, helpers, auth, routes, or state management from any previous Unique Sky Way codebase.

## Recommended Architectural Style

Unique Sky Way V2 should use a modular monolith with strong domain boundaries.

Recommended initial stack:

- Next.js App Router for the web application.
- React Server Components by default.
- TypeScript for all application code.
- PostgreSQL through Supabase for the system of record.
- Supabase Auth and Row Level Security where appropriate.
- Resend for transactional email.
- A transactional outbox for domain events.
- Background jobs that are idempotent and database-coordinated.

## Why Modular Monolith

Options considered:

### Distributed microservices

Benefits:

- Independent deployment per service.
- Clear operational ownership at very large scale.
- Specialized runtime choices.

Trade-offs:

- More infrastructure before the domain is stable.
- Harder financial transaction consistency.
- More distributed failure modes.
- More expensive observability, testing, and deployment.

### Traditional layered monolith

Benefits:

- Simple to build.
- Easy deployment.

Trade-offs:

- Domain logic often leaks into routes and UI.
- Generic services become dumping grounds.
- Financial workflows become harder to reason about over time.

### Modular monolith

Benefits:

- One deployable application while the product is young.
- Strong domain separation without distributed complexity.
- Easier financial transactions and testing.
- Clear path to extract services later if needed.

Recommendation:

Use a modular monolith. It gives the platform Stripe-like discipline without prematurely creating Stripe-like infrastructure.

## Application Layers

The application should be organized into explicit layers.

### 1. Interface Layer

Responsibilities:

- Next.js pages, layouts, route handlers, and server actions.
- Request parsing.
- Response formatting.
- Authentication boundary checks.
- Calling application services.

Rules:

- No financial calculations.
- No direct database writes except through approved service/repository paths.
- No business workflows in React components.

### 2. Application Layer

Responsibilities:

- Use cases and workflows.
- Transaction boundaries.
- Permission checks after identity is known.
- Idempotency handling.
- Calling domain services and repositories.
- Emitting domain events.

Examples:

- `CreateInvestment`.
- `RequestWithdrawal`.
- `RunDailySettlement`.
- `ApproveDeposit`.
- `CreditReferralReward`.

Rules:

- Coordinates domain behavior.
- Does not contain UI logic.
- Does not depend on Next.js APIs.

### 3. Domain Layer

Responsibilities:

- Business rules.
- Entity state machines.
- Value objects.
- Domain policies.
- Financial formulas.

Examples:

- Investment status transitions.
- ROI eligibility.
- Rounding policy.
- Wallet posting rules.
- Referral eligibility.

Rules:

- No database client imports.
- No HTTP imports.
- No framework imports.
- Deterministic functions whenever possible.

### 4. Infrastructure Layer

Responsibilities:

- Database access.
- Supabase client wrappers.
- Email provider adapter.
- Payment provider adapter.
- File storage adapter.
- Clock implementation.
- Queue or job runner implementation.

Rules:

- Implements ports defined by application/domain layers.
- Provider-specific details stay here.

### 5. Presentation Components

Responsibilities:

- Customer and admin UI.
- Reusable components.
- Formatting display values.
- Client-only interaction.

Rules:

- Server Components are default.
- Client Components are used only for interactivity.
- No direct secret access.
- No financial source-of-truth logic.

## Dependency Rules

Dependencies flow inward:

- UI depends on application services.
- Application depends on domain and repository interfaces.
- Domain depends on nothing external.
- Infrastructure depends on domain/application contracts.

Prohibited dependencies:

- Domain importing database clients.
- Domain importing Next.js or React.
- UI importing provider SDKs directly.
- Route handlers writing ledger entries directly.
- Email templates querying the database.

## Domain Boundaries

The platform should be divided into domains with clear ownership.

### Identity and Access

Owns:

- User identity mapping.
- Roles.
- Sessions.
- Trusted devices.
- Account restrictions.

Does not own:

- Customer profile details beyond identity linkage.
- Wallet or investment status.

### Customer Profile

Owns:

- Customer details.
- Preferences.
- Terms acceptance.
- KYC status references.

Does not own:

- Authentication credentials.
- Ledger balances.

### Investment Plans

Owns:

- Plan definitions.
- Plan versions.
- Availability windows.
- ROI terms.
- Lockup and maturity terms.

Does not own:

- Customer investments after terms are snapshotted.

### Investments

Owns:

- Customer investment lifecycle.
- Principal commitment.
- Active and matured status.
- ROI eligibility.

Does not own:

- Ledger posting implementation.
- Payment provider state.

### Wallet and Ledger

Owns:

- Accounts.
- Ledger transactions.
- Ledger entries.
- Balance derivation.
- Reconciliation primitives.

This is the financial source of truth.

### Settlement

Owns:

- Daily ROI settlement runs.
- New York settlement dates.
- Catch-up behavior.
- Settlement idempotency.

### Payments

Owns:

- Deposit intents.
- Payment provider events.
- Withdrawal payout instructions.
- Provider reconciliation.

Does not own:

- Wallet balances except through ledger postings.

### Referrals

Owns:

- Referral codes.
- Referral attribution.
- Reward eligibility.
- Reward settlement events.

### Notifications

Owns:

- In-app notifications.
- Email dispatch requests.
- Future SMS and push dispatch requests.
- Delivery status.

### Admin and Audit

Owns:

- Admin actions.
- Audit logs.
- Operational notes.
- Risk flags.

## Server and Client Philosophy

Server-first is the default.

Use Server Components for:

- Dashboards.
- Investment detail pages.
- Wallet transaction history.
- Admin list and detail pages.
- Read-heavy screens.

Use Client Components for:

- Forms with rich interaction.
- Modals.
- Filters that update without navigation.
- Charts that require browser APIs.
- Upload widgets.
- Step-up authentication prompts.

Use Route Handlers for:

- Webhooks.
- External API endpoints.
- Health checks.
- File upload signing.
- Provider callbacks.

Use Server Actions for:

- First-party form mutations where progressive enhancement and framework semantics are useful.

Rule:

Critical financial mutations must still enter application services with idempotency, authorization, and transaction boundaries. The transport mechanism must not define the business rule.

## Event Architecture

Unique Sky Way V2 should use a transactional outbox pattern.

When a use case changes financial or workflow state, it should:

1. Write domain changes inside a database transaction.
2. Write an outbox event in the same transaction.
3. Commit.
4. Let a worker deliver side effects such as email, notification, provider calls, or analytics.

Why:

- Prevents sending emails for rolled-back transactions.
- Allows retries.
- Gives admins visibility into stuck side effects.
- Makes future queue migration possible.

Initial event transport:

- PostgreSQL `outbox_events` table.
- Worker loop or scheduled job processes pending events.
- Event handlers are idempotent.

Future event transport:

- Dedicated queue such as SQS, Cloud Tasks, Trigger.dev, Inngest, or a provider-specific worker queue.
- Same domain event contracts.

## Repository Pattern

Use repositories for persistence boundaries, not as generic CRUD wrappers.

Recommended repositories:

- `UserRepository`.
- `CustomerProfileRepository`.
- `InvestmentPlanRepository`.
- `InvestmentRepository`.
- `LedgerRepository`.
- `SettlementRepository`.
- `PaymentRepository`.
- `ReferralRepository`.
- `NotificationRepository`.
- `AuditRepository`.

Rules:

- Repositories expose business-oriented methods.
- Repositories do not return provider-specific response shapes.
- Repositories do not decide business policy.
- Repository methods that participate in financial workflows must support transaction context.

Example repository methods:

- `findActiveInvestmentsEligibleForSettlement(settlementDate)`.
- `appendBalancedLedgerTransaction(command)`.
- `markSettlementRunCompleted(runId)`.
- `findWithdrawalForReview(id)`.

## Service Layer

Application services implement use cases.

Examples:

- `InvestmentApplicationService`.
- `WalletApplicationService`.
- `SettlementApplicationService`.
- `ReferralApplicationService`.
- `AdminApplicationService`.
- `NotificationApplicationService`.

Rules:

- Services must have clear command inputs and result outputs.
- Services must not return raw database rows.
- Services must enforce authorization or require the caller to pass an authorization decision object.
- Services must use idempotency keys for externally triggered or retryable mutations.

## Financial Transaction Boundaries

Financial writes should be database transactions.

Required transaction groups:

- Deposit confirmation plus ledger credit plus outbox event.
- Investment creation plus principal lock plus outbox event.
- Daily ROI settlement plus ledger credit plus settlement item record.
- Withdrawal request plus funds reservation.
- Withdrawal rejection plus funds release.
- Maturity plus principal release plus final status.
- Referral reward plus ledger credit plus notification event.

## Time Philosophy

Store timestamps in UTC.

Store settlement dates as New York calendar dates where business rules require them.

Rules:

- Never infer settlement date from server local timezone.
- Use `America/New_York` for daily ROI eligibility.
- Persist the settlement date separately from execution timestamp.
- Inject a clock into domain/application services for testability.

## Authentication and Authorization

Authentication should be delegated to a managed provider. For this architecture, Supabase Auth is recommended initially because it integrates with Supabase Postgres and Row Level Security.

Authorization should be application-owned:

- Customer can access only their own resources.
- Admin permissions are role-based.
- Sensitive admin actions require explicit permission and audit reason.
- Financial state changes require server-side authorization.

Database RLS should provide defense in depth, not replace application authorization.

## Error Handling

Errors should be typed and mapped at the interface boundary.

Error families:

- Validation errors.
- Authentication errors.
- Authorization errors.
- Not found errors.
- Conflict or invalid state errors.
- Idempotency replay errors.
- Provider errors.
- Financial integrity errors.
- Internal errors.

Rules:

- Do not expose provider secrets or stack traces to users.
- Log full diagnostic details server-side with correlation IDs.
- Financial integrity errors must page or alert operations.

## Observability

The platform should emit structured logs and metrics for:

- Auth failures.
- Rate limit events.
- Deposit and withdrawal state changes.
- Settlement run start, success, failure, and duration.
- Ledger transaction creation.
- Outbox processing.
- Email delivery status.
- Webhook processing.
- Admin actions.

Required identifiers:

- `request_id`.
- `actor_id`.
- `user_id` when applicable.
- `admin_id` when applicable.
- `investment_id`.
- `ledger_transaction_id`.
- `settlement_run_id`.
- `provider_event_id`.

## Testing Philosophy

Testing should focus on business risk.

Highest priority:

- Ledger balancing.
- ROI calculation.
- Settlement idempotency.
- Catch-up settlement.
- Investment maturity.
- Withdrawal reservation and release.
- Referral eligibility.
- Authorization.

Testing layers:

- Unit tests for pure domain logic.
- Integration tests for repositories and database constraints.
- Use case tests for application services.
- API contract tests for route handlers.
- End-to-end tests for critical customer and admin journeys.
- Regression fixtures for financial examples.

## Architectural Decisions

### Decision 1: Use a modular monolith

Reason:

The platform needs strong consistency and rapid evolution more than independent service deployment at the start.

### Decision 2: Keep domain logic framework-free

Reason:

Investment and ledger logic should survive framework changes and be easy to test.

### Decision 3: Use ledger as source of truth

Reason:

Balances that cannot be reconstructed are not trustworthy.

### Decision 4: Use transactional outbox

Reason:

Email, notifications, and provider calls must not be coupled to uncommitted database changes.

### Decision 5: Use New York calendar dates for settlement

Reason:

The business rule explicitly requires a New York settlement model. UTC timestamps alone cannot express that correctly.

### Decision 6: Avoid provider lock-in at domain boundaries

Reason:

Supabase, Resend, payment providers, and hosting may change. Domain behavior should not.

## References

- Next.js App Router and Server Components: https://nextjs.org/docs/app
- Next.js Route Handlers: https://nextjs.org/docs/app/getting-started/route-handlers
- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Postgres auditing with PGAudit: https://supabase.com/docs/guides/database/extensions/pgaudit

