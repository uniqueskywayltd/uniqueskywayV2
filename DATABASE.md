# DATABASE.md

## Purpose

This document designs the database for Unique Sky Way V2. It does not define migrations yet.

The database is the system of record for identity linkage, customer profiles, investment plans, investments, wallet accounts, ledger entries, deposits, withdrawals, settlements, referrals, notifications, email delivery, and audit logs.

Recommended database:

- PostgreSQL through Supabase.

## Database Principles

1. Ledger first.
   Balances must be reconstructable from ledger entries.

2. Immutable financial history.
   Ledger transactions, ledger entries, settlement items, and provider events are append-only.

3. Idempotency everywhere external.
   Webhooks, email sends, provider callbacks, settlement runs, and retryable commands require idempotency keys.

4. Store timestamps in UTC.
   Store New York settlement dates separately as dates.

5. Prefer constraints over conventions.
   Use unique indexes, foreign keys, check constraints, and exclusion rules wherever possible.

6. Minimize sensitive data.
   KYC documents and identity evidence should be stored with specialized providers when possible. The platform stores references and statuses.

## Schema Areas

Recommended schemas:

- `public`: safe read models and tables exposed through Supabase where appropriate.
- `app_private`: sensitive operational tables not exposed to browser clients.
- `audit`: audit and security logs.

If Supabase API exposure requires custom schema configuration, keep the exposed surface minimal.

## Core Entities

### `users`

Purpose:

- Application-level user record linked to managed auth identity.

Fields:

- `id`.
- `auth_user_id`.
- `email`.
- `email_verified_at`.
- `status`: `active`, `restricted`, `closed`.
- `created_at`.
- `updated_at`.

Constraints:

- Unique `auth_user_id`.
- Unique normalized `email`.

Indexes:

- `users_auth_user_id_idx`.
- `users_email_idx`.
- `users_status_idx`.

### `customer_profiles`

Purpose:

- Customer profile and onboarding state.

Fields:

- `id`.
- `user_id`.
- `legal_name`.
- `display_name`.
- `phone`.
- `country`.
- `state_region`.
- `date_of_birth`.
- `onboarding_status`.
- `kyc_status`.
- `risk_status`.
- `terms_accepted_at`.
- `terms_version`.
- `created_at`.
- `updated_at`.

Constraints:

- Unique `user_id`.
- Date of birth required before KYC submission if policy requires.

Indexes:

- `customer_profiles_user_id_idx`.
- `customer_profiles_kyc_status_idx`.
- `customer_profiles_risk_status_idx`.

### `admin_profiles`

Purpose:

- Admin identity, roles, and operational state.

Fields:

- `id`.
- `user_id`.
- `status`.
- `created_at`.
- `updated_at`.

Constraints:

- Unique `user_id`.

### `roles`

Purpose:

- Admin and system role definitions.

Fields:

- `id`.
- `key`.
- `name`.
- `description`.

Constraints:

- Unique `key`.

### `user_roles`

Purpose:

- Assign roles to users.

Fields:

- `user_id`.
- `role_id`.
- `granted_by`.
- `granted_at`.
- `revoked_at`.

Constraints:

- Prevent duplicate active role assignments.

Indexes:

- `user_roles_user_id_idx`.
- `user_roles_role_id_idx`.

### `trusted_devices`

Purpose:

- Track trusted device records for step-up auth decisions.

Fields:

- `id`.
- `user_id`.
- `device_token_hash`.
- `label`.
- `last_used_at`.
- `expires_at`.
- `revoked_at`.
- `created_at`.

Constraints:

- Unique active `device_token_hash`.

Indexes:

- `trusted_devices_user_id_idx`.
- `trusted_devices_token_hash_idx`.

## Investment Entities

### `investment_plans`

Purpose:

- Logical product families.

Fields:

- `id`.
- `slug`.
- `name`.
- `description`.
- `status`: `draft`, `active`, `retired`.
- `created_at`.
- `updated_at`.

Constraints:

- Unique `slug`.

### `investment_plan_versions`

Purpose:

- Immutable terms for a plan.

Fields:

