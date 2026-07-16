-- Absolute admin controller: platform_admin and super_admin receive every permission.
-- Also introduces investments.update and settlements.manage for explicit write paths.

insert into public.permissions (key, name, description)
values
  (
    'investments.update',
    'Update investments',
    'Create and mutate customer investments.'
  ),
  (
    'settlements.manage',
    'Manage settlements',
    'Manage settlement runs and recovery actions.'
  )
on conflict (key) do update
set
  name = excluded.name,
  description = excluded.description;

-- Ensure every catalog permission is granted to absolute controller roles.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key in ('super_admin', 'platform_admin')
on conflict do nothing;
