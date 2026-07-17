-- Align certified plan principal bands with auto-invest eligibility policy.
-- Silver max exclusive of Gold min; Gold/Classic similarly exclusive at upper bounds.
-- Existing investments keep their plan_version_id — this only affects new activations.

update public.investment_plan_versions
set max_principal_minor = 2499999
where id = 'b1000000-0000-4000-8000-000000000001'
  and status = 'active';

update public.investment_plan_versions
set max_principal_minor = 4999999
where id = 'b1000000-0000-4000-8000-000000000002'
  and status = 'active';

update public.investment_plan_versions
set max_principal_minor = 9999999
where id = 'b1000000-0000-4000-8000-000000000003'
  and status = 'active';