- `id`.
- `plan_id`.
- `version`.
- `currency`.
- `min_principal_minor`.
- `max_principal_minor`.
- `term_days`.
- `daily_roi_bps`.
- `total_roi_bps`.
- `principal_return_policy`.
- `early_exit_policy`.
- `referral_reward_policy_id`.
- `effective_from`.
- `effective_to`.
- `status`: `draft`, `active`, `retired`.
- `created_by`.
- `created_at`.

Constraints:

- Unique `(plan_id, version)`.
- `min_principal_minor > 0`.
- `max_principal_minor >= min_principal_minor`.
- `term_days > 0`.
- ROI bps values non-negative.
- Active version date ranges must not overlap for the same plan.

Indexes:

- `investment_plan_versions_plan_id_idx`.
- `investment_plan_versions_status_idx`.
- `investment_plan_versions_effective_idx`.

### `investments`

Purpose:

- Customer investment instance with snapshotted terms.

Fields:

- `id`.
- `user_id`.
- `plan_version_id`.
- `currency`.
- `principal_minor`.
- `daily_roi_bps`.
- `term_days`.
- `start_at`.
- `first_settlement_date`.
- `maturity_date`.
- `status`: `pending`, `active`, `maturing`, `matured`, `cancelled`, `failed`.
- `rounding_residual_micro_minor`.
- `created_at`.
- `activated_at`.
- `matured_at`.
- `cancelled_at`.

Constraints:

- `principal_minor > 0`.
- Snapshotted terms not nullable after activation.
- Status transitions controlled by application service.

Indexes:

- `investments_user_id_idx`.
- `investments_status_idx`.
- `investments_maturity_date_idx`.
- `investments_first_settlement_date_idx`.

## Wallet and Ledger Entities

### `ledger_accounts`

Purpose:

- Accounts used for double-entry ledger postings.

Account examples:

- Customer cash available.
- Customer cash locked.
- Customer cash reserved.
- Customer ROI income.
- Platform clearing.
- Platform referral expense.
- Provider settlement.

Fields:

- `id`.
- `owner_type`: `user`, `platform`, `provider`.
- `owner_id`.
- `account_type`.
- `currency`.
- `status`.
- `created_at`.

Constraints:

- Unique `(owner_type, owner_id, account_type, currency)`.

Indexes:

- `ledger_accounts_owner_idx`.
- `ledger_accounts_type_idx`.

### `ledger_transactions`

Purpose:

- Immutable financial transaction header.

Fields:

- `id`.
- `transaction_type`.
- `idempotency_key`.
- `reference_type`.
- `reference_id`.
- `description`.
- `posted_at`.
- `created_by`.
- `created_at`.

Constraints:

- Unique `idempotency_key` when provided.
- Immutable after insert.

Indexes:

- `ledger_transactions_reference_idx`.
- `ledger_transactions_posted_at_idx`.
- `ledger_transactions_type_idx`.

### `ledger_entries`

Purpose:

- Debit and credit lines for ledger transactions.

Fields:

- `id`.
- `ledger_transaction_id`.
- `account_id`.
- `direction`: `debit`, `credit`.
- `amount_minor`.
- `currency`.
- `created_at`.

Constraints:

- `amount_minor > 0`.
- Currency matches account currency.
- Each ledger transaction must balance by currency.
- Immutable after insert.

Indexes:

- `ledger_entries_account_id_idx`.
- `ledger_entries_transaction_id_idx`.
- `ledger_entries_created_at_idx`.

Implementation note:

- Cross-row balance constraints require a controlled posting function or transaction-scoped validation. Application code must not insert arbitrary ledger entries without the ledger posting service.

### `account_balance_snapshots`

Purpose:

- Fast balance reads derived from ledger entries.

Fields:

- `id`.
- `account_id`.
- `balance_minor`.
- `as_of_ledger_entry_id`.
- `created_at`.

Rules:

- Snapshot is derived, not source of truth.
- Rebuildable from ledger.

## Payment Entities

### `deposit_intents`

Purpose:

- Customer deposit request before provider confirmation.

Fields:

- `id`.
- `user_id`.
- `provider`.
- `provider_intent_id`.
- `currency`.
- `amount_minor`.
- `status`: `created`, `pending`, `confirmed`, `failed`, `cancelled`, `reversed`.
- `idempotency_key`.
- `created_at`.
- `confirmed_at`.

Constraints:

- Unique provider intent.
- Unique idempotency key.
- `amount_minor > 0`.

### `withdrawal_requests`

Purpose:

- Customer withdrawal lifecycle.

Fields:

- `id`.
- `user_id`.
- `currency`.
- `amount_minor`.
- `destination_type`.
- `destination_reference`.
- `status`: `requested`, `reserved`, `under_review`, `approved`, `processing`, `paid`, `rejected`, `failed`, `cancelled`.
- `risk_score`.
- `reviewed_by`.
- `reviewed_at`.
- `review_reason`.
- `idempotency_key`.
- `created_at`.
- `updated_at`.

Constraints:

- `amount_minor > 0`.
- Review reason required for approve or reject.
- Unique idempotency key.

Indexes:

- `withdrawal_requests_user_id_idx`.
- `withdrawal_requests_status_idx`.
- `withdrawal_requests_created_at_idx`.

### `payment_provider_events`

Purpose:

- Store raw provider webhook event metadata for idempotency and audit.

Fields:

- `id`.
- `provider`.
- `provider_event_id`.
- `event_type`.
- `payload_hash`.
- `received_at`.
- `processed_at`.
- `status`.
- `error_message`.

Constraints:

- Unique `(provider, provider_event_id)`.

## Settlement Entities

### `settlement_runs`

Purpose:

- One settlement execution for one or more New York settlement dates.

Fields:

- `id`.
- `settlement_date`.
- `run_type`: `daily`, `catch_up`, `manual_replay`.
- `status`: `pending`, `running`, `completed`, `failed`, `cancelled`.
- `started_at`.
- `completed_at`.
- `locked_by`.
- `error_message`.
- `created_at`.

Constraints:

- Unique successful settlement per settlement date and run type where applicable.
- Only one active run per settlement date.

Indexes:

- `settlement_runs_date_idx`.
- `settlement_runs_status_idx`.

### `settlement_items`

Purpose:

- Per-investment settlement result.

Fields:

- `id`.
- `settlement_run_id`.
- `investment_id`.
- `settlement_date`.
- `gross_roi_micro_minor`.
- `posted_roi_minor`.
- `rounding_residual_micro_minor`.
- `ledger_transaction_id`.
- `status`: `posted`, `skipped`, `failed`.
- `reason`.
- `created_at`.

Constraints:

- Unique `(investment_id, settlement_date)`.
- Posted items require ledger transaction.

Indexes:

- `settlement_items_investment_id_idx`.
- `settlement_items_settlement_date_idx`.

## Referral Entities

### `referral_codes`

Purpose:

- Shareable referral codes.

Fields:

- `id`.
- `user_id`.
- `code`.
- `status`.
- `created_at`.

Constraints:

- Unique `code`.
- Unique active default code per user.

### `referrals`

Purpose:

- Attribution between referrer and referred user.

Fields:

- `id`.
- `referrer_user_id`.
- `referred_user_id`.
- `referral_code_id`.
- `status`: `pending`, `qualified`, `rewarded`, `voided`.
- `created_at`.
- `qualified_at`.

Constraints:

- Unique `referred_user_id`.
- `referrer_user_id != referred_user_id`.

### `referral_rewards`

Purpose:

- Reward calculation and posting.

Fields:

- `id`.
- `referral_id`.
- `investment_id`.
- `currency`.
- `amount_minor`.
- `status`: `pending`, `posted`, `voided`.
- `ledger_transaction_id`.
- `created_at`.
- `posted_at`.

Constraints:

- Unique reward per qualifying investment and policy.
- Posted rewards require ledger transaction.

## Notification and Email Entities

### `notifications`

Purpose:

- In-app notification record.

Fields:

- `id`.
- `user_id`.
- `type`.
- `title`.
- `body`.
- `data`.
- `read_at`.
- `created_at`.

Indexes:

- `notifications_user_id_created_at_idx`.
- `notifications_user_id_read_at_idx`.

