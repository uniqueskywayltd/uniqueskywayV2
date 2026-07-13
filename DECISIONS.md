# DECISIONS.md

## Purpose

This is the permanent engineering decision log for Unique Sky Way V2.

It records major architectural, product, financial, security, and operational decisions. The goal is to preserve institutional memory so future engineers understand not only what was decided, but why it was decided.

This document is append-only. Do not delete or rewrite historical decisions. If a decision changes, append a new decision that supersedes the old one.

## Decision Rules

- Decisions are appended chronologically.
- Decision IDs must remain stable.
- A superseded decision must link to the superseding decision.
- Major changes to financial logic, authentication, database structure, deployment, or domain boundaries require a decision entry before implementation.
- Pull requests that introduce major behavior without updating this file should not be merged.

## Decision Template

```text
## DEC-0000: Title

- Date:
- Status:
- Future Review:

### Context

### Decision

### Alternatives Considered

### Reason for Choosing It

### Consequences
```

Statuses:

- `Accepted`: current active decision.
- `Superseded`: replaced by a later decision.
- `Deprecated`: still present but should not be used for new work.
- `Proposed`: not yet binding.

---

## DEC-0001: Greenfield V2 Rewrite

- Date: 2026-07-12
- Status: Accepted
- Future Review: None unless the project scope changes.

### Context

The previous Unique Sky Way project exists as business reference only. It must not define V2 architecture, routing, services, middleware, authentication, helpers, utilities, state management, or folder structure.

### Decision

Unique Sky Way V2 is a complete greenfield rewrite.

The old project may be referenced only for business rules, product behavior, and workflow discovery after those rules are intentionally revalidated.

### Alternatives Considered

- Refactor the previous project.
- Incrementally migrate old modules into a new repository.
- Fork the old project and replace pieces over time.

### Reason for Choosing It

An investment platform must be financially correct, secure, maintainable, and auditable. Carrying forward unknown architectural debt would compromise those goals.

### Consequences

- No production code is copied from the old system.
- V2 architecture must stand on its own.
- Business workflows must be documented before implementation.
- Initial development is slower, but long-term maintainability improves.

---

## DEC-0002: Engineering Constitution

- Date: 2026-07-12
- Status: Accepted
- Future Review: Review at the end of every major product phase.

### Context

The platform is expected to be maintained by multiple senior engineers over many years. Without permanent governance, architectural consistency and institutional knowledge will decay.

### Decision

The repository will maintain permanent constitution documents:

- Product and architecture documents.
- Financial engine documentation.
- Security, performance, deployment, and testing standards.
- This decision log.
- A definitive glossary.
- A contributor guide.

### Alternatives Considered

- Keep decisions only in pull request discussions.
- Keep informal notes outside the repository.
- Rely on code structure alone to communicate architecture.

### Reason for Choosing It

Financial platforms need explicit institutional memory. Critical choices should remain discoverable after teams, vendors, and deployment environments change.

### Consequences

- Documentation updates are required for meaningful behavior changes.
- Code review must include governance review.
- Future contributors have a stable source of truth.

---

## DEC-0003: One Source Of Truth Philosophy

- Date: 2026-07-12
- Status: Accepted
- Future Review: None.

### Context

Financial ambiguity creates user harm, support burden, and audit risk. Customer-visible balances, ROI, maturity, referrals, and withdrawals must be explainable.

### Decision

Every important concept must have one authoritative source:

- Financial balances come from the ledger.
- Investment behavior comes from snapshotted plan terms.
- Settlement history comes from settlement records and ledger transactions.
- Terminology comes from `GLOSSARY.md`.
- Major engineering decisions come from `DECISIONS.md`.
- Product behavior comes from product and architecture documents.

### Alternatives Considered

- Store mutable wallet balances as primary truth.
- Recalculate customer-facing values ad hoc in the UI.
- Let each feature define its own terminology.

### Reason for Choosing It

The platform must be auditable and understandable. One source of truth prevents subtle divergence between screens, APIs, jobs, and admin tools.

### Consequences

- Derived read models are allowed only when rebuildable.
- UI estimates must be labeled and must not override persisted financial records.
- Duplicate concepts require explicit justification.

---

## DEC-0004: Server-First Architecture

- Date: 2026-07-12
- Status: Accepted
- Future Review: Review if the platform adds a native mobile app or heavy real-time interfaces.

### Context

The application will include dashboards, transaction history, investment detail pages, admin review queues, and financial workflows. These are data-heavy and security-sensitive.

### Decision

The web application will use a server-first architecture with Next.js App Router and React Server Components by default.

Client Components are reserved for browser-only interactivity such as forms, modals, charts, upload widgets, optimistic UI where safe, and interactive filters.

### Alternatives Considered

- Client-heavy single page application.
- Traditional server-rendered app without React Server Components.
- Pages Router architecture.

### Reason for Choosing It

Server-first rendering reduces client JavaScript, keeps secrets server-side, improves authenticated dashboard performance, and aligns with the need for secure financial data access.

### Consequences

- Components are server components unless they need browser APIs or client state.
- Provider SDKs and secrets must never enter client bundles.
- Interactive UI requires explicit client boundaries.

---

## DEC-0005: Modular Monolith

- Date: 2026-07-12
- Status: Accepted
- Future Review: Review when independent deployability becomes more valuable than transactional simplicity.

### Context

The platform needs strong financial consistency, rapid iteration, and clear domain boundaries. It does not yet require separately deployed services.

### Decision

Unique Sky Way V2 will begin as a modular monolith with explicit domain boundaries.

### Alternatives Considered

- Distributed microservices.
- Traditional layered monolith.
- Serverless functions without strong domain organization.

### Reason for Choosing It

A modular monolith preserves transaction simplicity and maintainability while avoiding premature distributed systems complexity.

### Consequences

- Domains remain separated in code.
- Shared database transactions are available for financial workflows.
- Future service extraction remains possible if boundaries stay clean.

---

## DEC-0006: Supabase And PostgreSQL As System Of Record

- Date: 2026-07-12
- Status: Accepted
- Future Review: Review before any major provider migration or compliance-driven infrastructure change.

### Context

The platform needs relational integrity, transactions, constraints, auditability, and a path to Row Level Security.

### Decision

The system of record will be PostgreSQL through Supabase.

Supabase Auth and Row Level Security may be used where appropriate, but application services remain responsible for business authorization.

### Alternatives Considered

- Firebase or document storage.
- MySQL.
- Self-managed PostgreSQL from day one.
- Payment-provider-led balance storage.

### Reason for Choosing It

PostgreSQL supports relational integrity, transactional financial workflows, constraints, indexes, locking, and mature operational practices. Supabase provides managed Postgres, Auth, Storage, RLS, and operational tooling suitable for the initial platform.

### Consequences

- Database constraints are part of the architecture.
- RLS is defense in depth, not the only authorization layer.
- Supabase service role keys are server-only.
- A future migration must preserve ledger and audit history.

---

## DEC-0007: Drizzle ORM

- Date: 2026-07-12
- Status: Accepted
- Future Review: Review after the first production financial workflows are implemented.

### Context

The application needs typed database access without hiding SQL or adding heavy runtime behavior. Financial correctness depends on clear queries, explicit transactions, and predictable migrations.

