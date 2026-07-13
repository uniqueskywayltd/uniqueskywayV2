-- Phase 3 / 03 Financial
-- Ledger-first wallet, investments, ROI schedule, settlement, deposits, withdrawals, and referrals.

create table public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete restrict,
  currency varchar(3) not null,
  status public.wallet_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint wallets_currency_chk check (currency ~ '^[A-Z]{3}$')
);

create unique index wallets_user_currency_uidx on public.wallets (user_id, currency);
create index wallets_user_id_idx on public.wallets (user_id);
create index wallets_status_idx on public.wallets (status);

create table public.ledger_accounts (
  id uuid primary key default gen_random_uuid(),
  owner_type public.ledger_owner_type not null,
  owner_id varchar(120) not null,
  account_type public.ledger_account_type not null,
  currency varchar(3) not null,
  status public.ledger_account_status not null default 'active',
  created_at timestamptz not null default now(),
  constraint ledger_accounts_currency_chk check (currency ~ '^[A-Z]{3}$'),
  constraint ledger_accounts_owner_id_not_blank_chk check (length(trim(owner_id)) > 0)
);

create unique index ledger_accounts_owner_type_currency_uidx
  on public.ledger_accounts (owner_type, owner_id, account_type, currency);
create index ledger_accounts_owner_idx on public.ledger_accounts (owner_type, owner_id);
create index ledger_accounts_type_idx on public.ledger_accounts (account_type);

create table public.wallet_account_links (
  wallet_id uuid not null references public.wallets (id) on delete cascade,
  ledger_account_id uuid not null references public.ledger_accounts (id) on delete restrict,
  category public.wallet_account_category not null,
  created_at timestamptz not null default now()
);

create unique index wallet_account_links_wallet_category_uidx
  on public.wallet_account_links (wallet_id, category);
create unique index wallet_account_links_ledger_account_uidx
  on public.wallet_account_links (ledger_account_id);
create index wallet_account_links_wallet_id_idx on public.wallet_account_links (wallet_id);

create table public.ledger_transactions (
  id uuid primary key default gen_random_uuid(),
  transaction_type public.ledger_transaction_type not null,
  idempotency_key varchar(180),
  reference_type varchar(80) not null,
  reference_id varchar(120) not null,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  posted_at timestamptz not null default now(),
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint ledger_transactions_reference_not_blank_chk check (
    length(trim(reference_type)) > 0
    and length(trim(reference_id)) > 0
  )
);

create unique index ledger_transactions_idempotency_key_uidx on public.ledger_transactions (idempotency_key);
create index ledger_transactions_reference_idx on public.ledger_transactions (reference_type, reference_id);
create index ledger_transactions_posted_at_idx on public.ledger_transactions (posted_at);
create index ledger_transactions_type_idx on public.ledger_transactions (transaction_type);

create trigger ledger_transactions_immutable_trg
before update or delete on public.ledger_transactions
for each row execute function app_private.prevent_update_delete();

create table public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  ledger_transaction_id uuid not null references public.ledger_transactions (id) on delete restrict,
  account_id uuid not null references public.ledger_accounts (id) on delete restrict,
  direction public.ledger_direction not null,
  amount_minor bigint not null,
  currency varchar(3) not null,
  created_at timestamptz not null default now(),
  constraint ledger_entries_amount_positive_chk check (amount_minor > 0),
  constraint ledger_entries_currency_chk check (currency ~ '^[A-Z]{3}$')
);

create index ledger_entries_account_id_idx on public.ledger_entries (account_id);
create index ledger_entries_transaction_id_idx on public.ledger_entries (ledger_transaction_id);
create index ledger_entries_created_at_idx on public.ledger_entries (created_at);

create or replace function app_private.enforce_ledger_entry_currency()
returns trigger
language plpgsql
as $$
declare
  expected_currency varchar(3);
