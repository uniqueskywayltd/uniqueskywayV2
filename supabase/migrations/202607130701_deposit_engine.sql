alter table public.deposit_intents
  add column provider_authorization_url varchar(500),
  add column provider_access_code varchar(180),
  add column provider_metadata jsonb not null default '{}'::jsonb,
  add column failure_reason text,
  add column confirmation_ledger_transaction_id uuid references public.ledger_transactions(id) on delete restrict,
  add column reversal_ledger_transaction_id uuid references public.ledger_transactions(id) on delete restrict,
  add column updated_at timestamptz not null default now();

create unique index deposit_intents_confirmation_ledger_transaction_uidx
  on public.deposit_intents(confirmation_ledger_transaction_id)
  where confirmation_ledger_transaction_id is not null;

create unique index deposit_intents_reversal_ledger_transaction_uidx
  on public.deposit_intents(reversal_ledger_transaction_id)
  where reversal_ledger_transaction_id is not null;

create index deposit_intents_user_status_created_idx
  on public.deposit_intents(user_id, status, created_at);

alter table public.payment_provider_events
  add column payload jsonb not null default '{}'::jsonb;
