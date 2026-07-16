-- Security Advisor hardening (HIGH/MEDIUM only).
-- Does not change application business logic, RLS policy semantics for
-- service-role/server access, or Auth settings other than HIBP (done via API).

-- ---------------------------------------------------------------------------
-- 1) SECURITY DEFINER views → SECURITY INVOKER
-- Views are balance aggregations over RLS-protected tables. SECURITY DEFINER
-- is not required: the app reads them via the privileged DATABASE_URL role.
-- Invoker mode ensures PostgREST/anon cannot bypass underlying table RLS.
-- ---------------------------------------------------------------------------
alter view public.ledger_account_balances set (security_invoker = true);
alter view public.wallet_balances set (security_invoker = true);

-- ---------------------------------------------------------------------------
-- 2) Mutable search_path on trigger helpers → fixed search_path
-- Behavior unchanged; only search_path is pinned.
-- ---------------------------------------------------------------------------
create or replace function app_private.prevent_update_delete()
returns trigger
language plpgsql
set search_path = pg_catalog, public, app_private
as $$
begin
  raise exception 'immutable table %.% cannot be %', tg_table_schema, tg_table_name, tg_op;
end;
$$;

create or replace function app_private.enforce_ledger_entry_currency()
returns trigger
language plpgsql
set search_path = pg_catalog, public, app_private
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

create or replace function app_private.assert_ledger_transaction_balances()
returns trigger
language plpgsql
set search_path = pg_catalog, public, app_private
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

-- ---------------------------------------------------------------------------
-- 3) public.rls_auto_enable() — event-trigger helper (SECURITY DEFINER required)
-- Retains SECURITY DEFINER because it must ALTER TABLE as an elevated DDL hook.
-- Revoke EXECUTE from API roles; keep for postgres / service_role only.
-- ---------------------------------------------------------------------------
revoke all on function public.rls_auto_enable() from public;
revoke execute on function public.rls_auto_enable() from anon;
revoke execute on function public.rls_auto_enable() from authenticated;
grant execute on function public.rls_auto_enable() to postgres;
grant execute on function public.rls_auto_enable() to service_role;

-- ---------------------------------------------------------------------------
-- 4) btree_gist — move out of public when safe
-- Exclusion index investment_plan_versions_active_range_excl depends on gist
-- operator classes from btree_gist (resolved by OID). Relocating the extension
-- to schema "extensions" is the Supabase-recommended remediation.
-- ---------------------------------------------------------------------------
create schema if not exists extensions;
grant usage on schema extensions to postgres, anon, authenticated, service_role;
alter extension btree_gist set schema extensions;
