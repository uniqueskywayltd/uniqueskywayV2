-- Complete customer purge for admin delete.
-- Removes customer-owned financial and profile data (including immutable ledger rows
-- for that customer) so the email can be registered again and admin lists stay clean.

create or replace function app_private.purge_customer_user(p_user_id uuid)
returns table(auth_user_id uuid, email text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_auth_user_id uuid;
  v_email text;
  v_user_id_text text := p_user_id::text;
begin
  if exists (
    select 1 from public.admin_profiles ap where ap.user_id = p_user_id
  ) then
    raise exception 'Staff accounts cannot be purged from customer management.'
      using errcode = 'P0001';
  end if;

  select u.auth_user_id, u.email
    into v_auth_user_id, v_email
  from public.users u
  where u.id = p_user_id
  for update;

  if v_auth_user_id is null then
    raise exception 'Customer was not found.'
      using errcode = 'P0002';
  end if;

  -- Notes authored by this user (on any target) block user delete via RESTRICT.
  delete from public.customer_notes
  where user_id = p_user_id
     or author_user_id = p_user_id;

  delete from public.admin_entity_notes
  where author_user_id = p_user_id
     or (
       target_type = 'deposit_intent'
       and target_id in (select id from public.deposit_intents where user_id = p_user_id)
     )
     or (
       target_type = 'withdrawal_request'
       and target_id in (select id from public.withdrawal_requests where user_id = p_user_id)
     );

  -- Referral graph (rewards → referrals → codes).
  delete from public.referral_rewards rr
  using public.referrals r
  where rr.referral_id = r.id
    and (r.referrer_user_id = p_user_id or r.referred_user_id = p_user_id);

  delete from public.referral_rewards rr
  using public.investments i
  where rr.investment_id = i.id
    and i.user_id = p_user_id;

  delete from public.referrals
  where referrer_user_id = p_user_id
     or referred_user_id = p_user_id;

  delete from public.referral_codes
  where user_id = p_user_id;

  -- Settlement / ROI artifacts for this customer's investments (immutable tables).
  alter table public.roi_ledger_entries disable trigger roi_ledger_entries_immutable_trg;
  alter table public.settlement_items disable trigger settlement_items_immutable_trg;

  delete from public.roi_ledger_entries rle
  using public.investments i
  where rle.investment_id = i.id
    and i.user_id = p_user_id;

  delete from public.settlement_items si
  using public.investments i
  where si.investment_id = i.id
    and i.user_id = p_user_id;

  alter table public.settlement_items enable trigger settlement_items_immutable_trg;
  alter table public.roi_ledger_entries enable trigger roi_ledger_entries_immutable_trg;

  delete from public.roi_schedule_items rsi
  using public.investments i
  where rsi.investment_id = i.id
    and i.user_id = p_user_id;

  -- Clear ledger FKs on money movement rows before removing ledger transactions.
  update public.investments
  set
    funding_ledger_transaction_id = null,
    maturity_ledger_transaction_id = null
  where user_id = p_user_id;

  update public.deposit_intents
  set
    confirmation_ledger_transaction_id = null,
    reversal_ledger_transaction_id = null
  where user_id = p_user_id;

  update public.withdrawal_requests
  set
    reservation_ledger_transaction_id = null,
    payment_ledger_transaction_id = null,
    release_ledger_transaction_id = null,
    reviewed_by = null
  where user_id = p_user_id
     or reviewed_by = p_user_id;

  delete from public.investments where user_id = p_user_id;
  delete from public.deposit_intents where user_id = p_user_id;
  delete from public.withdrawal_requests where user_id = p_user_id;

  -- Ledger purge for accounts owned by this user (and full transactions touching them).
  alter table public.ledger_transactions disable trigger ledger_transactions_immutable_trg;
  alter table public.ledger_entries disable trigger ledger_entries_immutable_trg;
  alter table public.ledger_entries disable trigger ledger_entries_balance_ctr;
  alter table public.ledger_transactions disable trigger ledger_transactions_entries_ctr;

  delete from public.account_balance_snapshots abs
  using public.ledger_accounts la
  where abs.account_id = la.id
    and la.owner_type = 'user'
    and la.owner_id = v_user_id_text;

  delete from public.account_balance_snapshots abs
  where abs.as_of_ledger_entry_id in (
    select le.id
    from public.ledger_entries le
    join public.ledger_accounts la on la.id = le.account_id
    where la.owner_type = 'user'
      and la.owner_id = v_user_id_text
  );

  delete from public.wallet_account_links wal
  using public.wallets w
  where wal.wallet_id = w.id
    and w.user_id = p_user_id;

  -- Delete every entry belonging to transactions that touch this user's accounts,
  -- then delete those transactions (counterpart platform/provider legs included).
  with touched_tx as (
    select distinct le.ledger_transaction_id as id
    from public.ledger_entries le
    join public.ledger_accounts la on la.id = le.account_id
    where la.owner_type = 'user'
      and la.owner_id = v_user_id_text
    union
    select lt.id
    from public.ledger_transactions lt
    where lt.created_by = p_user_id
  )
  delete from public.ledger_entries le
  using touched_tx t
  where le.ledger_transaction_id = t.id;

  with orphan_tx as (
    select lt.id
    from public.ledger_transactions lt
    where lt.created_by = p_user_id
       or not exists (
         select 1 from public.ledger_entries le where le.ledger_transaction_id = lt.id
       )
  )
  delete from public.ledger_transactions lt
  using orphan_tx o
  where lt.id = o.id;

  delete from public.ledger_accounts
  where owner_type = 'user'
    and owner_id = v_user_id_text;

  alter table public.ledger_transactions enable trigger ledger_transactions_entries_ctr;
  alter table public.ledger_entries enable trigger ledger_entries_balance_ctr;
  alter table public.ledger_entries enable trigger ledger_entries_immutable_trg;
  alter table public.ledger_transactions enable trigger ledger_transactions_immutable_trg;

  delete from public.wallets where user_id = p_user_id;

  -- Notifications / email / identity session state.
  delete from public.notification_deliveries nd
  using public.notifications n
  where nd.notification_id = n.id
    and n.user_id = p_user_id;

  delete from public.notifications where user_id = p_user_id;
  delete from public.notification_channel_preferences where user_id = p_user_id;

  delete from app_private.email_messages where recipient_user_id = p_user_id;
  delete from app_private.outbox_events
  where aggregate_type in ('email_message', 'user', 'customer')
    and aggregate_id = v_user_id_text;

  delete from public.sessions where user_id = p_user_id;
  delete from public.trusted_devices where user_id = p_user_id;
  delete from public.user_roles where user_id = p_user_id;

  delete from public.customer_preferences where user_id = p_user_id;
  delete from public.customer_profiles where user_id = p_user_id;
  delete from public.customer_accounts where user_id = p_user_id;

  -- Optional: clear staff invite acceptance pointer if this user accepted an invite.
  update public.staff_invites
  set accepted_user_id = null
  where accepted_user_id = p_user_id;

  delete from public.users where id = p_user_id;

  auth_user_id := v_auth_user_id;
  email := v_email;
  return next;
end;
$$;

revoke all on function app_private.purge_customer_user(uuid) from public;
revoke execute on function app_private.purge_customer_user(uuid) from anon, authenticated;
grant execute on function app_private.purge_customer_user(uuid) to postgres;
grant execute on function app_private.purge_customer_user(uuid) to service_role;

comment on function app_private.purge_customer_user(uuid) is
  'Hard-deletes a non-staff customer and all owned application data so the email can register again.';
