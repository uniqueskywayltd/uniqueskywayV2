# CONTRIBUTING.md

## Purpose

This guide defines how engineers contribute to Unique Sky Way V2.

No contribution should be accepted unless it complies with this guide, the architecture documents, the decision log, and the glossary.

## Project Philosophy

Unique Sky Way V2 is a financial platform. Engineering decisions must favor:

- Simplicity.
- Maintainability.
- Financial correctness.
- Security.
- Auditability.
- Performance.
- Readability.
- Long-term operation.

Convenience is not a valid reason to bypass architecture.

## Required Reading

Before contributing to production code, read:

- `PRODUCT.md`.
- `ARCHITECTURE.md`.
- `FOLDER_STRUCTURE.md`.
- `DATABASE.md`.
- `API_SPEC.md`.
- `ROI_ENGINE.md`.
- `EMAIL_SYSTEM.md`.
- `NOTIFICATION_SYSTEM.md`.
- `SECURITY.md`.
- `PERFORMANCE.md`.
- `DEPLOYMENT.md`.
- `TESTING.md`.
- `DEVELOPMENT_ROADMAP.md`.
- `DECISIONS.md`.
- `GLOSSARY.md`.

## Non-Negotiable Rules

- Do not copy architecture, services, middleware, controllers, routing, authentication, helpers, utilities, or state management from the previous Unique Sky Way project.
- Do not update wallet balances directly.
- Do not bypass the ledger posting engine.
- Do not put business rules in React components.
- Do not put business rules in route handlers.
- Do not put business policy in repositories.
- Do not expose secrets to the browser.
- Do not use JavaScript floating point for money.
- Do not introduce financial behavior without tests and documentation.
- Do not introduce new terminology without updating `GLOSSARY.md`.
- Do not introduce major architecture changes without updating `DECISIONS.md`.

## Architecture Principles

The platform uses:

- Server-first Next.js App Router.
- React Server Components by default.
- Modular monolith architecture.
- Framework-independent domain logic.
- Application services for use cases.
- Repositories for persistence boundaries.
- Drizzle ORM for typed PostgreSQL access.
- Supabase and PostgreSQL as the initial system of record.
- Ledger-first financial modeling.
- Transactional outbox for side effects.
- Event-driven notifications.
- Platform-independent deployment.

## Folder Structure

Follow `FOLDER_STRUCTURE.md`.

Rules:

- Every folder has one responsibility.
- Avoid generic dumping grounds such as `utils`, `helpers`, `misc`, or `common`.
- Domain code belongs in domain folders.
- Use cases belong in the application layer.
- Database implementation belongs in infrastructure.
- UI feature composition belongs in feature folders.
- Low-level UI primitives must not import business domains.

## Naming Conventions

Use names from `GLOSSARY.md`.

Rules:

- Prefer `investment` over ambiguous terms like `package` in code, unless specifically representing customer-facing package copy.
- Prefer `ledgerTransaction` over `transaction` for financial records.
- Prefer `settlementDate`, `earningDate`, and `ledgerPostingDate` over generic `date`.
- Prefer `availableBalance`, `lockedBalance`, `pendingBalance`, and `reservedBalance` over `balance` when precision matters.
- Use `idempotencyKey` consistently for retry-safe operations.
- Use explicit status names that match documented state machines.

## TypeScript Standards

Rules:

- TypeScript must run in strict mode.
- Avoid `any`; use explicit types, unknown parsing, or validated schemas.
- Distinguish domain types from database row types.
- Use value objects or branded types for money, dates, IDs, and statuses where helpful.
- Do not pass raw provider payloads across application boundaries.
- Validate all external inputs at the interface boundary.
- Prefer discriminated unions for state machines and typed errors.
- Keep functions small enough that business rules are reviewable.

## React Standards

Rules:

- Server Components are the default.
- Client Components require a clear reason.
- Components should not contain financial calculations.
- Components should not import database clients or provider SDKs.
- Components should receive prepared data from application queries or server boundaries.
- Use accessible controls, labels, errors, focus states, and keyboard support.

