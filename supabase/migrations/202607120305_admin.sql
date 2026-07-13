-- Phase 3 / 05 Admin and Operations
-- System settings, feature flags, background jobs, audit logs, and security events.

create table app_private.system_settings (
  key varchar(120) primary key,
  value jsonb not null,
  description text,
  updated_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint system_settings_key_chk check (key ~ '^[a-z][a-z0-9_.]*$')
);

create index system_settings_updated_at_idx on app_private.system_settings (updated_at);

create table app_private.feature_flags (
  key varchar(120) primary key,
  status public.feature_flag_status not null default 'disabled',
  description text,
  rules jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint feature_flags_key_chk check (key ~ '^[a-z][a-z0-9_.]*$')
);

create index feature_flags_status_idx on app_private.feature_flags (status);

create table app_private.background_jobs (
  id uuid primary key default gen_random_uuid(),
  job_type varchar(120) not null,
  idempotency_key varchar(180) not null,
  payload jsonb not null default '{}'::jsonb,
  status public.background_job_status not null default 'pending',
  attempt_count integer not null default 0,
  max_attempts integer not null default 5,
  run_at timestamptz not null default now(),
  locked_by varchar(160),
  locked_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint background_jobs_attempt_count_chk check (attempt_count >= 0),
  constraint background_jobs_max_attempts_chk check (max_attempts > 0),
  constraint background_jobs_attempts_within_max_chk check (attempt_count <= max_attempts)
);

create unique index background_jobs_idempotency_key_uidx on app_private.background_jobs (idempotency_key);
create index background_jobs_status_run_at_idx on app_private.background_jobs (status, run_at);
create index background_jobs_type_status_idx on app_private.background_jobs (job_type, status);

create table audit.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.users (id) on delete set null,
  actor_type public.audit_actor_type not null,
  action varchar(160) not null,
  target_type varchar(100) not null,
  target_id varchar(120) not null,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  request_id varchar(120),
  ip_address_hash varchar(128),
  user_agent_hash varchar(128),
  created_at timestamptz not null default now(),
  constraint audit_logs_admin_financial_reason_chk check (
    actor_type <> 'admin'
    or action not in (
      'deposit.approved',
      'withdrawal.approved',
      'withdrawal.rejected',
      'settlement.manual_run',
      'settlement.manual_replay',
      'ledger.corrected',
      'investment.cancelled',
      'plan_version.activated',
      'plan_version.retired'
    )
    or reason is not null
  )
);

create index audit_logs_actor_idx on audit.audit_logs (actor_type, actor_user_id);
create index audit_logs_target_idx on audit.audit_logs (target_type, target_id);
create index audit_logs_created_at_idx on audit.audit_logs (created_at);
create index audit_logs_action_idx on audit.audit_logs (action);

create trigger audit_logs_immutable_trg
before update or delete on audit.audit_logs
for each row execute function app_private.prevent_update_delete();

create table audit.security_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete set null,
  event_type varchar(160) not null,
  severity public.security_severity not null default 'info',
  metadata jsonb not null default '{}'::jsonb,
  ip_address_hash varchar(128),
  created_at timestamptz not null default now()
);

create index security_events_user_id_idx on audit.security_events (user_id);
create index security_events_type_idx on audit.security_events (event_type);
create index security_events_severity_idx on audit.security_events (severity);
create index security_events_created_at_idx on audit.security_events (created_at);

alter table public.users enable row level security;
alter table public.customer_profiles enable row level security;
alter table public.customer_accounts enable row level security;
alter table public.wallets enable row level security;
alter table public.ledger_accounts enable row level security;
alter table public.ledger_transactions enable row level security;
alter table public.ledger_entries enable row level security;
alter table public.investments enable row level security;
alter table public.roi_schedule_items enable row level security;
alter table public.deposit_intents enable row level security;
alter table public.withdrawal_requests enable row level security;
alter table public.settlement_runs enable row level security;
alter table public.settlement_items enable row level security;
alter table public.roi_ledger_entries enable row level security;
alter table public.referral_codes enable row level security;
alter table public.referrals enable row level security;
alter table public.referral_rewards enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_channel_preferences enable row level security;

create policy users_select_own on public.users
for select using (auth_user_id = auth.uid());

create policy customer_profiles_select_own on public.customer_profiles
for select using (
  exists (
    select 1
    from public.users u
    where u.id = customer_profiles.user_id
      and u.auth_user_id = auth.uid()
  )
);

create policy customer_accounts_select_own on public.customer_accounts
for select using (
  exists (
    select 1
    from public.users u
    where u.id = customer_accounts.user_id
      and u.auth_user_id = auth.uid()
  )
);

create policy wallets_select_own on public.wallets
for select using (
  exists (
    select 1
    from public.users u
    where u.id = wallets.user_id
      and u.auth_user_id = auth.uid()
  )
);

create policy investments_select_own on public.investments
for select using (
  exists (
    select 1
    from public.users u
    where u.id = investments.user_id
      and u.auth_user_id = auth.uid()
  )
);

create policy roi_schedule_items_select_own on public.roi_schedule_items
for select using (
  exists (
    select 1
    from public.investments i
    join public.users u on u.id = i.user_id
    where i.id = roi_schedule_items.investment_id
      and u.auth_user_id = auth.uid()
  )
);

create policy deposit_intents_select_own on public.deposit_intents
for select using (
  exists (
    select 1
    from public.users u
    where u.id = deposit_intents.user_id
      and u.auth_user_id = auth.uid()
  )
);

create policy withdrawal_requests_select_own on public.withdrawal_requests
for select using (
  exists (
    select 1
    from public.users u
    where u.id = withdrawal_requests.user_id
      and u.auth_user_id = auth.uid()
  )
);

create policy referral_codes_select_own on public.referral_codes
for select using (
  exists (
    select 1
    from public.users u
    where u.id = referral_codes.user_id
      and u.auth_user_id = auth.uid()
  )
);

create policy referrals_select_participant on public.referrals
for select using (
  exists (
    select 1
    from public.users u
    where u.auth_user_id = auth.uid()
      and u.id in (referrals.referrer_user_id, referrals.referred_user_id)
  )
);

create policy referral_rewards_select_referrer on public.referral_rewards
for select using (
  exists (
    select 1
    from public.referrals r
    join public.users u on u.id = r.referrer_user_id
    where r.id = referral_rewards.referral_id
      and u.auth_user_id = auth.uid()
  )
);

create policy notifications_select_own on public.notifications
for select using (
  exists (
    select 1
    from public.users u
    where u.id = notifications.user_id
      and u.auth_user_id = auth.uid()
  )
);

create policy notification_preferences_select_own on public.notification_channel_preferences
for select using (
  exists (
    select 1
    from public.users u
    where u.id = notification_channel_preferences.user_id
      and u.auth_user_id = auth.uid()
  )
);
