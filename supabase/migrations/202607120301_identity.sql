-- Phase 3 / 01 Identity
-- Establishes schemas, enum types, identity tables, role assignments, trusted devices, and sessions.

create extension if not exists pgcrypto;
create extension if not exists btree_gist;

create schema if not exists app_private;
create schema if not exists audit;
create schema if not exists auth;

do $$
begin
  if not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'auth'
      and p.proname = 'uid'
      and pg_get_function_identity_arguments(p.oid) = ''
  ) then
    create function auth.uid()
    returns uuid
    language sql
    stable
    as $fn$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $fn$;
  end if;
end;
$$;

create type public.account_status as enum ('active', 'restricted', 'closed');
create type public.admin_profile_status as enum ('active', 'suspended', 'deactivated');
create type public.audit_actor_type as enum ('customer', 'admin', 'system');
create type public.background_job_status as enum ('pending', 'running', 'completed', 'failed', 'cancelled');
create type public.deposit_status as enum ('created', 'pending', 'confirmed', 'failed', 'cancelled', 'reversed');
create type public.email_status as enum (
  'queued',
  'sending',
  'sent',
  'delivered',
  'bounced',
  'complained',
  'failed',
  'suppressed'
);
create type public.feature_flag_status as enum ('disabled', 'enabled', 'archived');
create type public.investment_plan_status as enum ('draft', 'active', 'retired');
create type public.investment_plan_version_status as enum ('draft', 'active', 'retired');
create type public.investment_status as enum ('pending', 'active', 'maturing', 'matured', 'cancelled', 'failed');
create type public.kyc_status as enum ('not_started', 'pending', 'approved', 'rejected', 'expired');
create type public.ledger_account_status as enum ('active', 'closed');
create type public.ledger_account_type as enum (
  'customer_pending_cash',
  'customer_available_cash',
  'customer_locked_principal',
  'customer_reserved_withdrawal',
  'customer_withdrawn_cash',
  'platform_cash',
  'platform_roi_expense',
  'platform_referral_expense',
  'platform_rounding',
  'provider_cash_clearing'
);
create type public.ledger_direction as enum ('debit', 'credit');
create type public.ledger_owner_type as enum ('user', 'platform', 'provider');
create type public.ledger_transaction_type as enum (
  'deposit_confirmation',
  'deposit_reversal',
  'investment_funding',
  'roi_settlement',
  'maturity_principal_release',
  'withdrawal_reservation',
  'withdrawal_payment',
  'withdrawal_release',
  'referral_reward',
  'ledger_correction'
);
create type public.notification_channel as enum ('in_app', 'email', 'sms', 'push');
create type public.notification_delivery_status as enum (
  'pending',
  'processing',
  'sent',
  'delivered',
  'failed',
  'suppressed'
);
create type public.notification_priority as enum ('info', 'success', 'warning', 'critical');
create type public.onboarding_status as enum ('not_started', 'in_progress', 'submitted', 'approved', 'rejected');
create type public.outbox_status as enum ('pending', 'processing', 'processed', 'failed', 'dead_lettered');
create type public.payment_provider_event_status as enum ('received', 'processing', 'processed', 'failed', 'ignored');
create type public.principal_return_policy as enum ('return_at_maturity', 'reinvest_at_maturity', 'manual_review');
create type public.early_exit_policy as enum ('not_allowed', 'admin_review', 'allowed_with_penalty');
create type public.referral_code_status as enum ('active', 'paused', 'retired');
create type public.referral_reward_status as enum ('pending', 'posted', 'voided');
create type public.referral_status as enum ('pending', 'qualified', 'rewarded', 'voided');
create type public.risk_status as enum ('not_reviewed', 'clear', 'watch', 'blocked');
create type public.roi_ledger_status as enum ('posted', 'reversed');
create type public.roi_schedule_status as enum ('scheduled', 'posted', 'skipped', 'failed');
create type public.security_severity as enum ('info', 'warning', 'critical');
create type public.session_status as enum ('active', 'revoked', 'expired');
create type public.settlement_item_status as enum ('posted', 'skipped', 'failed');
create type public.settlement_run_status as enum ('pending', 'running', 'completed', 'failed', 'cancelled');
create type public.settlement_run_type as enum ('daily', 'catch_up', 'manual_replay');
create type public.user_status as enum ('active', 'restricted', 'closed');
create type public.wallet_account_category as enum ('pending', 'available', 'locked', 'reserved', 'withdrawn');
create type public.wallet_status as enum ('active', 'restricted', 'closed');
create type public.withdrawal_status as enum (
  'requested',
  'reserved',
  'under_review',
  'approved',
  'processing',
  'paid',
  'rejected',
  'failed',
  'cancelled'
);

