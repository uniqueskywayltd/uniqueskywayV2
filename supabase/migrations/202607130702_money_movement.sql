-- Phase 7 money movement: withdrawal payout fields, provider-event retry/dead-letter.

alter table public.withdrawal_requests
  add column provider varchar(80),
  add column provider_payout_reference varchar(180),
  add column provider_metadata jsonb not null default '{}'::jsonb,
  add column failure_reason text,
  add column reservation_ledger_transaction_id uuid references public.ledger_transactions(id) on delete restrict,
  add column payment_ledger_transaction_id uuid references public.ledger_transactions(id) on delete restrict,
  add column release_ledger_transaction_id uuid references public.ledger_transactions(id) on delete restrict,
  add column payout_initiated_at timestamptz,
  add column paid_at timestamptz;

create unique index withdrawal_requests_reservation_ledger_transaction_uidx
  on public.withdrawal_requests(reservation_ledger_transaction_id)
  where reservation_ledger_transaction_id is not null;

create unique index withdrawal_requests_payment_ledger_transaction_uidx
  on public.withdrawal_requests(payment_ledger_transaction_id)
  where payment_ledger_transaction_id is not null;

create unique index withdrawal_requests_release_ledger_transaction_uidx
  on public.withdrawal_requests(release_ledger_transaction_id)
  where release_ledger_transaction_id is not null;

create unique index withdrawal_requests_provider_payout_uidx
  on public.withdrawal_requests(provider, provider_payout_reference)
  where provider is not null and provider_payout_reference is not null;

create index withdrawal_requests_user_status_created_idx
  on public.withdrawal_requests(user_id, status, created_at);

alter table public.payment_provider_events
  add column attempt_count integer not null default 0,
  add column next_retry_at timestamptz,
  add column dead_lettered_at timestamptz,
  add constraint payment_provider_events_attempt_count_chk check (attempt_count >= 0);

create index payment_provider_events_retry_idx
  on public.payment_provider_events(status, next_retry_at)
  where status = 'failed' and dead_lettered_at is null;
