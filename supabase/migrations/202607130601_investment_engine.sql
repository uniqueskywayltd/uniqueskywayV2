-- Phase 6 / 01 Investment Engine
-- Adds immutable investment snapshot fields and settlement explanation fields.

alter table public.investments
add column total_roi_bps integer,
add column promised_roi_minor bigint,
add column principal_return_policy public.principal_return_policy not null default 'return_at_maturity',
add column calculation_version varchar(40) not null default 'roi-v1',
add column idempotency_key varchar(180),
add column funding_ledger_transaction_id uuid references public.ledger_transactions (id) on delete restrict,
add column maturity_ledger_transaction_id uuid references public.ledger_transactions (id) on delete restrict,
add constraint investments_total_roi_bps_chk check (total_roi_bps is null or total_roi_bps >= 0),
add constraint investments_promised_roi_minor_chk check (
  promised_roi_minor is null
  or promised_roi_minor >= 0
),
add constraint investments_calculation_version_chk check (length(trim(calculation_version)) > 0);

create unique index investments_idempotency_key_uidx
  on public.investments (idempotency_key)
  where idempotency_key is not null;

alter table public.settlement_items
rename column rounding_residual_micro_minor to next_residual_micro_minor;

alter table public.settlement_items
add column earning_date date,
add column previous_residual_micro_minor bigint not null default 0,
add column calculation_version varchar(40) not null default 'roi-v1',
add column metadata jsonb not null default '{}'::jsonb,
add constraint settlement_items_previous_residual_non_negative_chk check (
  previous_residual_micro_minor >= 0
),
add constraint settlement_items_calculation_version_chk check (length(trim(calculation_version)) > 0),
add constraint settlement_items_date_order_chk check (settlement_date >= earning_date);

update public.settlement_items
set earning_date = settlement_date
where earning_date is null;

alter table public.settlement_items
alter column earning_date set not null;

