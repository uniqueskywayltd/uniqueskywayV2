# FOLDER_STRUCTURE.md

## Purpose

This document defines the intended repository structure before implementation begins.

Every folder must have one responsibility. Generic dumping grounds such as `utils`, `helpers`, `common`, and `services` should be avoided unless they are scoped inside a domain and have a precise purpose.

## Recommended Structure

```text
uniqueskywayV2/
  docs/
    adr/
    operations/
    product/
  src/
    app/
    components/
    features/
    domains/
    application/
    infrastructure/
    config/
    lib/
    styles/
    test/
  supabase/
    migrations/
    seed/
    policies/
    functions/
  scripts/
  public/
  emails/
```

Note: These folders should be created only when implementation starts. This document is a plan, not a scaffold.

## Root

### `/`

Responsibility:

- Project-level configuration and architecture documents.

Allowed files later:

- `package.json`.
- `tsconfig.json`.
- `next.config.ts`.
- `.env.example`.
- `README.md`.
- `PRODUCT.md`.
- `ARCHITECTURE.md`.
- Other Phase 0 documents.

Not allowed:

- Production source files.
- Generated build output committed to source.
- Ad hoc scripts without ownership.

## Documentation

### `docs/adr/`

Responsibility:

- Architecture Decision Records.

Examples:

- `0001-use-modular-monolith.md`.
- `0002-use-supabase-auth.md`.
- `0003-use-ledger-source-of-truth.md`.

### `docs/operations/`

Responsibility:

- Runbooks for production operations.

Examples:

- Settlement failure runbook.
- Withdrawal incident runbook.
- Email delivery incident runbook.
- Database restore runbook.

### `docs/product/`

Responsibility:

- Product workflows and business behavior.

Examples:

- Investment lifecycle.
- Admin review workflow.
- Referral policy.
- Compliance checklist.

## Application Routes

### `src/app/`

Responsibility:

- Next.js App Router route tree.
- Pages, layouts, loading states, error boundaries, route handlers, and server actions.

Recommended route groups:

```text
src/app/
  (public)/
  (customer)/
  (admin)/
  api/
```

Rules:

- Route files should be thin.
- Pages load data through application queries.
- Mutations call application services.
- Route handlers parse transport and delegate.

### `src/app/(public)/`

Responsibility:

- Public marketing and product education surfaces.

Examples:

- Home.
- Plans preview.
- Legal pages.
- Auth entry points.

### `src/app/(customer)/`

Responsibility:

- Authenticated customer experience.

Examples:

- Dashboard.
- Wallet.
- Investments.
- Referrals.
- Notifications.
- Settings.

### `src/app/(admin)/`

Responsibility:

- Admin operations interface.

Examples:

- Admin dashboard.
- Users.
- Investments.
- Withdrawals.
- Settlement runs.
- Audit logs.

### `src/app/api/`

Responsibility:

- HTTP endpoints needed outside the React page model.

Examples:

- Webhooks.
- Health checks.
- Upload signing.
- Provider callbacks.

## Components

### `src/components/ui/`

Responsibility:

- Low-level design system primitives.

Examples:

- Button.
- Input.
- Modal.
- Table.
- Tabs.
- Badge.

Rules:

- No domain knowledge.
- No data fetching.
- No financial calculations.

### `src/components/layout/`

Responsibility:

- App shells, navigation, sidebars, headers, and footers.

### `src/components/feedback/`

Responsibility:

- Empty states, loading states, error states, toasts, and alerts.

## Features

### `src/features/`

Responsibility:

- UI feature composition by product area.

Examples:

```text
src/features/
  customer-dashboard/
  investment-plan-browser/
  investment-detail/
  wallet-activity/
  withdrawal-request/
  referral-center/
  admin-user-review/
  admin-settlement-monitor/
```

Rules:

- Features can import UI components.
- Features can call application queries/actions through stable interfaces.
- Features cannot import database clients.
- Features cannot own domain rules.

## Domains

### `src/domains/`

Responsibility:

- Framework-independent business logic.

Recommended domains:

```text
src/domains/
  identity/
  customer-profile/
  investment-plans/
  investments/
  ledger/
  settlement/
  payments/
  withdrawals/
  referrals/
  notifications/
  audit/
```

Each domain may contain:

```text
domain-name/
  entities/
  value-objects/
  policies/
  state-machines/
  events/
  errors.ts
  index.ts
```

Rules:

- No React.
- No Next.js.
- No Supabase SDK.
- No direct network calls.

## Application Layer

### `src/application/commands/`

Responsibility:

- Mutating use cases.

