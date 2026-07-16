-- Seed certified investment plans (presentation catalog → DB plan versions).
-- Data only — no schema changes. Idempotent via slug uniqueness.

insert into public.investment_plans (id, slug, name, description, status)
values
  ('a1000000-0000-4000-8000-000000000001', 'silver', 'Silver Plan', 'Entry-level plan with a 5-day duration and 3% daily return.', 'active'),
  ('a1000000-0000-4000-8000-000000000002', 'gold', 'Gold Plan', 'Mid-tier plan with a 7-day duration and 5.5% daily return.', 'active'),
  ('a1000000-0000-4000-8000-000000000003', 'classic', 'Classic Plan', 'Premium plan with a 14-day duration and 6% daily return.', 'active'),
  ('a1000000-0000-4000-8000-000000000004', 'master', 'Master Plan', 'Elite plan with a 30-day duration and 10% daily return.', 'active')
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  status = excluded.status,
  updated_at = now();

insert into public.investment_plan_versions (
  id,
  plan_id,
  version,
  currency,
  min_principal_minor,
  max_principal_minor,
  term_days,
  daily_roi_bps,
  total_roi_bps,
  principal_return_policy,
  early_exit_policy,
  effective_from,
  effective_to,
  status,
  metadata
)
values
  (
    'b1000000-0000-4000-8000-000000000001',
    'a1000000-0000-4000-8000-000000000001',
    1,
    'USD',
    5000,
    2500000,
    5,
    300,
    1500,
    'return_at_maturity',
    'allowed_with_penalty',
    timestamptz '2026-01-01 00:00:00+00',
    null,
    'active',
    '{"slug":"silver","earlyExitPenaltyBps":0,"earlyExitEnabled":true}'::jsonb
  ),
  (
    'b1000000-0000-4000-8000-000000000002',
    'a1000000-0000-4000-8000-000000000002',
    1,
    'USD',
    2500000,
    5000000,
    7,
    550,
    3850,
    'return_at_maturity',
    'allowed_with_penalty',
    timestamptz '2026-01-01 00:00:00+00',
    null,
    'active',
    '{"slug":"gold","earlyExitPenaltyBps":0,"earlyExitEnabled":true}'::jsonb
  ),
  (
    'b1000000-0000-4000-8000-000000000003',
    'a1000000-0000-4000-8000-000000000003',
    1,
    'USD',
    5000000,
    10000000,
    14,
    600,
    8400,
    'return_at_maturity',
    'allowed_with_penalty',
    timestamptz '2026-01-01 00:00:00+00',
    null,
    'active',
    '{"slug":"classic","earlyExitPenaltyBps":0,"earlyExitEnabled":true}'::jsonb
  ),
  (
    'b1000000-0000-4000-8000-000000000004',
    'a1000000-0000-4000-8000-000000000004',
    1,
    'USD',
    10000000,
    100000000000,
    30,
    1000,
    30000,
    'return_at_maturity',
    'allowed_with_penalty',
    timestamptz '2026-01-01 00:00:00+00',
    null,
    'active',
    '{"slug":"master","earlyExitPenaltyBps":0,"earlyExitEnabled":true}'::jsonb
  )
on conflict (id) do update
set
  status = excluded.status,
  min_principal_minor = excluded.min_principal_minor,
  max_principal_minor = excluded.max_principal_minor,
  term_days = excluded.term_days,
  daily_roi_bps = excluded.daily_roi_bps,
  total_roi_bps = excluded.total_roi_bps,
  early_exit_policy = excluded.early_exit_policy,
  metadata = excluded.metadata;