## Server Component Policy

Use Server Components for:

- Dashboards.
- Investment detail.
- Wallet activity.
- Admin queues.
- Settlement monitors.
- Read-heavy authenticated pages.

Rules:

- Load data on the server.
- Keep secrets and provider SDKs server-side.
- Use streaming or suspense boundaries where they improve perceived speed without hiding critical financial state.

## Client Component Policy

Use Client Components for:

- Forms with interactive validation.
- Modals.
- Charts.
- Upload widgets.
- Local filters.
- Browser-only APIs.

Rules:

- Do not move server data fetching into the browser without a reason.
- Do not store authoritative financial state in client state.
- Optimistic UI is allowed only for reversible, non-financial interactions unless explicitly approved.

## Database Rules

Rules:

- PostgreSQL is the source of record.
- Drizzle ORM is the approved typed database access layer.
- Database access belongs in infrastructure repositories.
- Financial writes require database transactions.
- Ledger entries are append-only.
- Corrections use compensating entries.
- Migrations must be reviewed before production.
- RLS is defense in depth, not a substitute for application authorization.
- Service role keys are server-only.
- Do not add nullable financial fields casually; every nullable field needs a lifecycle reason.
- Add indexes based on documented access patterns, not guesswork.

## Repository Pattern

Repositories:

- Expose business-oriented persistence methods.
- Hide Drizzle and provider-specific response shapes.
- Accept transaction context for financial workflows.
- Map database rows into application/domain shapes.
- Do not decide business policy.
- Do not send emails, notifications, or provider calls.

Forbidden:

- Generic CRUD repositories for complex financial domains.
- Repositories that directly mutate wallet balances.
- Repositories imported by React components.

## Service Layer Rules

Application services:

- Own use case orchestration.
- Enforce or receive authorization decisions.
- Start and pass transaction context for financial workflows.
- Call domain logic for business rules.
- Call repositories for persistence.
- Write outbox events for side effects.
- Use idempotency keys for retryable commands.

Do not:

- Put workflow orchestration in route handlers.
- Put provider SDK calls inside domain logic.
- Return raw database rows to UI or API callers.

## Financial Correctness Expectations

Financial logic has the highest review bar.

Rules:

- Use integer minor units for cash-visible money.
- Use documented high-precision units for ROI residuals.
- Never use floating point for money.
- Every financial movement flows through the ledger.
- Every ledger transaction must balance.
- Every retryable financial action needs an idempotency key.
- Concurrent financial actions must be safe under race conditions.
- Customer-visible wallet values must reconcile to ledger records.
- Financial changes require unit, integration, and regression tests.
- Update `ROI_ENGINE.md`, `DATABASE.md`, `DECISIONS.md`, and fixtures when financial behavior changes.

## Rules For Modifying Financial Logic

Before changing financial logic:

- Create or update a decision entry if behavior changes.
- Update glossary terms if terminology changes.
- Add or update financial fixtures.
- Add tests for rounding, idempotency, concurrency, and recovery.
- Confirm ledger impact.
- Confirm admin audit impact.
- Confirm customer-visible impact.

Required review:

- At least two senior engineering approvals.
- Finance or business-owner review when customer balances, ROI, maturity, referrals, deposits, or withdrawals change.

## ROI And Settlement Rules

Rules:

- `America/New_York` is the financial timezone.
- Store UTC timestamps and New York financial dates separately.
- Distinguish Earning Date, Settlement Date, Ledger Posting Date, Wallet Credit Date, Maturity Date, and Principal Unlock Date.
- Live Earnings are not official wallet money.
- Credited ROI must be ledger-posted.
- Catch-up settlement must be chronological and idempotent.
- Maturity must occur only after final Earning Date settlement is posted.

## Authentication Rules

Rules:

- Use managed authentication.
- Do not implement custom password storage.
- Admin MFA is required.
- Financial actions require server-side authorization.
- Step-up authentication is required for high-risk actions.
- Session revocation must work for account restriction and credential compromise.

## Rules For Modifying Authentication

Changes to authentication require:

- Security review.
- Test coverage for login, logout, session expiry, revocation, MFA, and admin access.
- Audit logging review.
- Documentation update in `SECURITY.md` and `DECISIONS.md` if behavior changes.

## Authorization Rules

Rules:

- Authorization is application-owned.
- UI guards are not security controls.
- RLS is defense in depth.
- Admin permissions must be explicit.
- Admin financial mutations require audit reasons.
- Customers can access only their own resources.

## Error Handling

Rules:

- Use typed errors in domain and application layers.
- Map errors to API responses only at the interface boundary.
- Do not expose stack traces, provider secrets, or internal SQL errors to users.
- Financial integrity errors must be logged and escalated.
- API errors must follow the documented error envelope.

## Logging

Rules:

- Use structured logs.
- Include request IDs and relevant entity IDs.
- Do not log secrets, full KYC data, full payment details, or sensitive tokens.
- Log authentication failures, authorization failures, rate limits, webhooks, settlement runs, ledger postings, outbox failures, and admin actions.
- Logs should support incident response and reconciliation.

## Testing Requirements

Required test layers:

- Unit tests for domain logic.
- Integration tests for repositories and database constraints.
- Application service tests for workflows.
- API contract tests.
- Financial regression fixtures.
- Security tests.
- End-to-end tests for critical user and admin journeys.
- Performance tests before launch.

Financial tests must include:

- ROI calculation.
- Rounding residuals.
- New York date and DST behavior.
- Catch-up settlement.
- Duplicate settlement attempts.
- Concurrent investment and withdrawal attempts.
- Deposit webhook duplication.
- Withdrawal reservation and release.
- Referral reward posting.
- Ledger reconciliation.

## Documentation Requirements

Update documentation when:

- Business behavior changes.
- Financial behavior changes.
- Security behavior changes.
- API contracts change.
- Database schema changes.
- Deployment assumptions change.
- A new domain term is introduced.
- A major decision is made.

Documentation must explain why, not only what.

## API Rules

Rules:

- Validate all request inputs.
- Enforce authentication and authorization server-side.
- Use idempotency keys for retryable mutations.
- Return consistent error envelopes.
- Do not expose provider internals.
- Do not trust client-provided financial results.
- Keep route handlers thin.
- Version externally consumed APIs when compatibility matters.

## Rules For Modifying APIs

API changes require:

- Contract update in `API_SPEC.md`.
- Validation tests.
- Permission tests.
- Error response tests.
- Idempotency tests for mutations.
- Documentation of migration impact if existing clients are affected.

## Email Rules

Rules:

- Emails are triggered from business events through the outbox.
- Email templates receive prepared data.
- Templates do not query the database.
- Every send uses an idempotency key.
- Delivery webhooks update status.
- Email failure must not roll back financial state.
- Sensitive data in emails must be minimized.

## Rules For Modifying Emails

Email changes require:

- Update `EMAIL_SYSTEM.md`.
- Confirm trigger, recipient, purpose, retry strategy, and failure behavior.
- Add template tests or previews when templates exist.
- Confirm suppression and unsubscribe rules where applicable.

## Background Job Rules

Rules:

- Jobs must be idempotent.
- Jobs must acquire database locks where concurrency matters.
- Jobs must record run status.
- Jobs must be observable.
- Jobs must not rely on in-memory state.
- Failed jobs must be visible to admins or operations.

## Rules For Modifying Background Jobs

Background job changes require:

- Documented trigger and schedule.
- Idempotency strategy.
- Locking strategy.
- Retry strategy.
- Failure behavior.
- Tests for duplicate execution.
- Operational runbook update if production behavior changes.

## Security Expectations

Rules:

- Use secure HTTP-only cookies for sessions.
- Use CSRF protection for state-changing browser requests.
- Use a Content Security Policy appropriate for the app.
- Verify webhook signatures.
- Use rate limits on sensitive endpoints.
- Keep secrets out of code, logs, client bundles, and test fixtures.
- Use signed URLs and scanning for sensitive uploads.
- Apply least privilege to admins and service accounts.
- Audit all sensitive admin actions.

## Performance Expectations

Rules:

- Keep client JavaScript minimal.
- Use Server Components by default.
- Lazy load heavy interactive modules.
- Avoid global imports of charting or provider libraries.
- Use cursor pagination for large lists.
- Design indexes from access patterns.
- Avoid scanning ledger entries for every dashboard load.
- Use rebuildable read models when needed.
- Measure before optimizing.

## Branch Strategy

Recommended branches:

- `main`: production-ready history.
- `develop` or short-lived integration branch only if the team needs it.
- Feature branches: `feature/<short-name>`.
- Fix branches: `fix/<short-name>`.
- Documentation branches: `docs/<short-name>`.

Rules:

- Keep branches short-lived.
- Rebase or merge from main regularly.
- Do not mix unrelated features in one branch.

## Commit Message Guidelines

Use clear, conventional-style commit messages:

- `docs: add governance glossary`
- `feat: add investment creation service`
- `fix: prevent duplicate settlement posting`
- `test: add DST settlement fixture`
- `chore: update dependency lockfile`

Rules:

- Mention financial behavior explicitly when changed.
- Do not hide schema or security changes inside vague commits.

## Pull Request Process

Every pull request must include:

- Summary.
- Motivation.
- Testing performed.
- Risk assessment.
- Screenshots or recordings for UI changes.
- Migration notes for database changes.
- Documentation updates when required.
- Rollback notes for risky changes.

Financial pull requests must also include:

- Ledger impact.
- Idempotency impact.
- Rounding impact.
- Reconciliation impact.
- Fixture updates.

## Code Review Checklist

Reviewers must check:

- Does this follow architecture boundaries?
- Are domain terms consistent with `GLOSSARY.md`?
- Does this require a decision entry?
- Are financial paths ledger-backed?
- Are authorization checks server-side?
- Are secrets protected?
- Are errors typed and mapped correctly?
- Are tests sufficient for the risk?
- Are database queries indexed appropriately?
- Are side effects outbox-driven?
- Are docs updated?

## Definition Of Done

A contribution is done only when:

- Code follows architecture boundaries.
- Tests pass.
- Required financial fixtures pass.
- Security implications are reviewed.
- Performance implications are acceptable.
- Documentation is updated.
- Decisions are logged when needed.
- Errors and logs are production-appropriate.
- The change can be operated and rolled back.

## Merge Requirements

Required before merge:

- CI passes.
- Required approvals obtained.
- No unresolved review comments.
- Documentation updated.
- Database migrations reviewed when present.
- Financial logic approved by senior reviewers when applicable.
- Security-sensitive changes reviewed by a security owner or senior engineer.

## Rules For Adding New Features

Before adding a feature:

- Identify the domain owner.
- Define user and admin behavior.
- Define API and data requirements.
- Define events and notifications.
- Define security and permission requirements.
- Define tests.
- Update documentation.

Do not start with UI if the feature changes financial state.

## Rules For Modifying Database Schema

Schema changes require:

- Documented reason.
- Migration plan.
- Rollback or forward-fix plan.
- Index review.
- RLS review.
- Backfill plan if needed.
- Production data safety review.
- Tests for constraints and repositories.

Financial schema changes require extra review and reconciliation planning.

## Rules For Modifying Deployment

Deployment changes require:

- Environment variable review.
- Secret handling review.
- Worker and scheduler impact review.
- Rollback plan.
- Monitoring update.
- Documentation update in `DEPLOYMENT.md`.

Business logic must not depend on deployment provider behavior.

