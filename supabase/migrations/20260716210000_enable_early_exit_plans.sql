-- Allow customer early exit on certified packages (0% penalty by default).
-- Live accrual remains visual-only; stop posts exact-second ROI once via ledger.

update public.investment_plan_versions
set
  early_exit_policy = 'allowed_with_penalty',
  metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
    'earlyExitPenaltyBps', 0,
    'earlyExitEnabled', true
  )
where id in (
  'b1000000-0000-4000-8000-000000000001',
  'b1000000-0000-4000-8000-000000000002',
  'b1000000-0000-4000-8000-000000000003',
  'b1000000-0000-4000-8000-000000000004'
);