Examples:

- `create-investment`.
- `request-withdrawal`.
- `run-daily-settlement`.
- `approve-deposit`.
- `credit-referral-reward`.

### `src/application/queries/`

Responsibility:

- Read use cases for screens and APIs.

Examples:

- `get-customer-dashboard`.
- `get-wallet-activity`.
- `get-admin-settlement-run`.

### `src/application/authz/`

Responsibility:

- Authorization policies used by application services.

Examples:

- `can-review-withdrawal`.
- `can-view-user`.
- `can-run-settlement`.

### `src/application/ports/`

Responsibility:

- Interfaces implemented by infrastructure.

Examples:

- Email sender.
- Payment provider.
- File storage.
- Clock.
- Event publisher.

## Infrastructure

### `src/infrastructure/database/`

Responsibility:

- Database client setup, transaction helpers, and repository implementations.

Subfolders:

```text
database/
  repositories/
  transactions/
  mappers/
```

Rules:

- Owns SQL or query builder usage.
- Maps database rows to domain/application shapes.
- Does not define business policy.

### `src/infrastructure/auth/`

Responsibility:

- Supabase Auth integration and session helpers.

### `src/infrastructure/email/`

Responsibility:

- Resend adapter and email delivery logging.

### `src/infrastructure/storage/`

Responsibility:

- File upload storage adapters.

### `src/infrastructure/payments/`

Responsibility:

- Payment provider adapters.

### `src/infrastructure/jobs/`

Responsibility:

- Outbox worker, scheduled tasks, and job locking.

## Configuration

### `src/config/`

Responsibility:

- Typed environment configuration.

Rules:

- Environment variables are parsed once.
- Missing required variables fail fast at startup.
- Public client variables are explicitly separated from server secrets.

## Library

### `src/lib/`

Responsibility:

- Narrow, framework-agnostic utilities with no product meaning.

Allowed examples:

- Date formatting.
- Currency formatting.
- Result type helpers.
- Assertion helpers.

Not allowed:

- Financial calculations.
- API clients.
- Business rules.
- Generic dumping ground behavior.

## Styles

### `src/styles/`

Responsibility:

- Global styling and design tokens.

Rules:

- Domain styling belongs near the feature when possible.
- Global CSS should stay small.

## Tests

### `src/test/`

Responsibility:

- Test setup, factories, fixtures, and shared test helpers.

Subfolders:

```text
src/test/
  factories/
  fixtures/
  financial-cases/
  integration/
```

Rules:

- Financial regression fixtures should be human-readable.
- Test helpers must not hide important business setup.

## Supabase

### `supabase/migrations/`

Responsibility:

- Database migrations when implementation begins.

### `supabase/policies/`

Responsibility:

- Row Level Security policy drafts and generated SQL organization.

### `supabase/seed/`

Responsibility:

- Development seed data.

### `supabase/functions/`

Responsibility:

- Supabase Edge Functions only if deliberately chosen.

Rules:

- Do not split business logic between Next.js and Edge Functions casually.
- If Edge Functions are used, they should be thin adapters to clear workflows.

## Emails

### `emails/`

Responsibility:

- Transactional email templates and template previews.

Recommended structure:

```text
emails/
  templates/
  components/
  previews/
```

Rules:

- Templates receive prepared data.
- Templates do not query the database.
- Template names must match email event names.

## Scripts

### `scripts/`

Responsibility:

- Development and operational scripts.

Rules:

- Scripts must be idempotent when possible.
- Destructive scripts require explicit confirmation.
- Production scripts must have runbooks.

## Public Assets

### `public/`

Responsibility:

- Static public assets.

Rules:

- No private uploads.
- No secrets.
- No customer documents.

## Naming Rules

Use names that express product meaning:

- Prefer `settlement-runs` over `jobs`.
- Prefer `ledger-transactions` over `transactions` when financial.
- Prefer `investment-plans` over `plans` in shared contexts.
- Prefer `customer-profile` over `user-info`.

Avoid:

- `misc`.
- `common`.
- `helpers`.
- `utils` unless narrowly scoped.
- `manager` unless the responsibility is precise.

## Import Rules

Allowed:

- `app` imports `features`, `application`, `components`, `config`.
- `features` imports `components`, `application`, `lib`.
- `application` imports `domains`, `infrastructure` through ports or dependency injection.
- `infrastructure` imports `domains` and `application/ports`.
- `domains` imports only other domain code or pure library code.

Forbidden:

- `domains` importing `infrastructure`.
- `domains` importing `app`.
- `components/ui` importing business domains.
- `features` importing raw database clients.