### Decision

Use Drizzle ORM for application database access.

Drizzle must be used as a typed SQL layer, not as a place to hide business rules. Financial invariants remain enforced by domain logic, application services, database constraints, and the ledger posting engine.

### Alternatives Considered

- Raw SQL only.
- Prisma.
- TypeORM, Sequelize, or other heavy ORMs.
- Supabase JavaScript client as the primary server-side data access layer.

### Reason for Choosing It

Drizzle is lightweight, TypeScript-friendly, close to SQL, and compatible with server-first application architecture. It gives engineers typed query construction while preserving visibility into database behavior.

### Consequences

- Engineers must understand SQL and query plans.
- Migrations require review; financial migrations must not be generated blindly.
- Database access belongs in repositories and infrastructure code.
- Drizzle types do not replace domain models.

---

## DEC-0008: Ledger-First Financial Model

- Date: 2026-07-12
- Status: Accepted
- Future Review: None unless accounting requirements change.

### Context

Wallet balances, deposits, withdrawals, ROI, referrals, reversals, maturity, and corrections must be auditable and reconstructable.

### Decision

Use a ledger-first financial model with one approved posting engine.

All financial movement must be represented as immutable ledger transactions and ledger entries. Wallet balances are derived from ledger accounts or rebuildable snapshots, never updated directly as source of truth.

### Alternatives Considered

- Mutable wallet balance columns.
- Single-entry transaction history.
- Provider balance as source of truth.
- UI-level balance calculation.

### Reason for Choosing It

Ledger-first design is the only acceptable model for a financial platform that needs auditability, recovery, reversals, reconciliation, and support for future accounting requirements.

### Consequences

- Financial corrections use compensating entries.
- Ledger entries are append-only.
- Posting must be idempotent.
- Concurrent financial actions must use database transactions and locking.
- No feature may bypass the posting engine.

---

## DEC-0009: New York Settlement Model

- Date: 2026-07-12
- Status: Accepted
- Future Review: Review only if business terms or jurisdiction change.

### Context

The business requires daily ROI settlement based on a New York calendar. UTC timestamps alone cannot express the financial day correctly, especially around daylight saving time.

### Decision

Use `America/New_York` as the official financial timezone.

Official terms:

- Investment Activation Time: the UTC timestamp when principal is locked and the investment becomes active.
- Earning Date: the New York calendar date for which ROI is earned.
- Settlement Date: the New York calendar date being settled.
- Ledger Posting Date: the UTC timestamp when the ledger transaction is committed.
- Wallet Credit Date: the time ROI becomes available in the wallet; this is the ledger posting time.
- Maturity Date: the final Earning Date in the investment term.
- Principal Unlock Date: the ledger posting time when principal is moved from locked to available.

Rule:

- An investment activated on New York date `D` starts earning on New York date `D + 1`.
- ROI for an Earning Date is eligible to be posted only after that New York day has completed.
- The scheduled settlement job runs after New York midnight and settles all unsettled Earning Dates earlier than the current New York date.
- No same-day ROI is credited unless a future plan version explicitly defines a different rule.

### Alternatives Considered

- UTC calendar settlement.
- Server-local timezone settlement.
- Same-day partial ROI.
- Continuous real-time ROI crediting.

### Reason for Choosing It

New York dates match the business requirement and avoid ambiguity around midnight and daylight saving time. Posting after the earning day completes prevents customers from receiving same-day ROI for late-day investments.

### Consequences

- Settlement records must store New York dates separately from UTC timestamps.
- Tests must include DST boundaries.
- Live earnings are display estimates only until posted to the ledger.
- Maturity occurs after the final Earning Date has been settled and principal release is posted.

---

## DEC-0010: Transactional Outbox

- Date: 2026-07-12
- Status: Accepted
- Future Review: Review when moving to a dedicated queue.

### Context

Financial workflows trigger side effects such as emails, in-app notifications, provider calls, analytics, and admin alerts. Side effects must not fire for rolled-back database transactions.

### Decision

Use a transactional outbox.

Domain and workflow changes are committed in the same database transaction as outbox events. Workers process outbox events asynchronously and idempotently.

### Alternatives Considered

- Send email and notifications directly inside request handlers.
- Publish to an external queue without local transactional capture.
- Poll domain tables for changes.

### Reason for Choosing It

The outbox pattern preserves consistency between state changes and side effects while allowing retries and future queue migration.

### Consequences

- Outbox lag must be monitored.
- Handlers must be idempotent.
- Failed events must be visible to admins.
- Future queues must preserve event contracts.

---

## DEC-0011: Event-Driven Notifications

- Date: 2026-07-12
- Status: Accepted
- Future Review: Review when SMS or push channels are implemented.

### Context

The platform needs in-app notifications, email, and future SMS/push without coupling product workflows to provider APIs.

### Decision

Notifications are driven by business events.

Notification policy maps events to channels. Channel dispatch is asynchronous and idempotent.

### Alternatives Considered

- Direct email calls from services.
- UI-generated notifications.
- Provider-specific notification logic in domain workflows.

### Reason for Choosing It

Event-driven notifications keep financial state independent from delivery failures and make future channels easier to add.

### Consequences

- Notification templates receive prepared data.
- Delivery failures do not roll back financial state.
- Critical admin alerts require escalation rules.

---

## DEC-0012: Repository Pattern

- Date: 2026-07-12
- Status: Accepted
- Future Review: Review if repository boundaries become overly generic.

### Context

Database access must remain organized and testable. Route handlers, React components, and domain code should not know query details.

### Decision

Use repositories as persistence boundaries.

Repositories expose business-oriented persistence methods and hide Drizzle/Supabase-specific shapes from application services.

### Alternatives Considered

- Direct database access from route handlers.
- Generic CRUD services.
- Active Record-style domain objects.

### Reason for Choosing It

Repositories keep data access consistent while allowing domain logic to remain framework-free and database-agnostic.

### Consequences

- Repositories must not decide business policy.
- Financial repositories must accept transaction context.
- Raw database rows should not leak into application responses.

---

## DEC-0013: Service Layer

- Date: 2026-07-12
- Status: Accepted
- Future Review: Review as workflow complexity grows.

### Context

Financial and admin workflows require authorization, validation, idempotency, transactions, domain rules, repository calls, and outbox events.

### Decision

Use application services for use cases.

Examples include creating investments, requesting withdrawals, approving withdrawals, running settlement, confirming deposits, and posting referral rewards.

### Alternatives Considered

- Business logic in route handlers.
- Business logic in React Server Components.
- Business logic embedded in repositories.

### Reason for Choosing It

Application services provide a clear home for workflow orchestration while keeping domain logic pure and infrastructure details isolated.

### Consequences

- Route handlers and server actions stay thin.
- Authorization happens in or before application services.
- Financial services define transaction boundaries.

---

## DEC-0014: Managed Authentication With Application-Owned Authorization

- Date: 2026-07-12
- Status: Accepted
- Future Review: Review if enterprise SSO or advanced compliance requirements appear.

### Context

Custom authentication creates unnecessary risk. Authorization, however, must reflect platform-specific financial and admin rules.

### Decision

Use managed authentication initially through Supabase Auth.

Application services own authorization decisions. RLS provides defense in depth for customer-accessible data.

