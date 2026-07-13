-- Phase 3 / 02 Core
-- Customer profile, customer account, investment plan, and immutable plan-version terms.

create table public.customer_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  legal_name varchar(200),
  display_name varchar(120),
  phone varchar(40),
  country varchar(2),
  state_region varchar(80),
  date_of_birth date,
  onboarding_status public.onboarding_status not null default 'not_started',
  kyc_status public.kyc_status not null default 'not_started',
  risk_status public.risk_status not null default 'not_reviewed',
  terms_accepted_at timestamptz,
  terms_version varchar(40),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_profiles_country_chk check (country is null or country ~ '^[A-Z]{2}$'),
  constraint customer_profiles_terms_pair_chk check (
    (terms_accepted_at is null and terms_version is null)
    or (terms_accepted_at is not null and terms_version is not null)
  )
);

create unique index customer_profiles_user_id_uidx on public.customer_profiles (user_id);
create index customer_profiles_kyc_status_idx on public.customer_profiles (kyc_status);
create index customer_profiles_risk_status_idx on public.customer_profiles (risk_status);

create table public.customer_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete restrict,
  account_number varchar(40) not null,
  status public.account_status not null default 'active',
  restriction_reason varchar(500),
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_accounts_closed_status_chk check (
    (status = 'closed' and closed_at is not null)
    or (status <> 'closed' and closed_at is null)
  ),
  constraint customer_accounts_restriction_reason_chk check (
    status <> 'restricted'
    or restriction_reason is not null
  )
);

create unique index customer_accounts_user_id_uidx on public.customer_accounts (user_id);
create unique index customer_accounts_account_number_uidx on public.customer_accounts (account_number);
create index customer_accounts_status_idx on public.customer_accounts (status);

create table public.investment_plans (
  id uuid primary key default gen_random_uuid(),
  slug varchar(100) not null,
  name varchar(160) not null,
  description text,
  status public.investment_plan_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint investment_plans_slug_format_chk check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create unique index investment_plans_slug_uidx on public.investment_plans (slug);
create index investment_plans_status_idx on public.investment_plans (status);

create table public.investment_plan_versions (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.investment_plans (id) on delete restrict,
  version integer not null,
  currency varchar(3) not null,
  min_principal_minor bigint not null,
  max_principal_minor bigint not null,
  term_days integer not null,
  daily_roi_bps integer not null,
  total_roi_bps integer,
  principal_return_policy public.principal_return_policy not null,
  early_exit_policy public.early_exit_policy not null default 'not_allowed',
  referral_reward_policy_id uuid,
  effective_from timestamptz not null,
  effective_to timestamptz,
  status public.investment_plan_version_status not null default 'draft',
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint investment_plan_versions_plan_version_uidx unique (plan_id, version),
  constraint investment_plan_versions_version_positive_chk check (version > 0),
  constraint investment_plan_versions_currency_chk check (currency ~ '^[A-Z]{3}$'),
  constraint investment_plan_versions_min_principal_chk check (min_principal_minor > 0),
  constraint investment_plan_versions_max_principal_chk check (max_principal_minor >= min_principal_minor),
  constraint investment_plan_versions_term_days_chk check (term_days > 0),
  constraint investment_plan_versions_daily_roi_chk check (daily_roi_bps >= 0),
  constraint investment_plan_versions_total_roi_chk check (total_roi_bps is null or total_roi_bps >= 0),
  constraint investment_plan_versions_effective_range_chk check (
    effective_to is null
    or effective_to > effective_from
  )
);

alter table public.investment_plan_versions
  add constraint investment_plan_versions_active_range_excl
  exclude using gist (
    plan_id with =,
    tstzrange(effective_from, coalesce(effective_to, 'infinity'::timestamptz), '[)') with &&
  )
  where (status = 'active');

create index investment_plan_versions_plan_id_idx on public.investment_plan_versions (plan_id);
create index investment_plan_versions_status_idx on public.investment_plan_versions (status);
create index investment_plan_versions_effective_idx on public.investment_plan_versions (effective_from, effective_to);
