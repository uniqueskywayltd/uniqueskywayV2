-- Manual crypto funding wallets + deposit notification fields (no payment gateway).

create table if not exists public.platform_funding_wallets (
  id uuid primary key default gen_random_uuid(),
  asset varchar(10) not null,
  network varchar(80) not null,
  address text not null,
  qr_code_url text,
  instructions text,
  status varchar(20) not null default 'active',
  display_order integer not null default 0,
  updated_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint platform_funding_wallets_asset_chk check (asset in ('BTC', 'ETH', 'USDT')),
  constraint platform_funding_wallets_status_chk check (status in ('active', 'disabled')),
  constraint platform_funding_wallets_address_not_blank_chk check (length(trim(address)) > 0),
  constraint platform_funding_wallets_network_not_blank_chk check (length(trim(network)) > 0)
);

create index if not exists platform_funding_wallets_asset_status_idx
  on public.platform_funding_wallets (asset, status, display_order);

alter table public.platform_funding_wallets enable row level security;

alter table public.deposit_intents
  add column if not exists funding_asset varchar(10),
  add column if not exists funding_network varchar(80),
  add column if not exists transaction_hash varchar(200),
  add column if not exists customer_note text,
  add column if not exists funding_wallet_id uuid references public.platform_funding_wallets (id) on delete set null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'deposit_intents_funding_asset_chk'
  ) then
    alter table public.deposit_intents
      add constraint deposit_intents_funding_asset_chk
      check (funding_asset is null or funding_asset in ('BTC', 'ETH', 'USDT'));
  end if;
end $$;

alter table public.withdrawal_requests
  alter column destination_reference type varchar(500);

comment on table public.platform_funding_wallets is
  'Admin-configured BTC/ETH/USDT receive addresses shown to customers for manual deposits.';