### Alternatives Considered

- Custom password authentication.
- NextAuth-style self-managed auth.
- Enterprise auth provider from day one.

### Reason for Choosing It

Managed auth reduces credential risk, while application-owned authorization preserves precise control over financial permissions.

### Consequences

- Admin MFA is required.
- Financial actions require server-side permission checks.
- RLS cannot be the only authorization mechanism.
- Auth provider migration remains possible.

---

## DEC-0015: Platform-Independent Deployment

- Date: 2026-07-12
- Status: Accepted
- Future Review: Review before production launch and before each hosting migration.

### Context

The platform may begin on current hosting and later move to VPS, Docker, AWS, Hetzner, DigitalOcean, Coolify, Cloudflare, or another environment.

### Decision

Business logic must be platform-independent.

Hosting-specific concerns belong in infrastructure, deployment scripts, scheduler adapters, worker configuration, and environment configuration. Domain logic, application services, financial rules, and settlement behavior must not depend on hosting provider features.

### Alternatives Considered

- Design around one hosting provider from day one.
- Use provider-specific serverless features directly in domain workflows.
- Delay deployment design until after implementation.

### Reason for Choosing It

The platform needs portability, operational resilience, and a migration path as scale and compliance needs change.

### Consequences

- Background jobs must be idempotent and database-coordinated.
- Scheduler identity must be explicit.
- Environment variables must be validated.
- Deployment changes must not alter financial behavior.

---

## DEC-0016: Certified Investment Engine Lock

- Date: 2026-07-13
- Status: Accepted
- Future Review: Review only when a critical defect, security issue, or accepted product change requires investment engine modification.

### Context

Phase 6 certified the investment engine through mathematics, concurrency, recovery, performance, architecture, and documentation review. The engine is now the trusted core that future money movement features will compose with.

Changing certified ROI, settlement, maturity, or principal lifecycle behavior casually would weaken the strongest guarantee in V2.

### Decision

The `v2.1.0` investment engine is locked.

Allowed changes:

- Bug fixes.
- Security fixes.
- Performance improvements.
- Test improvements.
- Documentation clarifications that do not change behavior.

Business rule changes require:

- An accepted ADR.
- Updated financial invariants or payment architecture where applicable.
- Updated regression tests.
- Updated certification evidence.
- Recertification before merge.

### Alternatives Considered

- Allow Phase 7 money movement to freely modify investment services.
- Rely on code review without a formal lock rule.
- Delay the lock until production launch.

### Reason for Choosing It

Money movement should connect to a trusted investment engine, not reshape it. Locking the certified engine keeps Phase 7 focused on deposits, withdrawals, providers, webhooks, and ledger integration.

### Consequences

- Phase 7 may call investment services only through approved contracts.
- ROI formula changes, settlement rule changes, maturity rule changes, and investment lifecycle changes require formal review.
- Future teams have a clear boundary between investment correctness and payment orchestration.

---

## DEC-0017: Payment Architecture Before Money Movement

- Date: 2026-07-13
- Status: Accepted
- Future Review: Review after the first production payment provider is selected and after Phase 7 certification.

### Context

Phase 7 will introduce real money movement through deposits, withdrawals, provider events, webhook verification, ledger postings, admin review, notifications, and reconciliation. These flows are externally influenced and failure-prone.

Without a payment-specific constitution, implementation details could drift into provider-specific shortcuts or ambiguous ledger behavior.

### Decision

`PAYMENT_ARCHITECTURE.md` is required before Phase 7 production code begins.

The document defines:

- Provider approval rules.
- Deposit and withdrawal state machines.
- Webhook lifecycle.
- Ledger posting sequences.
- Idempotency requirements.
- Approval and permission rules.
- Failure recovery.
- Retry strategy.
- Audit events.
- Email and notification events.
- Phase 7 launch gates.

Concrete production provider selection requires a separate accepted ADR.

### Alternatives Considered

- Choose a provider first and document the architecture afterward.
- Implement provider-specific flows directly in application services.
- Treat database status enums as sufficient design documentation.

### Reason for Choosing It

Payment providers are inputs, not sources of financial truth. The platform needs a provider-independent payment architecture so the ledger, audit trail, and recovery rules stay stable even if provider details change.

### Consequences

- Phase 7 implementation must follow `PAYMENT_ARCHITECTURE.md`.
- Provider-specific code belongs behind infrastructure adapters.
- Webhook events must be verified, stored, deduplicated, and processed through application services.
- Money movement cannot merge without payment certification.

---

## DEC-0018: Ledger Posting Rules As Accounting Specification

- Date: 2026-07-13
- Status: Accepted
- Future Review: Review after Phase 7 certification and before any new financial posting type is added.

### Context

The platform has a ledger-first financial model, certified investment postings, and upcoming money movement flows. Developers and auditors need a single accounting reference for debit and credit behavior without reverse-engineering code or database views.

### Decision

`LEDGER_POSTING_RULES.md` is the accounting specification for approved financial postings.

The document defines:

- Ledger direction semantics.
- Approved account types.
- Approved transaction types.
- Debit and credit accounts per financial event.
- Required references.
- Required idempotency keys.
- Required audit, email, and notification side effects.
- Unsupported posting patterns.
- Testing requirements.

### Alternatives Considered

- Keep posting rules only in code helpers.
- Let each financial service define its own ledger entries.
- Rely on database constraints without a human-readable accounting contract.

### Reason for Choosing It

Financial correctness needs both executable enforcement and readable accounting intent. A posting constitution makes review, implementation, reconciliation, and audits more reliable.

### Consequences

- New posting types require an ADR and updates to `LEDGER_POSTING_RULES.md`.
- Phase 7 money movement must implement postings exactly as documented.
- Unsupported reversal, deficit, and correction behavior cannot be added implicitly.

---

## DEC-0019: Locked Financial Governance Documents

- Date: 2026-07-13
- Status: Accepted
- Future Review: Review after Phase 7 certification and after any production financial incident.

### Context

`FINANCIAL_INVARIANTS.md`, `PAYMENT_ARCHITECTURE.md`, and `LEDGER_POSTING_RULES.md` now define the financial constitution, money movement architecture, and accounting rules. These documents are more than explanatory notes; they are implementation constraints.

### Decision

The financial governance documents are locked.

Locked documents:

- `FINANCIAL_INVARIANTS.md`
- `PAYMENT_ARCHITECTURE.md`
- `LEDGER_POSTING_RULES.md`

Future behavioral changes require:

- Accepted ADR.
- Review.
- Regression tests.
- Certification update.

### Alternatives Considered

- Allow ordinary pull requests to change financial rules.
- Treat documentation as descriptive rather than binding.
- Wait until production launch to lock the documents.

### Reason for Choosing It

Financial correctness depends on stable rules. Developers should implement approved accounting and payment behavior, not invent it while coding.

### Consequences

- Phase 7 must follow the locked governance documents.
- Changes to financial behavior are intentionally slower than ordinary code changes.
- Production incidents must update governance and regression coverage, not only code.

---

## DEC-0020: Webhook Specification Before Provider Integration

- Date: 2026-07-13
- Status: Accepted
- Future Review: Review after Paystack provider certification and before any future Flutterwave or Stripe integration.