begin
  select currency into expected_currency
  from public.ledger_accounts
  where id = new.account_id;

  if expected_currency is null then
    raise exception 'ledger account % does not exist', new.account_id;
  end if;

  if new.currency <> expected_currency then
    raise exception 'ledger entry currency % does not match account currency %', new.currency, expected_currency;
  end if;

  return new;
end;
$$;

create trigger ledger_entries_currency_trg
before insert or update on public.ledger_entries
for each row execute function app_private.enforce_ledger_entry_currency();

create or replace function app_private.assert_ledger_transaction_balances()
returns trigger
language plpgsql
as $$
declare
  affected_transaction_id uuid;
  total_entries integer;
  imbalance_count integer;
begin
  if tg_table_name = 'ledger_transactions' then
    affected_transaction_id := new.id;
  else
    affected_transaction_id := coalesce(new.ledger_transaction_id, old.ledger_transaction_id);
  end if;

  select count(*) into total_entries
  from public.ledger_entries
  where ledger_transaction_id = affected_transaction_id;

  if total_entries < 2 then
    raise exception 'ledger transaction % must contain at least two entries', affected_transaction_id;
  end if;

  select count(*) into imbalance_count
  from (
    select
      currency,
      count(*) as entry_count,
      sum(case when direction = 'credit' then amount_minor else -amount_minor end) as balance_minor
    from public.ledger_entries
    where ledger_transaction_id = affected_transaction_id
    group by currency
  ) balances
  where balances.entry_count < 2
     or balances.balance_minor <> 0;

  if imbalance_count > 0 then
    raise exception 'ledger transaction % is not balanced by currency', affected_transaction_id;
  end if;

  return null;
end;
$$;

create constraint trigger ledger_transactions_entries_ctr
after insert on public.ledger_transactions
deferrable initially deferred
for each row execute function app_private.assert_ledger_transaction_balances();

create constraint trigger ledger_entries_balance_ctr
after insert or update or delete on public.ledger_entries
deferrable initially deferred
for each row execute function app_private.assert_ledger_transaction_balances();

create trigger ledger_entries_immutable_trg
before update or delete on public.ledger_entries
for each row execute function app_private.prevent_update_delete();

create table public.account_balance_snapshots (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.ledger_accounts (id) on delete restrict,
  balance_minor bigint not null,
  as_of_ledger_entry_id uuid not null references public.ledger_entries (id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint account_balance_snapshots_account_entry_uidx unique (account_id, as_of_ledger_entry_id)
);

create index account_balance_snapshots_account_created_idx
  on public.account_balance_snapshots (account_id, created_at);

create table public.investments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete restrict,
  plan_version_id uuid not null references public.investment_plan_versions (id) on delete restrict,
  currency varchar(3) not null,
  principal_minor bigint not null,
  daily_roi_bps integer not null,
  term_days integer not null,
  start_at timestamptz,
  first_settlement_date date,
  maturity_date date,
  status public.investment_status not null default 'pending',
  rounding_residual_micro_minor bigint not null default 0,
  created_at timestamptz not null default now(),
  activated_at timestamptz,
  matured_at timestamptz,
  cancelled_at timestamptz,
  constraint investments_currency_chk check (currency ~ '^[A-Z]{3}$'),
  constraint investments_principal_positive_chk check (principal_minor > 0),
  constraint investments_daily_roi_chk check (daily_roi_bps >= 0),
  constraint investments_term_days_chk check (term_days > 0),
  constraint investments_residual_non_negative_chk check (rounding_residual_micro_minor >= 0),
  constraint investments_activation_fields_chk check (
    status in ('pending', 'failed', 'cancelled')
    or (
      start_at is not null
      and activated_at is not null
      and first_settlement_date is not null
      and maturity_date is not null
    )
  ),
  constraint investments_maturity_range_chk check (
    first_settlement_date is null
    or maturity_date is null
    or maturity_date >= first_settlement_date
  )
);

