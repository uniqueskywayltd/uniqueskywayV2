-- Phase 3 / 07 Seed
-- Idempotent operational seed data. No customer data.

insert into public.roles (key, name, description)
values
  ('support_agent', 'Support Agent', 'Can review customer support context without financial approval authority.'),
  ('finance_admin', 'Finance Admin', 'Can review deposits, withdrawals, settlements, and ledger reports.'),
  ('platform_admin', 'Platform Admin', 'Can manage platform configuration and privileged operations.')
on conflict (key) do update
set
  name = excluded.name,
  description = excluded.description;

insert into app_private.system_settings (key, value, description)
values
  ('settlement.timezone', '{"timezone":"America/New_York"}'::jsonb, 'Official financial day timezone.'),
  ('settlement.roi_formula_version', '{"version":"roi-v1"}'::jsonb, 'Active ROI formula version.'),
  ('platform.default_currency', '{"currency":"USD"}'::jsonb, 'Default platform currency.')
on conflict (key) do update
set
  value = excluded.value,
  description = excluded.description,
  updated_at = now();

insert into app_private.feature_flags (key, status, description, rules)
values
  ('notifications.sms', 'disabled', 'Future SMS notification channel.', '{}'::jsonb),
  ('notifications.push', 'disabled', 'Future push notification channel.', '{}'::jsonb)
on conflict (key) do update
set
  status = excluded.status,
  description = excluded.description,
  rules = excluded.rules,
  updated_at = now();

insert into public.ledger_accounts (owner_type, owner_id, account_type, currency)
values
  ('platform', 'platform', 'platform_cash', 'USD'),
  ('platform', 'platform', 'platform_roi_expense', 'USD'),
  ('platform', 'platform', 'platform_referral_expense', 'USD'),
  ('platform', 'platform', 'platform_rounding', 'USD'),
  ('provider', 'default-provider', 'provider_cash_clearing', 'USD')
on conflict (owner_type, owner_id, account_type, currency) do nothing;