### Context

Phase 7 will connect external provider systems to platform financial state. Webhooks are externally triggered, retry-prone, and security-sensitive. They can confirm deposits, mark withdrawals paid, report failures, or introduce conflicting provider evidence.

### Decision

`WEBHOOK_SPECIFICATION.md` is required before provider integration begins.

The document defines:

- Paystack as the Phase 7 target provider.
- Future provider extension rules for Flutterwave and Stripe.
- Signature verification.
- Replay handling.
- Event identity.
- Duplicate policy.
- Retry policy.
- Failure recovery.
- Security controls.
- Testing and launch gates.

Paystack production code still requires a provider ADR before merge.

### Alternatives Considered

- Implement webhooks directly from provider examples.
- Rely on generic webhook security notes in `SECURITY.md`.
- Add webhook behavior during provider implementation.

### Reason for Choosing It

External systems must not shape financial correctness implicitly. A webhook constitution keeps provider events as verified inputs while the platform ledger remains the source of truth.

### Consequences

- Phase 7 webhook code must follow `WEBHOOK_SPECIFICATION.md`.
- New webhook providers require provider-specific appendices.
- Invalid signatures, duplicate events, replay attempts, provider outages, and processing failures require explicit tests.

---

## DEC-0021: Paystack Provider Certification

- Date: 2026-07-13
- Status: Accepted
- Future Review: Review before adding Flutterwave, Stripe, or any second payment provider.

### Context

`PAYMENT_ARCHITECTURE.md` and `WEBHOOK_SPECIFICATION.md` require an accepted provider ADR before Paystack production code merges. The Phase 7.1 deposit and withdrawal engines now implement Paystack-backed deposits and withdrawal payouts, so the provider scope, methods, signature scheme, and reconciliation exceptions must be certified before this code is treated as production-ready.

### Decision

Paystack is certified as the sole Phase 7 payment provider under these terms:

- Provider: Paystack only. No other provider is implemented or enabled.
- Currency: USD only. `supportedDepositCurrencySchema` and `supportedWithdrawalCurrencySchema` enforce this at the application boundary.
- Deposit methods used: `POST /transaction/initialize` and `GET /transaction/verify/:reference`.
- Withdrawal methods used: `POST /transfer` and `GET /transfer/verify/:reference`.
- Webhook events handled: `charge.success`, `charge.failed`, `transfer.success`, `transfer.failed`, `transfer.reversed`. All other verified events are stored and marked `ignored` without financial side effects.
- Signature verification: `HMAC SHA512` over the raw webhook body using the server-only `PAYSTACK_SECRET_KEY`, compared with constant-time comparison against the `x-paystack-signature` header, per `WEBHOOK_SPECIFICATION.md`.
- `transfer.reversed` is a reconciliation exception only. It is stored, audited, and surfaced through an outbox event, but it never posts an automatic ledger entry. A reversed transfer requires manual financial review before any compensating ledger action is designed and certified.
- Internal webhook retry uses the certified backoff schedule (1 minute, 5 minutes, 15 minutes, 30 minutes, 1 hour, then hourly) with a maximum of 10 attempts before an event is marked dead-lettered and an admin alert outbox event is enqueued.
- Secrets: `PAYSTACK_SECRET_KEY` is read only from server-only environment configuration (`getServerEnv`), is never exposed to client code, and is never logged. When the key is absent, provider calls fail closed through a disabled provider implementation rather than silently no-op.

### Alternatives Considered

- Support multiple providers concurrently in Phase 7.
- Auto-post a compensating ledger entry on `transfer.reversed`.
- Allow additional currencies before the ledger and provider integration are certified for multi-currency handling.

### Reason for Choosing It

Paystack is the only provider integrated and tested in Phase 7.1. Restricting scope to one provider and one currency keeps the certified financial surface area small and auditable. Treating `transfer.reversed` as a reconciliation exception avoids inventing an uncertified reversal posting under provider pressure; any future automatic reversal handling requires its own ADR, ledger posting rule, and regression tests.

### Consequences

- Adding Flutterwave, Stripe, or any other provider requires a new or superseding provider ADR, a provider-specific webhook appendix, and test matrix expansion, per `WEBHOOK_SPECIFICATION.md`.
- Adding a non-USD currency requires an accepted ADR and ledger multi-currency review before implementation.
- `transfer.reversed` events remain visible only through audit logs and the `payment.transfer_reversed_exception` outbox event until a dedicated reversal ledger design is accepted.

---

## DEC-0022: Money Movement Frozen

- Date: 2026-07-13
- Status: Accepted
- Future Review: Review only when a critical defect, security issue, or accepted product change requires money-movement modification.

### Context

Phase 7 certified deposits, withdrawals, Paystack integration, webhook processing, ledger posting, recovery, and financial certification as release `v2.2.0`. Phase 8 will build the administrative platform on top of these engines.

Casual changes to certified money-movement behavior would undermine the financial guarantees Phase 8 admin workflows must rely on.

### Decision

The `v2.2.0` money movement subsystem is frozen.

Locked surfaces:

- Deposit engine
- Withdrawal engine
- Paystack integration
- Webhook processing
- Money-movement ledger postings
- Deposit and withdrawal state machines
- Idempotency, retry, recovery, and dead-letter handling
- Phase 7 financial certification reports

Allowed changes:

- Security patches
- Bug fixes
- Performance improvements
- Test improvements
- Documentation clarifications that do not change behavior

Behavioral or financial changes require:

- An accepted ADR
- Regression tests
- Financial certification update
- Explicit approval before merge

Phase 8 admin financial operations must call the certified engines and must not invent alternate deposit, withdrawal, webhook, or ledger workflows.

### Alternatives Considered

- Allow Phase 8 to reshape payment workflows while building admin screens.
- Rely on informal code review without a freeze ADR.
- Delay freezing until after the admin portal ships.

### Reason for Choosing It

Admin tooling must operate the certified financial system, not redefine it. Freezing `v2.2.0` keeps Phase 8 focused on permissions, review surfaces, reporting, and operational administration.

### Consequences

- `main` at `v2.2.0` is the recovery checkpoint for money movement.
- Phase 8 work happens on `phase-8-admin-platform`.
- Deposit, withdrawal, Paystack, webhook, and ledger redesigns are out of Phase 8 scope.
- Future money-movement behavior changes are intentionally slower than ordinary admin UI work.

---

## DEC-0023: Database-Backed Admin RBAC

- Date: 2026-07-13
- Status: Accepted
- Future Review: Review when two-person approval workflows are introduced, subject to `DEC-0025` Administrative Platform freeze.

### Context

Phase 8.1 and 8.2 temporarily used capability checks that could be paired with hardcoded role maps. Phase 8.3 builds the company operating system: staff, roles, permissions, feature flags, settings, template catalogs, job monitoring, and security center. Those features depend on configurable authorization.

Hardcoded role → permission maps cannot stay as the production source of truth once roles are editable.

### Decision

Administrative authorization is database-backed.

Binding rules:

