# PERFORMANCE.md

## Purpose

This document explains how Unique Sky Way V2 should remain fast as it grows.

Performance goals:

- Fast first load.
- Fast authenticated navigation.
- Fast admin tables.
- Fast financial workflows.
- Predictable database latency.
- Small client bundle.
- Low operational complexity.

## Performance Philosophy

1. Server-first rendering.
   Keep data-heavy screens on the server.

2. Small client surface.
   Ship JavaScript only for interaction.

3. Database access by use case.
   Query exactly what the screen or workflow needs.

4. Cache safe data.
   Never cache private financial data without a clear invalidation model.

5. Background side effects.
   Email, notifications, and provider calls should not block user-facing financial transactions unless required.

## Server Components

Use React Server Components by default.

Benefits:

- Less browser JavaScript.
- Direct server-side data loading.
- Better performance for dashboards and admin screens.
- Cleaner separation between data and interactivity.

Recommended Server Component screens:

- Customer dashboard.
- Wallet activity.
- Investment list.
- Investment detail.
- Referral overview.
- Admin user review.
- Admin settlement monitor.
- Admin withdrawal queue.

Use Client Components only for:

- Forms with live validation.
- Interactive filters.
- Charts.
- Modals.
- Upload widgets.
- Optimistic UI where safe.

## Caching

Cache categories:

### Public static data

Examples:

- Public investment plan summaries.
- Legal pages.
- Marketing content.

Strategy:

- Static or revalidated caching.
- Invalidate when plan versions or legal content change.

### Authenticated customer data

Examples:

- Wallet balances.
- Investments.
- Notifications.

Strategy:

- Prefer fresh server reads.
- Use short-lived request-level caching only.
- Revalidate after mutations.

### Admin operational data

Examples:

- Queue counts.
- Settlement run list.

Strategy:

- Short TTL where acceptable.
- Manual refresh for operations screens.
- Never hide critical failed states behind stale cache.

### Financial calculations

Strategy:

- Do not cache as source of truth.
- Persist settlement results.
- Cache read models derived from ledger if rebuildable.

## Dynamic Imports

Use dynamic imports for:

- Charts.
- Rich tables if heavy.
- File upload widgets.
- Admin-only tools.
- Template previews.
- Date range pickers if large.

Rules:

- Do not dynamically import core navigation or primary content needed for first meaningful paint.
- Prefer Server Components before reaching for dynamic imports.

## Code Splitting

Next.js route-based code splitting should be supported by:

- Route groups for public, customer, and admin surfaces.
- Admin-only components not imported into customer routes.
- Feature modules with clear boundaries.
- Provider SDKs kept server-side.

Rules:

- Avoid global imports of charting libraries.
- Avoid adding heavy client libraries for simple interactions.
- Analyze bundle size before production certification.

## Image Optimization

Use optimized image delivery for:

- Public product images.
- Profile images if added.
- Marketing assets.

Rules:

- No oversized hero assets.
- Define dimensions to avoid layout shift.
- Use modern formats where supported.
- Private documents are not public optimized images.

## Database Optimization

Principles:

- Design indexes around queries.
- Avoid N+1 query patterns.
- Use cursor pagination for large lists.
- Keep admin filters backed by indexes.
- Store read models only when they reduce repeated expensive joins.
- Use query plans during certification.

Important query paths:

- Customer dashboard.
- Wallet transactions.
- Investment detail.
- Settlement eligible investments.
- Withdrawal review queue.
- Ledger transaction search.
- Audit log search.

Financial tables:

- Ledger entries can grow quickly.
- Partitioning may be required later by date or account category.
- Avoid scanning ledger entries for every dashboard load.
- Use balance snapshots or read models for fast reads, while ledger remains source of truth.

## Lazy Loading

Lazy load:

- Below-the-fold dashboard sections.
- Long transaction history.
- Admin details panels.
- Optional charts.
- Notification history.

Do not lazy load:

- Current wallet balance.
- Critical investment status.
- Security prompts.
- Error states.

## Bundle Size

Rules:

- Keep most code server-side.
- Use lightweight UI primitives.
- Avoid large date libraries if platform APIs or small libraries are enough.
- Avoid global state libraries unless proven necessary.
- Keep provider SDKs out of client bundles.
- Use bundle analyzer before launch.

## Cold Starts

If deployed on serverless:

- Keep server imports lean.
- Avoid heavy ORM initialization.
- Avoid loading admin-only code into public routes.
- Keep route handlers focused.

If deployed on Namecheap Node.js hosting:

- Use a long-running Node process where supported.
- Avoid relying on in-memory state.
- Configure startup health checks.
- Keep background jobs idempotent because process restarts can happen.

## Background Work

Slow or retryable work should move out of request path:

- Email sending.
- Notification fanout.
- Provider reconciliation.
- Settlement catch-up.
- Report generation.

Financial mutation requests should commit database state first and emit outbox events.

## Performance Budgets

Recommended certification budgets:

- Public page first load: under 2.5s LCP on mid-tier mobile.
- Authenticated dashboard server response: under 500ms p95 after warmup.
- Customer mutation response: under 1s p95 excluding provider redirect flows.
- Admin queue list: under 800ms p95.
- Settlement throughput: documented number of investments per minute before launch.
- Client JS for customer dashboard: budget defined after design system selection, reviewed before launch.

## Monitoring

Track:

- Web vitals.
- API latency p50/p95/p99.
- Database query latency.
- Slow queries.
- Error rate.
- Outbox lag.
- Settlement duration.
- Email send latency.
- Cache hit rates for public content.

## References

- Next.js Server and Client Components: https://nextjs.org/docs/app/getting-started/server-and-client-components
- Next.js caching: https://nextjs.org/docs/app/getting-started/caching
- Next.js Route Handlers caching behavior: https://nextjs.org/docs/app/getting-started/route-handlers