create or replace function app_private.prevent_update_delete()
returns trigger
language plpgsql
as $$
begin
  raise exception 'immutable table %.% cannot be %', tg_table_schema, tg_table_name, tg_op;
end;
$$;

create table public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null,
  email varchar(320) not null,
  email_verified_at timestamptz,
  status public.user_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_email_not_blank_chk check (length(trim(email)) > 3)
);

create unique index users_auth_user_id_uidx on public.users (auth_user_id);
create unique index users_email_uidx on public.users (lower(email));
create index users_status_idx on public.users (status);

create table public.admin_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete restrict,
  status public.admin_profile_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index admin_profiles_user_id_uidx on public.admin_profiles (user_id);
create index admin_profiles_status_idx on public.admin_profiles (status);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  key varchar(80) not null,
  name varchar(120) not null,
  description varchar(500),
  created_at timestamptz not null default now(),
  constraint roles_key_format_chk check (key ~ '^[a-z][a-z0-9_]*$')
);

create unique index roles_key_uidx on public.roles (key);

create table public.user_roles (
  user_id uuid not null references public.users (id) on delete cascade,
  role_id uuid not null references public.roles (id) on delete restrict,
  granted_by uuid references public.users (id) on delete set null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  constraint user_roles_pk primary key (user_id, role_id, granted_at),
  constraint user_roles_revoked_after_grant_chk check (revoked_at is null or revoked_at >= granted_at)
);

create unique index user_roles_active_uidx on public.user_roles (user_id, role_id) where revoked_at is null;
create index user_roles_user_id_idx on public.user_roles (user_id);
create index user_roles_role_id_idx on public.user_roles (role_id);

create table public.trusted_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  device_token_hash varchar(128) not null,
  label varchar(120),
  last_used_at timestamptz,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint trusted_devices_expiry_chk check (expires_at > created_at),
  constraint trusted_devices_revoked_after_created_chk check (revoked_at is null or revoked_at >= created_at)
);

create unique index trusted_devices_active_token_hash_uidx
  on public.trusted_devices (device_token_hash)
  where revoked_at is null;
create index trusted_devices_user_id_idx on public.trusted_devices (user_id);
create index trusted_devices_expires_at_idx on public.trusted_devices (expires_at);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  supabase_session_id varchar(160),
  session_token_hash varchar(128) not null,
  trusted_device_id uuid references public.trusted_devices (id) on delete set null,
  status public.session_status not null default 'active',
  step_up_verified_at timestamptz,
  last_seen_at timestamptz,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  ip_address_hash varchar(128),
  user_agent_hash varchar(128),
  created_at timestamptz not null default now(),
  constraint sessions_expiry_chk check (expires_at > created_at),
  constraint sessions_revoked_after_created_chk check (revoked_at is null or revoked_at >= created_at)
);

create unique index sessions_token_hash_uidx on public.sessions (session_token_hash);
create unique index sessions_supabase_session_id_uidx on public.sessions (supabase_session_id);
create index sessions_user_status_idx on public.sessions (user_id, status);
create index sessions_expires_at_idx on public.sessions (expires_at);