- `ADMIN_PERMISSION_MATRIX.md` is the governance source of truth for system roles, permission keys, default grants, elevated actions, and future two-person approval candidates.
- Runtime grants load from `permissions`, `role_permissions`, and active `user_roles`.
- `requireAdminActor` authorizes by permission key, not by role name switch statements.
- Role keys remain labels and assignment targets; they must not encode permission logic in application code.
- Every administrative mutation writes an audit record capturing actor, permission used, action, target, request hashes, and before/after payloads where applicable.
- Certified financial engines remain frozen under `DEC-0022`; admin system services wrap them and must not reimplement money movement.

Allowed without superseding this decision:

- Adding new permission keys through matrix + migration seed updates
- Changing production grants through audited admin role-permission operations
- Extending staff/system administration APIs behind existing permission namespaces

### Alternatives Considered

- Keep hardcoded role maps in application code for simplicity.
- Use only coarse admin vs non-admin flags.
- Delay configurable RBAC until after reporting and UI polish.

### Reason for Choosing It

Every remaining admin feature depends on consistent authorization. Configurable, audited RBAC keeps Phase 8.1/8.2 surfaces aligned with staff role management and prevents permission drift as the platform grows.

### Consequences

- Phase 8.3 certification is complete on `phase-8-admin-platform`.
- Production authorization must not reintroduce hardcoded role permission maps.
- Administrative Platform freeze at `v2.3.0` is governed by `DEC-0025`.

---

## DEC-0024: Read-Only Administrative Reporting

- Date: 2026-07-13
- Status: Accepted
- Future Review: Review only if a new report type would require derived financial formulas not already stored by certified engines, subject to `DEC-0025`.

### Context

Phase 8.4 adds executive, customer, financial, operational, and system reports plus CSV/Excel exports. Reporting must aggregate certified operational and financial records without becoming a second source of truth or redefining ROI, settlement, deposit, or withdrawal mathematics.

### Decision

Administrative reports are read-only projections of certified data.

Binding rules:

- `REPORTING_SPECIFICATION.md` is the governance source of truth for report catalog, data sources, America/New_York period buckets, export formats, and permission requirements.
- Report queries may only read existing stored amounts and statuses produced by certified engines and operational systems.
- Reporting must not post ledger entries, mutate money-movement state, recalculate ROI formulas, or invent settlement rules.
- Viewing requires `reports.read`. Exporting requires `reports.export` and must append an audited `report.exported` record.
- PDF generation is out of scope for Phase 8.4.
- Complete Admin Platform certification and freeze are governed by `DEC-0025` at `v2.3.0`.

### Alternatives Considered

- Allow reporting services to recompute ROI and settlement locally for dashboard speed.
- Defer exports until after Admin UI polish.
- Treat report totals as authoritative balances for finance reconciliation.

### Reason for Choosing It

A reporting layer that recalculates money movement would compete with certified engines and create reconciliation risk. Read-only projections keep Phase 8.4 operationally useful while preserving `DEC-0016` and `DEC-0022` freeze guarantees.

### Consequences

- Phase 8.4 certification remains binding under the `v2.3.0` Administrative Platform freeze.
- Future report metrics must cite stored certified fields or be rejected.
- Admin UI may consume these APIs but must not introduce new financial calculation backends.

---

## DEC-0025: Administrative Platform Frozen

- Date: 2026-07-13
- Status: Accepted
- Future Review: Review only when a critical defect, security issue, or accepted product change requires administrative-platform modification.

### Context

Phase 8 certified customer administration, financial operations over frozen engines, database-backed RBAC, reporting/exports, and the Phase 8.5 operational console as release `v2.3.0`.

Casual changes to certified admin workflows would undermine operational guarantees and risk regressions against frozen investment and money-movement systems.

### Decision

The `v2.3.0` Administrative Platform is frozen.

Locked surfaces:

- Admin console UX under `/admin` and `src/features/admin`
- Admin authorization model (`ADMIN_PERMISSION_MATRIX.md`, `DEC-0023`)
- Admin application services and `/api/admin/*` contracts certified in Phases 8.1–8.4
- Read-only reporting rules (`DEC-0024`)
- Phase 8 certification and audit package for `v2.3.0`

Allowed changes:

- Security patches
- Bug fixes
- Performance improvements
- Test improvements
- Documentation clarifications that do not change behavior

Behavioral or workflow changes require:

- An accepted ADR
- Regression tests
- Administrative platform recertification
- Explicit approval before merge

Admin financial actions must continue to wrap certified engines and must not invent alternate deposit, withdrawal, ledger, ROI, webhook, or settlement behavior.

### Alternatives Considered

- Keep admin UX permanently open for opportunistic redesign while building customer-facing work.
- Freeze only APIs and leave console UX mutable without ADR.
- Delay freezing until after public website work.

### Reason for Choosing It

Three independently certified freezes—Investment Engine (`v2.1.0`), Money Movement (`v2.2.0`), and Administrative Platform (`v2.3.0`)—give later phases a stable operational core.

### Consequences

- `main` at `v2.3.0` is the recovery checkpoint for the administrative platform.
- Milestone 5+ customer experience work must not casually reshape admin workflows.
- Admin permission, reporting, or ops UX changes become intentionally slower than ordinary feature polish outside the freeze scope.

---

## DEC-0026: Milestone 5 — Customer Experience Platform

- Date: 2026-07-13
- Status: Accepted
- Future Review: Review at `v3.0.0` certification, or if a Wave B money UX need appears to require frozen-engine behavior change.

### Context

Phases 6–8 certified and froze Investment Engine (`v2.1.0`), Money Movement (`v2.2.0`), and Administrative Platform (`v2.3.0`). `LEGACY_FEATURE_EXTRACTION.md` shows the largest remaining gap is customer-facing product UX—not more financial backends.

Calling the next body of work “Phase 9 Communications” or “Phase 10 Public Website” understates scope and invites piecemeal builds that reopen V1 as a code migration.

### Decision

The next major product release is:

**Milestone 5 — Customer Experience Platform (`v3.0.0`)**

Binding rules:

- Build customer experience **on top of** frozen Identity, Investment, Money Movement, and Admin subsystems.
- Execute in waves: A Trust & Public Presence → B Money Experience → C Growth & Support → D Polish.
- Communications (email, in-app notifications, templates) are part of Milestone 5 where they serve CX—not a separate competing phase that owns the roadmap.
- Public marketing website is Wave A of Milestone 5—not a disconnected Phase 10.
- Legacy V1 is a **design reference** opened screen-by-screen: extract business flow, useful copy, customer journey, and visual hierarchy only.
- Never copy V1 HTML, CSS, JavaScript, PHP, theme kits, schema, or architecture.
- Honor the `LEGACY_FEATURE_EXTRACTION.md` REMOVE list.
- Wave B must consume certified engines/APIs; financial behavior changes still require ADR + regression + recertification.

### Alternatives Considered

- Keep separate Phase 9 Communications then Phase 10 Website.
- Rebuild V1 screen-for-screen as a migration.
- Start Wave B money UX before public trust surfaces.

### Reason for Choosing It

Customer experience is one product milestone. Marketing trust, money UX, growth, and polish belong together under `v3.0.0`, sequenced so trust precedes funding and engines stay frozen.

### Consequences

- Roadmap and release planning speak in milestones for the customer product track.
- Cursor implementation should stay wave-scoped; strategy/prioritization can stay outside Cursor.
- `v2.4.0` / `v2.5.0` communication-only or website-only tags are retired from the planned tag table.
- Wave execution must follow Design → Approve → Implement (`DEC-0027` / `EP-026`).