create index investments_user_id_idx on public.investments (user_id);
create index investments_status_idx on public.investments (status);
create index investments_maturity_date_idx on public.investments (maturity_date);
create index investments_first_settlement_date_idx on public.investments (first_settlement_date);
create index investments_active_settlement_idx
  on public.investments (status, first_settlement_date, maturity_date);

create table public.roi_schedule_items (
  id uuid primary key default gen_random_uuid(),
  investment_id uuid not null references public.investments (id) on delete restrict,
  sequence_number integer not null,
  earning_date date not null,
  settlement_date date not null,
  expected_roi_micro_minor bigint not null,
  status public.roi_schedule_status not null default 'scheduled',
  created_at timestamptz not null default now(),
  posted_at timestamptz,
  constraint roi_schedule_items_sequence_positive_chk check (sequence_number > 0),
  constraint roi_schedule_items_expected_non_negative_chk check (expected_roi_micro_minor >= 0),
  constraint roi_schedule_items_settlement_after_earning_chk check (settlement_date >= earning_date)
);

create unique index roi_schedule_items_investment_sequence_uidx
  on public.roi_schedule_items (investment_id, sequence_number);
create unique index roi_schedule_items_investment_earning_date_uidx
  on public.roi_schedule_items (investment_id, earning_date);
create index roi_schedule_items_due_idx on public.roi_schedule_items (status, settlement_date);

create table public.deposit_intents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete restrict,
  provider varchar(80) not null,
  provider_intent_id varchar(180) not null,
  currency varchar(3) not null,
  amount_minor bigint not null,
  status public.deposit_status not null default 'created',
  idempotency_key varchar(180) not null,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  constraint deposit_intents_currency_chk check (currency ~ '^[A-Z]{3}$'),
  constraint deposit_intents_amount_positive_chk check (amount_minor > 0),
  constraint deposit_intents_confirmed_at_chk check (
    (status = 'confirmed' and confirmed_at is not null)
    or status <> 'confirmed'
  )
);

create unique index deposit_intents_provider_intent_uidx on public.deposit_intents (provider, provider_intent_id);
create unique index deposit_intents_idempotency_key_uidx on public.deposit_intents (idempotency_key);
create index deposit_intents_user_id_idx on public.deposit_intents (user_id);
create index deposit_intents_status_idx on public.deposit_intents (status);

create table public.withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete restrict,
  currency varchar(3) not null,
  amount_minor bigint not null,
  destination_type varchar(80) not null,
  destination_reference varchar(240) not null,
  status public.withdrawal_status not null default 'requested',
  risk_score integer,
  reviewed_by uuid references public.users (id) on delete set null,
  reviewed_at timestamptz,
  review_reason text,
  idempotency_key varchar(180) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint withdrawal_requests_currency_chk check (currency ~ '^[A-Z]{3}$'),
  constraint withdrawal_requests_amount_positive_chk check (amount_minor > 0),
  constraint withdrawal_requests_risk_score_chk check (risk_score is null or risk_score between 0 and 100),
  constraint withdrawal_requests_review_reason_chk check (
    status not in ('approved', 'rejected')
    or (reviewed_by is not null and reviewed_at is not null and review_reason is not null)
  )
);

create unique index withdrawal_requests_idempotency_key_uidx on public.withdrawal_requests (idempotency_key);
create index withdrawal_requests_user_id_idx on public.withdrawal_requests (user_id);
create index withdrawal_requests_status_idx on public.withdrawal_requests (status);
create index withdrawal_requests_created_at_idx on public.withdrawal_requests (created_at);

create table public.payment_provider_events (
  id uuid primary key default gen_random_uuid(),
  provider varchar(80) not null,
  provider_event_id varchar(180) not null,
  event_type varchar(160) not null,
  payload_hash varchar(128) not null,
  status public.payment_provider_event_status not null default 'received',
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  error_message text
);

create unique index payment_provider_events_provider_event_uidx
  on public.payment_provider_events (provider, provider_event_id);