### `email_messages`

Purpose:

- Transactional email lifecycle.

Fields:

- `id`.
- `recipient_user_id`.
- `to_email`.
- `template_key`.
- `template_version`.
- `idempotency_key`.
- `provider_message_id`.
- `status`: `queued`, `sent`, `delivered`, `bounced`, `complained`, `failed`, `suppressed`.
- `attempt_count`.
- `last_error`.
- `created_at`.
- `sent_at`.
- `updated_at`.

Constraints:

- Unique `idempotency_key`.

Indexes:

- `email_messages_user_id_idx`.
- `email_messages_status_idx`.
- `email_messages_template_idx`.

## Audit Entities

### `audit_logs`

Purpose:

- Immutable record of sensitive actions.

Fields:

- `id`.
- `actor_user_id`.
- `actor_type`: `customer`, `admin`, `system`.
- `action`.
- `target_type`.
- `target_id`.
- `reason`.
- `metadata`.
- `ip_address_hash`.
- `user_agent_hash`.
- `created_at`.

Constraints:

- Reason required for admin financial actions.
- Immutable after insert.

Indexes:

- `audit_logs_actor_idx`.
- `audit_logs_target_idx`.
- `audit_logs_created_at_idx`.
- `audit_logs_action_idx`.

### `security_events`

Purpose:

- Login, MFA, device, rate limit, and suspicious behavior events.

Fields:

- `id`.
- `user_id`.
- `event_type`.
- `severity`.
- `metadata`.
- `ip_address_hash`.
- `created_at`.

## Outbox Entities

### `outbox_events`

Purpose:

- Reliable side-effect dispatch.

Fields:

- `id`.
- `event_type`.
- `aggregate_type`.
- `aggregate_id`.
- `payload`.
- `status`: `pending`, `processing`, `processed`, `failed`, `dead_lettered`.
- `attempt_count`.
- `available_at`.
- `processed_at`.
- `last_error`.
- `created_at`.

Indexes:

- `outbox_events_status_available_idx`.
- `outbox_events_aggregate_idx`.

## Financial Integrity

Required protections:

- Ledger transactions must balance per currency.
- Ledger entries are append-only.
- Financial records use integer minor units for cash-visible amounts.
- ROI calculation may use higher precision internal micro-minor units.
- Cash posting rounds only through a documented policy.
- Every financial mutation has an idempotency key or unique business key.
- Reversal uses compensating entries, never deletion.
- Balance snapshots are rebuildable.
- Settlement items are unique per investment and settlement date.

## Index Strategy

Indexes should be designed around access patterns:

- Customer dashboard: investments by user and status, notifications by user and created date, ledger entries by account.
- Admin queues: withdrawals by status and created date, deposits by status, settlement runs by date and status.
- Settlement job: active investments by eligibility date and status.
- Webhooks: provider event id uniqueness.
- Audit: actor, target, action, and timestamp.

Avoid:

- Indexing every column.
- Large JSON fields without a specific query requirement.
- Using indexes to compensate for unclear queries.

## Row Level Security Strategy

Use RLS as defense in depth:

- Customers can read their own profile, investments, notifications, and safe wallet read models.
- Customers cannot write financial ledger tables directly.
- Admin access should go through server-side application services.
- Service role keys must never be available to the browser.

## Audit Strategy

Audit logs must be written for:

- Admin login.
- Role grants and revocations.
- Account restriction changes.
- KYC status changes.
- Deposit approval or correction.
- Withdrawal approval, rejection, or cancellation.
- Settlement manual run or replay.
- Investment cancellation.
- Plan version activation or retirement.
- Ledger correction.
- Email suppression override.

Audit log records are immutable.

## Backup and Recovery

Requirements:

- Automated daily backups.
- Point-in-time recovery for production.
- Regular restore drills.
- Exportable ledger reports.
- Reconciliation checks after restore.

## References

- Supabase tables and schema guidance: https://supabase.com/docs/guides/database/tables
- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Database Advisors: https://supabase.com/docs/guides/database/database-advisors
- Supabase PGAudit: https://supabase.com/docs/guides/database/extensions/pgaudit