---

## DEC-0027: UX Specification Gate Before Wave Implementation

- Date: 2026-07-13
- Status: Accepted
- Future Review: Review when a later wave’s UX package is approved, or if a wave is too small to justify a full UX package.

### Context

Through `v2.3.0`, Unique Sky Way built a certified platform. From `v3.0.0`, the work is product experience. Jumping straight to implementation causes redesign loops that waste Cursor tokens and weaken quality.

### Decision

For each Milestone 5 wave:

**No production implementation begins until that wave’s UX specification is approved.**

Required wave loop:

1. Design (documentation + mockups only)
2. Approve
3. Implement
4. Test
5. Audit
6. Freeze (wave checkpoint)

Wave A splits explicitly into:

- Stage 1 — UX & Design → `WAVE_A_UX_SPECIFICATION.md`
- Stage 2 — Implementation (after approval)

Legacy usage: treat V1 as a screen reference library—one page at a time—never a source tree to port.

### Alternatives Considered

- Implement Wave A immediately, refine in place.
- Design the entire Milestone 5 UX before any Wave A design approval.
- Skip design packages for “simple” marketing pages.

### Reason for Choosing It

Approved UX makes implementation deterministic. Frozen engines remove financial risk; the remaining risk is product quality and rewrite cost.

### Consequences

- Wave A Stage 1 is complete when approved under `DEC-0028`.
- Implementation PRs without an approved wave UX spec should be rejected.
- `EP-026` and `EP-027` encode the same rule in engineering principles.

---

## DEC-0028: Wave A UX Specification Approved

- Date: 2026-07-13
- Status: Accepted
- Future Review: Review at Wave A Stage 2 certification, or if Stage 2 requires a philosophy-level change.

### Context

Wave A Stage 1 produced `WAVE_A_UX_SPECIFICATION.md` (IA through Design Constitution) and reached diminishing returns on further UX writing. Real implementation will teach more than additional documentation. Brand execution details are captured separately in `BRAND_ASSETS_SPECIFICATION.md`.

### Decision

**Wave A Stage 1 is approved.**

Binding rules:

- `WAVE_A_UX_SPECIFICATION.md` is the design authority for Wave A / Milestone 5 public customer experience.
- `BRAND_ASSETS_SPECIFICATION.md` is the brand asset authority for Stage 2.
- Stage 2 must implement what is specified.
- Deviations require updating the relevant specification first, or an ADR if design philosophy changes.
- Stage 2 is executed as bounded sprints **A1 → A5**, each ending in freeze/certify before the next sprint expands scope.
- Frozen engines (`v2.1.0`–`v2.3.0`) remain untouched.

Sprint map:

| Sprint | Scope |
| --- | --- |
| A1 | Public shell: nav, header, footer, layout, SEO foundation, theme/tokens, marketing chrome |
| A2 | Homepage only |
| A3 | About, How it Works, Security |
| A4 | Plans, FAQ, Contact |
| A5 | Legal pages, 404 polish, performance, accessibility, Wave A certification |

### Alternatives Considered

- Continue refining UX docs before any code.
- Implement all of Wave A in one Cursor pass.
- Skip brand asset specification and decide images ad hoc.

### Reason for Choosing It

Approval unlocks Stage 2 without pretending the spec is eternally perfect. Sprint boundaries conserve tokens and contain rework. Brand assets must be decided before pages proliferate inconsistent visuals.

### Consequences

- Next engineering work is Sprint **A1** on a Milestone 5 branch—not “build all of Wave A.”
- Spec edits after approval are controlled; philosophy changes need ADR.

## DEC-0029: Wave A Stage 2 Certified & Frozen at v3.0.0

- Date: 2026-07-13
- Status: Accepted — **ACTIVE FREEZE** after Wave A.5 Review
- Future Review: Only for philosophy-level public UX change, counsel binding legal replacement, or superseding ADR

### Context

Sprints A1–A5 delivered and self-certified the public Customer Experience Platform Wave A on the frozen v2.1–v2.3 core. Automated gates passed. Wave A.5 consultancy review (customer trust lens) scored **98.6 / 100** and approved release.

### Decision

1. **Wave A Stage 2 is certified and frozen** (`WAVE_A_CERTIFICATION.md`).
2. Wave A.5 Review is **PASS** — merge and release are authorized.
3. Release actions:
   - Merge `milestone-5-wave-a-sprint-a5` into `main`
   - Annotated tag **`v3.0.0`**
   - Treat the public Wave A experience as **frozen** with the same discipline as investment engine and money movement: no casual redesign; changes require ADR-level justification and recertification
4. Legal suite pages remain marked counsel-pending until counsel signs off; honest draft labeling remains visible and is accepted at freeze.
5. Wave B+ work may begin only under Design → Approve → Implement (`DEC-0027`) for the money experience train (`v3.1.0`).
6. Non-blocking polish from Wave A.5 (stronger company story, founder letter, timeline, CONTENT_STYLE_GUIDE, etc.) is **deferred** — not reopened into frozen A1–A5 without a scoped ADR.

### Rejected Alternatives

- Merge and tag without Wave A.5 trust review.
- Treat public pages as permanently editable marketing without freeze discipline.
- Delay `v3.0.0` until every counsel document and brand photo is final.

### Consequences

- Public Wave A routes require DEC-level change control after `v3.0.0`.
- Next product train is **Wave B — Customer Money Experience (`v3.1.0`)**.
- Counsel finalization may update legal copy under patch/recertification without reopening A1–A4 UX.

## DEC-0030: Customer Experience Principles Adopted for Authenticated Product

- Date: 2026-07-13
- Status: Accepted
- Future Review: At Wave B Stage 1 approval, or if a principle conflicts with a certified financial invariant (financial invariants win)

### Context

Wave A freeze established public trust before registration. Wave B must fulfill that trust after sign-in without reopening frozen engines. The project needed a UX constitution parallel to `FINANCIAL_INVARIANTS.md`.

### Decision

1. Adopt `CUSTOMER_EXPERIENCE_PRINCIPLES.md` as the authority for authenticated customer money experience.
2. Wave B Stage 1 (`WAVE_B_UX_SPECIFICATION.md`) must obey these principles before any production implementation.
3. These principles never override `FINANCIAL_INVARIANTS.md`.
4. Suggested implementation sprints remain B1–B5 after design approval under `DEC-0027`.

### Rejected Alternatives

- Start Wave B implementation without an authenticated UX constitution.
- Fold Wave B rules into public Wave A docs (wrong audience and wrong freeze boundary).

### Consequences

- Next work is Wave B Stage 1 design only — not dashboard coding.
- Screen specs and later sprints are judged against CXP-001…CXP-016.

## DEC-0031: Wave B Stage 1 Companion Guides & One-Question Screens

- Date: 2026-07-13
- Status: Accepted
- Future Review: At Wave B Stage 1 UX approval, or if status catalogs diverge from domain enums

### Context

Wave B will present money daily. Presentation, empty states, and statuses cause more redesign cost than layouts if left unspecified. Overloaded screens also erode the calm trust built in Wave A.