create index payment_provider_events_status_idx on public.payment_provider_events (status);
create index payment_provider_events_received_at_idx on public.payment_provider_events (received_at);

create table public.settlement_runs (
  id uuid primary key default gen_random_uuid(),
  settlement_date date not null,
  run_type public.settlement_run_type not null,
  status public.settlement_run_status not null default 'pending',
  started_at timestamptz,
  completed_at timestamptz,
  locked_by varchar(160),
  error_message text,
  created_at timestamptz not null default now(),
  constraint settlement_runs_completed_after_start_chk check (
    completed_at is null
    or started_at is null
    or completed_at >= started_at
  )
);

create index settlement_runs_date_idx on public.settlement_runs (settlement_date);
create index settlement_runs_status_idx on public.settlement_runs (status);
create unique index settlement_runs_active_date_uidx
  on public.settlement_runs (settlement_date)
  where status in ('pending', 'running');
create unique index settlement_runs_success_date_type_uidx
  on public.settlement_runs (settlement_date, run_type)
  where status = 'completed';

create table public.settlement_items (
  id uuid primary key default gen_random_uuid(),
  settlement_run_id uuid not null references public.settlement_runs (id) on delete restrict,
  investment_id uuid not null references public.investments (id) on delete restrict,
  settlement_date date not null,
  gross_roi_micro_minor bigint not null,
  posted_roi_minor bigint not null,
  rounding_residual_micro_minor bigint not null,
  ledger_transaction_id uuid references public.ledger_transactions (id) on delete restrict,
  status public.settlement_item_status not null,
  reason text,
  created_at timestamptz not null default now(),
  constraint settlement_items_gross_non_negative_chk check (gross_roi_micro_minor >= 0),
  constraint settlement_items_posted_non_negative_chk check (posted_roi_minor >= 0),
  constraint settlement_items_residual_non_negative_chk check (rounding_residual_micro_minor >= 0),
  constraint settlement_items_posted_requires_ledger_chk check (
    status <> 'posted'
    or ledger_transaction_id is not null
  )
);

create unique index settlement_items_investment_date_uidx
  on public.settlement_items (investment_id, settlement_date);
create index settlement_items_investment_id_idx on public.settlement_items (investment_id);
create index settlement_items_settlement_date_idx on public.settlement_items (settlement_date);
create index settlement_items_run_id_idx on public.settlement_items (settlement_run_id);

create trigger settlement_items_immutable_trg
before update or delete on public.settlement_items
for each row execute function app_private.prevent_update_delete();

create table public.roi_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  investment_id uuid not null references public.investments (id) on delete restrict,
  settlement_item_id uuid not null references public.settlement_items (id) on delete restrict,
  earning_date date not null,
  settlement_date date not null,
  principal_minor bigint not null,
  daily_roi_bps integer not null,
  gross_roi_micro_minor bigint not null,
  previous_residual_micro_minor bigint not null,
  posted_roi_minor bigint not null,
  next_residual_micro_minor bigint not null,
  ledger_transaction_id uuid not null references public.ledger_transactions (id) on delete restrict,
  calculation_version varchar(40) not null default 'roi-v1',
  status public.roi_ledger_status not null default 'posted',
  created_at timestamptz not null default now(),
  constraint roi_ledger_entries_principal_positive_chk check (principal_minor > 0),
  constraint roi_ledger_entries_daily_roi_chk check (daily_roi_bps >= 0),
  constraint roi_ledger_entries_micro_values_chk check (
    gross_roi_micro_minor >= 0
    and previous_residual_micro_minor >= 0
    and posted_roi_minor >= 0
    and next_residual_micro_minor >= 0
  )
);

create unique index roi_ledger_entries_investment_earning_date_uidx
  on public.roi_ledger_entries (investment_id, earning_date);
create unique index roi_ledger_entries_settlement_item_uidx
  on public.roi_ledger_entries (settlement_item_id);
