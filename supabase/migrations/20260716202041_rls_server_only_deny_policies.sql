-- Explicit rejection policies for server-only tables.
-- These tables are accessed via DATABASE_URL / Drizzle (table owner), not PostgREST.
-- RLS was already enabled with no policies (deny-by-default). Document that intent
-- so advisor lint 0008_rls_enabled_no_policy is satisfied without opening API access.
-- See: https://supabase.com/docs/guides/database/database-advisors?lint=0008_rls_enabled_no_policy

create policy account_balance_snapshots_no_direct_access
  on public.account_balance_snapshots
  for all
  using (false)
  with check (false);

create policy admin_entity_notes_no_direct_access
  on public.admin_entity_notes
  for all
  using (false)
  with check (false);

create policy admin_profiles_no_direct_access
  on public.admin_profiles
  for all
  using (false)
  with check (false);

create policy customer_notes_no_direct_access
  on public.customer_notes
  for all
  using (false)
  with check (false);

create policy email_template_catalog_no_direct_access
  on public.email_template_catalog
  for all
  using (false)
  with check (false);

create policy investment_plan_versions_no_direct_access
  on public.investment_plan_versions
  for all
  using (false)
  with check (false);

create policy investment_plans_no_direct_access
  on public.investment_plans
  for all
  using (false)
  with check (false);

create policy ledger_accounts_no_direct_access
  on public.ledger_accounts
  for all
  using (false)
  with check (false);

create policy ledger_entries_no_direct_access
  on public.ledger_entries
  for all
  using (false)
  with check (false);

create policy ledger_transactions_no_direct_access
  on public.ledger_transactions
  for all
  using (false)
  with check (false);

create policy notification_template_catalog_no_direct_access
  on public.notification_template_catalog
  for all
  using (false)
  with check (false);

create policy payment_provider_events_no_direct_access
  on public.payment_provider_events
  for all
  using (false)
  with check (false);

create policy permissions_no_direct_access
  on public.permissions
  for all
  using (false)
  with check (false);

create policy platform_funding_wallets_no_direct_access
  on public.platform_funding_wallets
  for all
  using (false)
  with check (false);

create policy roi_ledger_entries_no_direct_access
  on public.roi_ledger_entries
  for all
  using (false)
  with check (false);

create policy role_permissions_no_direct_access
  on public.role_permissions
  for all
  using (false)
  with check (false);

create policy roles_no_direct_access
  on public.roles
  for all
  using (false)
  with check (false);

create policy sessions_no_direct_access
  on public.sessions
  for all
  using (false)
  with check (false);

create policy settlement_items_no_direct_access
  on public.settlement_items
  for all
  using (false)
  with check (false);

create policy settlement_runs_no_direct_access
  on public.settlement_runs
  for all
  using (false)
  with check (false);

create policy staff_invite_roles_no_direct_access
  on public.staff_invite_roles
  for all
  using (false)
  with check (false);

create policy staff_invites_no_direct_access
  on public.staff_invites
  for all
  using (false)
  with check (false);

create policy trusted_devices_no_direct_access
  on public.trusted_devices
  for all
  using (false)
  with check (false);

create policy user_roles_no_direct_access
  on public.user_roles
  for all
  using (false)
  with check (false);

create policy wallet_account_links_no_direct_access
  on public.wallet_account_links
  for all
  using (false)
  with check (false);