### Decision

1. Wave B Stage 1 design package **must** include:
   - `WAVE_B_UX_SPECIFICATION.md`
   - `FINANCIAL_VISUALIZATION_GUIDE.md`
   - `EMPTY_STATES_GUIDE.md`
   - `STATUS_SYSTEM.md`
   - `FINANCIAL_MICROCOPY_GUIDE.md`
2. Adopt **`EP-029`**: every authenticated screen answers exactly one primary financial question (`CXP-016`).
3. `STATUS_SYSTEM.md` must stay aligned to certified deposit, withdrawal, and investment state machines.
4. No Wave B production implementation until the full Stage 1 package is approved under `DEC-0027`.

### Rejected Alternatives

- Design screens without status/empty/visualization companions.
- Allow multi-job dashboards that answer several primary questions at once.

### Consequences

- Next Cursor/ChatGPT work is completing and approving `WAVE_B_UX_SPECIFICATION.md` against these companions — not coding B1.
- Sprint certifications must cite EP-029 and the three guides.

## DEC-0032: Wave B Stage 1 UX Specification Approved

- Date: 2026-07-13
- Status: Accepted
- Future Review: At Wave B `v3.1.0` certification, or if Stage 2 requires philosophy-level change

### Context

Wave B Stage 1 produced `WAVE_B_UX_SPECIFICATION.md` plus companions (`FINANCIAL_VISUALIZATION_GUIDE.md`, `EMPTY_STATES_GUIDE.md`, `STATUS_SYSTEM.md`, `FINANCIAL_MICROCOPY_GUIDE.md`) under `CUSTOMER_EXPERIENCE_PRINCIPLES.md`. Consultancy review scored **99.4 / 100** and approved implementation.

### Decision

1. **Wave B Stage 1 is approved.**
2. `WAVE_B_UX_SPECIFICATION.md` is the design authority for authenticated money experience Stage 2.
3. Implementation proceeds as sprints **B1–B5**; B1 is dashboard infrastructure only.
4. Non-blocking refinements (financial home hierarchy, money timeline, portfolio card questions, wallet ops-center philosophy, What’s New) are incorporated into the approved spec.
5. `FINANCIAL_DASHBOARD_PRINCIPLES.md` is required before B5 certification, not before B1.

### Rejected Alternatives

- Start money journeys (deposit/withdraw/portfolio logic) before dashboard shell exists.
- Implement Wave B without an approved Stage 1 package.

### Consequences

- Next engineering work is Sprint **B1** (dashboard infrastructure).
- Spec philosophy changes need ADR; sprint-local craft follows the approved document.

## DEC-0033: Dashboard Is the Primary Financial Decision Surface

- Date: 2026-07-13
- Status: Accepted
- Future Review: At Wave B certification, or if a new primary money home is proposed

### Context

Authenticated customers need one calm place to answer “Am I okay?” Over time, dashboards accumulate widgets and lose focus.

### Decision

1. The **dashboard** is the primary financial decision surface for logged-in customers.
2. First-five-second hierarchy is fixed: Portfolio Value → Available Balance → Today’s Activity → Pending Actions → Investment Progress → Notifications.
3. Future dashboard additions must reinforce `EP-029` (“How am I doing today?”) and `DEC-0033`; they must not turn the dashboard into an analytics carnival or marketing surface.
4. Widget constitution (`FINANCIAL_DASHBOARD_PRINCIPLES.md`) will govern long-term widget quality before `v3.1.0` certification.

### Rejected Alternatives

- Treat portfolio or wallet as the default home instead of dashboard.
- Allow unrestricted widget sprawl without a primary question.

### Consequences

- Sprint B1 builds the dashboard framework first.
- Later sprints plug into that framework; they do not invent competing homes.

## DEC-0034: Sprint B1 Dashboard Foundation Certified

- Date: 2026-07-13
- Status: Accepted
- Future Review: At Wave B `v3.1.0` certification

### Context

Sprint B1 delivered authenticated dashboard infrastructure (widget registry, money navigation, mobile bottom nav, portfolio/wallet/ledger shells) without wiring deposits, withdrawals, or portfolio calculations. Consultancy scored **99.5 / 100**.

### Decision

1. Sprint B1 is **certified and frozen** (`SPRINT_B1_CERTIFICATION.md`).
2. Later Wave B sprints plug into the B1 framework; they do not reinvent dashboard chrome.
3. Dashboard hierarchy remains governed by `DEC-0033`.

### Consequences

- Next implementation sprint is **B2 — Portfolio Experience** (read-only).

## DEC-0035: Portfolio Experience Principles Adopted Before Sprint B2

- Date: 2026-07-13
- Status: Accepted
- Future Review: At Wave B certification, or if portfolio UX philosophy changes

### Context

Portfolio screens will be the primary answer to “Where is my money?” Without a constitution, cards and detail views diverge over time.

### Decision

1. Adopt `PORTFOLIO_EXPERIENCE_PRINCIPLES.md` as authority for portfolio list, cards, filters, and investment detail.
2. Sprint B2 may implement **read-only** portfolio experience only.
3. Cards must answer: what / worth today / lifecycle / what next.
4. No deposits, withdrawals, Paystack, ROI formula recalculation, or ledger posting in portfolio UX.

### Consequences

- B2 certification must cite this document.
- `FINANCIAL_DASHBOARD_PRINCIPLES.md` remains deferred until before B5.

## DEC-0036: Sprint B2 Portfolio Experience Certified

- Date: 2026-07-13
- Status: Accepted
- Future Review: At Wave B `v3.1.0` certification

### Context

Sprint B2 delivered read-only portfolio list, investment cards, filters/search/sort, empty states, and investment detail over certified repositories — without deposits, withdrawals, Paystack, or engine mutation.

### Decision

1. Sprint B2 is **certified and frozen** (`SPRINT_B2_CERTIFICATION.md`).
2. Portfolio UX remains governed by `PORTFOLIO_EXPERIENCE_PRINCIPLES.md` (`DEC-0035`).
3. Later sprints may deepen data binding but must not invent competing card/detail models.

### Consequences

- Next implementation sprint is **B3 — Wallet / Money Journeys** (deposits, withdrawals, ledger) when explicitly approved.

## DEC-0037: Sprint B2 Portfolio Experience Consultancy Approval

- Date: 2026-07-13
- Status: Accepted
- Future Review: At Wave B `v3.1.0` certification

### Context

External consultancy reviewed Sprint B2 at **99.7 / 100** and approved proceeding. This decision records that approval alongside the engineering freeze in `DEC-0036`.

### Decision

1. Confirm Sprint B2 is **approved and frozen** under `SPRINT_B2_CERTIFICATION.md` / `DEC-0036`.
2. Portfolio remains read-only and governed by `PORTFOLIO_EXPERIENCE_PRINCIPLES.md` (`DEC-0035`).
3. Implementation continues with **Sprint B3** only after wallet principles are adopted (`DEC-0038`).

### Consequences

- Do not reopen B2 portfolio philosophy without ADR.
- B3 must not fold “move money” into portfolio cards.

## DEC-0038: Wallet Experience Principles Adopted Before Sprint B3

- Date: 2026-07-13
- Status: Accepted
- Future Review: At Wave B certification, or if wallet UX philosophy changes

