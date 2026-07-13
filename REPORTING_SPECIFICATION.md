# REPORTING_SPECIFICATION.md

## Purpose

This document is the governance specification for Unique Sky Way V2 administrative reporting and exports (Phase 8.4).

It defines:

- every report and its purpose
- the exact certified data source for each metric
- aggregation and timezone rules
- export formats and audit requirements
- access permissions
- performance expectations

Reports are **read-only projections** of certified operational and financial data.  
They are **never** a source of truth and must never mutate state or redefine financial mathematics.

## Authority

Reporting must comply with:

- `ADMIN_PERMISSION_MATRIX.md`
- `DEC-0022` (money movement freeze)
- `DEC-0016` (investment engine lock)
- `DEC-0023` (database-backed admin RBAC)
- `FINANCIAL_INVARIANTS.md`
- `LEDGER_POSTING_RULES.md`
- `ROI_ENGINE.md`

If a report metric conflicts with a certified engine or invariant document, the certified source wins and this specification must be corrected.

## Absolute Rules

1. Reports are read-only.
2. Reports must not call deposit/withdrawal mutation APIs or post ledger entries.
3. Reports must not invent ROI, settlement, or money-movement formulas.
4. Aggregations must use stored amounts and statuses already produced by certified engines.
5. Financial period buckets use **America/New_York** (`FINANCIAL_TIME_ZONE`).
6. Export operations require `reports.export` and must write an audit log.
7. Report viewing requires `reports.read`.

## Permissions

| Permission | Use |
| --- | --- |
| `reports.read` | View any Phase 8.4 report payload |
| `reports.export` | Generate CSV or Excel exports (elevated) |

## Timezone Policy

- Financial totals and period series (daily / weekly / monthly / yearly) bucket by **America/New_York** calendar dates.
- Non-financial operational timestamps may be returned as ISO-8601 UTC and labeled as such.
- Export filenames include the New York date of generation when a report date is unspecified.

## Report Catalog

### 1. Executive Dashboard (`executive`)

Purpose: Single-page operational snapshot for leadership and ops.

| Metric | Data source | Aggregation rule |
| --- | --- | --- |
| Total customers | `customer_accounts` | `count(*)` |
| Verified customers | `customer_profiles` | `kyc_status = 'approved'` |
| Suspended customers | `customer_accounts` | `status = 'suspended'` |
| Active investments | `investments` | `status = 'active'` |
| Matured investments | `investments` | `status = 'matured'` |
| Pending deposits | `deposit_intents` | `status in ('created', 'pending')` |
| Pending withdrawals | `withdrawal_requests` | `status in ('under_review', 'approved')` |
| Total deposits (amount) | `deposit_intents` | `sum(amount_minor)` where `status = 'confirmed'` |
| Total withdrawals (amount) | `withdrawal_requests` | `sum(amount_minor)` where `status in ('paid', 'completed')` when present; else paid-out terminal statuses from schema |
| Total ROI paid | `settlement_items` | `sum(posted_roi_minor)` where status indicates posted |
| System health summary | background jobs + provider events counts | reuse certified count queries; no new health probes that mutate state |

### 2. Customer Reports (`customers`)

| Report kind | Purpose | Source |
| --- | --- | --- |
| `growth` | Customer account creation over time | `customer_accounts.created_at` bucketed NY |
| `verification` | KYC status distribution | `customer_profiles.kyc_status` |
| `active_users` | Customers with `status = 'active'` | `customer_accounts` |
| `login_activity` | Session / security login events | `sessions`, `security_events` |
| `geography` | Country distribution where available | `customer_profiles.country` |
| `referrals` | Referral counts by status | `referrals`, `referral_rewards` |
| `export` | Tabular customer export rows | join `users` + `customer_accounts` + `customer_profiles` |

### 3. Financial Reports (`financial`)