create index roi_ledger_entries_settlement_date_idx on public.roi_ledger_entries (settlement_date);

create trigger roi_ledger_entries_immutable_trg
before update or delete on public.roi_ledger_entries
for each row execute function app_private.prevent_update_delete();

create table public.referral_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  code varchar(40) not null,
  status public.referral_code_status not null default 'active',
  is_default boolean not null default true,
  created_at timestamptz not null default now(),
  constraint referral_codes_code_format_chk check (code ~ '^[A-Z0-9]{4,40}$')
);

create unique index referral_codes_code_uidx on public.referral_codes (code);
create unique index referral_codes_default_user_uidx
  on public.referral_codes (user_id)
  where is_default is true and status = 'active';
create index referral_codes_user_id_idx on public.referral_codes (user_id);

create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid not null references public.users (id) on delete restrict,
  referred_user_id uuid not null references public.users (id) on delete restrict,
  referral_code_id uuid not null references public.referral_codes (id) on delete restrict,
  status public.referral_status not null default 'pending',
  created_at timestamptz not null default now(),
  qualified_at timestamptz,
  constraint referrals_no_self_referral_chk check (referrer_user_id <> referred_user_id)
);

create unique index referrals_referred_user_id_uidx on public.referrals (referred_user_id);
create index referrals_referrer_user_id_idx on public.referrals (referrer_user_id);
create index referrals_status_idx on public.referrals (status);

create table public.referral_rewards (
  id uuid primary key default gen_random_uuid(),
  referral_id uuid not null references public.referrals (id) on delete restrict,
  investment_id uuid not null references public.investments (id) on delete restrict,
  currency varchar(3) not null,
  amount_minor bigint not null,
  status public.referral_reward_status not null default 'pending',
  ledger_transaction_id uuid references public.ledger_transactions (id) on delete restrict,
  created_at timestamptz not null default now(),
  posted_at timestamptz,
  constraint referral_rewards_currency_chk check (currency ~ '^[A-Z]{3}$'),
  constraint referral_rewards_amount_positive_chk check (amount_minor > 0),
  constraint referral_rewards_posted_requires_ledger_chk check (
    status <> 'posted'
    or (ledger_transaction_id is not null and posted_at is not null)
  )
);

create unique index referral_rewards_referral_investment_uidx
  on public.referral_rewards (referral_id, investment_id);
create index referral_rewards_status_idx on public.referral_rewards (status);

create view public.ledger_account_balances as
select
  la.id as ledger_account_id,
  la.owner_type,
  la.owner_id,
  la.account_type,
  la.currency,
  coalesce(sum(case when le.direction = 'credit' then le.amount_minor else -le.amount_minor end), 0)::bigint
    as balance_minor,
  max(le.created_at) as last_entry_at
from public.ledger_accounts la
left join public.ledger_entries le on le.account_id = la.id
group by la.id, la.owner_type, la.owner_id, la.account_type, la.currency;

create view public.wallet_balances as
select
  w.id as wallet_id,
  w.user_id,
  w.currency,
  coalesce(sum(lab.balance_minor) filter (where wal.category = 'pending'), 0)::bigint as pending_balance_minor,
  coalesce(sum(lab.balance_minor) filter (where wal.category = 'available'), 0)::bigint as available_balance_minor,
  coalesce(sum(lab.balance_minor) filter (where wal.category = 'locked'), 0)::bigint as locked_balance_minor,
  coalesce(sum(lab.balance_minor) filter (where wal.category = 'reserved'), 0)::bigint as reserved_balance_minor,
  coalesce(sum(lab.balance_minor) filter (where wal.category = 'withdrawn'), 0)::bigint as withdrawn_balance_minor,
  max(lab.last_entry_at) as last_entry_at
from public.wallets w
left join public.wallet_account_links wal on wal.wallet_id = w.id
left join public.ledger_account_balances lab on lab.ledger_account_id = wal.ledger_account_id
group by w.id, w.user_id, w.currency;