### Context

Wallet + deposit + withdrawal are emotionally distinct surfaces. Without a constitution, clarity erodes exactly when customers need trust most.

### Decision

1. Adopt `WALLET_EXPERIENCE_PRINCIPLES.md` as authority for wallet, deposit, withdrawal, money timeline, and funding/withdrawal histories.
2. Sprint B3 answers **How do I safely move money?** using frozen engines only.
3. Balance vocabulary (Available, Pending, Locked, Withdrawable, Reserved, Credited, Accrued) is mandatory.
4. No ROI recalculation, investment-engine changes, ledger posting changes, Paystack redesign, settlement changes, admin, or reporting in B3.

### Consequences

- B3 certification must cite this document.
- `FINANCIAL_DASHBOARD_PRINCIPLES.md` remains deferred until before B5.

## DEC-0039: Sprint B3 Wallet Experience Certified

- Date: 2026-07-13
- Status: Accepted
- Future Review: At Wave B `v3.1.0` certification

### Context

Sprint B3 delivered wallet overview, deposit/withdrawal journeys and histories, money timeline, ledger reads, and status explanations over certified money-movement engines — without ROI recalculation, investment-engine changes, ledger posting changes, or Paystack redesign.

### Decision

1. Sprint B3 is **certified and frozen** (`SPRINT_B3_CERTIFICATION.md`).
2. Wallet UX remains governed by `WALLET_EXPERIENCE_PRINCIPLES.md` (`DEC-0038`).
3. Later sprints deepen notifications/activity/help; they do not invent competing balance vocabulary.

### Consequences

- Next implementation sprint is **B4 — Notifications / Activity / Help** when explicitly approved.

## DEC-0040: Sprint B3 Wallet Experience Consultancy Approval

- Date: 2026-07-13
- Status: Accepted
- Future Review: At Wave B `v3.1.0` certification

### Context

External consultancy reviewed Sprint B3 at **99.8 / 100** and approved proceeding. This decision records that approval alongside the engineering freeze in `DEC-0039`.

### Decision

1. Confirm Sprint B3 is **approved and frozen** under `SPRINT_B3_CERTIFICATION.md` / `DEC-0039`.
2. Wallet remains governed by `WALLET_EXPERIENCE_PRINCIPLES.md` (`DEC-0038`).
3. Implementation continues with **Sprint B4** only after notification experience principles are adopted (`DEC-0041`).

### Consequences

- Do not reopen B3 wallet philosophy without ADR.
- B4 must not fold payment journey redesign into communication UX.

## DEC-0041: Notification Experience Principles Adopted Before Sprint B4

- Date: 2026-07-13
- Status: Accepted
- Future Review: At Wave B certification, or if customer communication philosophy changes

### Context

Authenticated trust depends on how customers learn what matters. Without a constitution, notifications, activity, help, and What’s New diverge in tone and priority.

### Decision

1. Adopt `NOTIFICATION_EXPERIENCE_PRINCIPLES.md` as authority for notification center, activity presentation, help/support, What’s New, and referral summary UX.
2. Sprint B4 answers **What do I need to know right now?** using frozen services only.
3. Priority remains Security > Money failure > Money success > System.
4. No payment logic, ROI recalculation, admin, reporting, marketing pages, auth redesign, or engine changes in B4.

### Consequences

- B4 certification must cite this document.
- `FINANCIAL_DASHBOARD_PRINCIPLES.md` is adopted at Sprint B5 / `DEC-0043`.

## DEC-0042: Sprint B4 Communication Experience Certified

- Date: 2026-07-13
- Status: Accepted
- Future Review: At Wave B `v3.1.0` certification

### Context

Sprint B4 delivered notification center refinements, activity filters, help/support, What’s New, referral summary, and a communication hub over frozen services — without payment, ROI, admin, or engine redesign.

### Decision

1. Sprint B4 is **certified and frozen** (`SPRINT_B4_CERTIFICATION.md`).
2. Communication UX remains governed by `NOTIFICATION_EXPERIENCE_PRINCIPLES.md` (`DEC-0041`).
3. Later Wave B work (B5) certifies the package; it does not invent competing notification priority rules.

### Consequences

- Next implementation sprint is **B5 — Wave B certification** when explicitly approved, including `FINANCIAL_DASHBOARD_PRINCIPLES.md`.

## DEC-0043: Customer Money Experience Frozen at v3.1.0

- Date: 2026-07-13
- Status: Accepted — **ACTIVE FREEZE**
- Future Review: Only for philosophy-level authenticated money UX change, or superseding ADR

### Context

Sprints B1–B5 delivered and certified the authenticated Customer Money Experience on frozen v2.1–v2.3 cores and frozen public Wave A (`v3.0.0`). Automated gates passed. Consultancy scored B4 at **99.9 / 100**. Sprint B5 adopted `FINANCIAL_DASHBOARD_PRINCIPLES.md`, bound dashboard widgets to certified reads, and completed the Wave B audit package.

### Decision

1. **Wave B is certified and frozen** (`WAVE_B_CERTIFICATION.md`, `SPRINT_B5_CERTIFICATION.md`).
2. Adopt `FINANCIAL_DASHBOARD_PRINCIPLES.md` as authority for dashboard widgets.
3. Release actions:
   - Merge `milestone-5-wave-b-sprint-b5` into `main`
   - Annotated tag **`v3.1.0`**
   - Treat the authenticated money experience as **frozen** with the same discipline as engines and public Wave A
4. Confirm B4 consultancy approval (**99.9 / 100**) authorizes freeze.
5. Subsequent Growth/Polish trains follow Design → Approve → Implement (`DEC-0027`) and must not casually reopen B1–B5 surfaces or frozen engines.

### Rejected Alternatives

- Ship without dashboard financial principles.
- Keep Wave B permanently editable without freeze discipline.
- Reopen investment/money-movement engines for customer UX convenience.

### Consequences

- Authenticated Wave B routes require DEC-level change control after `v3.1.0`.
- Next product train is Growth Experience (`v3.2.0`) under Milestone 6 governance — not reopen of money UX foundations.
- `FINANCIAL_INVARIANTS.md` continues to win over any experience principle conflict.

## DEC-0044: Platform Constitution Adopted

- Date: 2026-07-13
- Status: Accepted
- Future Review: When release-train philosophy or freeze policy changes

### Context

After freezing `v3.1.0`, the platform has a complete certified customer path from public trust through authenticated money management. Future work must add products inside the platform without regenerating foundations or burning implementation capacity on re-planning.

### Decision

1. Adopt `PLATFORM_CONSTITUTION.md` as the strategic constitution for philosophy, freeze policy, design/engineering posture, release process, and roadmap philosophy.
2. New trains (`v3.2.0`+) require Design → Approve → Implement and must not casually reopen `v2.x`, `v3.0.0`, or `v3.1.0`.
3. Legacy V1 is a feature-idea library only — not a repository Cursor re-compares by default.
4. Internationalization ships as its own governed train (`v3.3.0`), not as incremental ungoverned string work.

### Consequences

- Implementation prompts should carry architecture, UX decisions, constraints, and acceptance criteria already decided.
- Roadmap language prefers experience trains: Growth → International → Mobile → Ecosystem.