| Report kind | Purpose | Source |
| --- | --- | --- |
| `deposits` | Deposit counts and amounts by status | `deposit_intents` |
| `withdrawals` | Withdrawal counts and amounts by status | `withdrawal_requests` |
| `investments` | Investment counts/principal by status | `investments` |
| `settlements` | Settlement runs and item counts by status | `settlement_runs`, `settlement_items` |
| `roi` | Posted ROI totals | `roi_ledger_entries` / posted `settlement_items.posted_roi_minor` |
| `ledger` | Ledger transaction and entry counts; debit/credit sums | `ledger_transactions`, `ledger_entries` |
| `period` | Daily/weekly/monthly/yearly money totals | deposits success + withdrawals success + posted ROI, bucketed NY |

Period granularity values: `day`, `week`, `month`, `year`.

### 4. Operational Reports (`operational`)

| Report kind | Purpose | Source |
| --- | --- | --- |
| `jobs` | Background job counts by status | `background_jobs` |
| `email` | Email message counts by status | `email_messages` |
| `notifications` | Notification + delivery counts | `notifications`, `notification_deliveries` |
| `webhooks` | Provider event counts by status / DLQ | `payment_provider_events` |
| `security` | Security event counts by severity | `security_events` |
| `audit` | Audit activity counts by action (bounded) | `audit_logs` |

### 5. System Reports (`system`)

Purpose: Release and runtime diagnostics for admins.

| Field | Source |
| --- | --- |
| Version | `package.json` version |
| Git commit | `VERCEL_GIT_COMMIT_SHA` / `GIT_COMMIT` |
| Release tag | `VERCEL_GIT_COMMIT_REF` / `RELEASE_TAG` |
| Environment | `NODE_ENV` |
| Scheduler / queue status | background job status counts |
| Database status | connectivity probe (read-only select) |
| Email status | queued/failed email counts |
| Storage status | reported as `unknown` unless a storage health adapter exists (no fake success) |

## Filters

Every list/series report accepts:

| Filter | Meaning |
| --- | --- |
| `from` / `to` | Inclusive New York date range (`YYYY-MM-DD`) converted to timestamptz bounds |
| `status` | Domain status filter when applicable |
| `customerId` | Restrict to one customer/user id |
| `investmentId` | Restrict to one investment |
| `reference` | Provider/reference search where indexed |
| `q` | Free-text search for exportable tabular reports |
| `limit` / `cursor` | Pagination |
| `sort` / `direction` | Sorting for tabular rows |

Filters that do not apply to a report kind are ignored (not treated as errors).

## Exports

Supported formats:

- `csv` — UTF-8 CSV with header row
- `xlsx` — Excel workbook (`.xlsx`)

Not in Phase 8.4:

- PDF

Export requests:

1. Require `reports.export`
2. Re-run the same read-only query as the on-screen report
3. Append `audit_logs` with action `report.exported` including report key, filters, format, IP/user-agent hashes
4. Cap large exports with a hard row limit (default 10_000) and document truncation metadata

Streaming:

- Prefer generating the full export payload in-memory for Phase 8.4 sized admin datasets
- Where row volume exceeds the hard cap, return truncated CSV/XLSX and `truncated: true`

## Performance Expectations

- Use server-side SQL aggregation (`count`, `sum`, `group by`)
- Prefer indexed columns: status, created_at, user_id, settlement_date
- Avoid selecting full tables into application memory for dashboard metrics
- No N+1 queries
- Reporting endpoints remain thin; aggregation lives in repositories
- Target p95 under a few seconds for default date windows on production indexes

## Architecture

```text
Route handler (auth + parse)
  → AdminReportingService (permission + orchestration + audit)
    → ReportingRepository / existing read repositories (SQL only)
```

Pages are out of Phase 8.4 scope (API-first). Phase 8.5 may add UI over these contracts.

## Non-Goals

- Charts that invent new business logic
- Customer-facing dashboards
- Marketing analytics funnels
- New financial calculations or shadow ledgers
- Referral program redesign
- Investment or money-movement engine changes

## Certification Checklist

Phase 8.4 is complete only if:

- Reports are read-only
- No frozen financial engine files are modified
- Exports are audited
- `reports.read` / `reports.export` are enforced
- Tests, build, db check, and e2e pass
