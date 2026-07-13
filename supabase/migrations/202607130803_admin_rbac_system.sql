-- Phase 8.3 Roles, Permissions & System Administration
-- Configurable RBAC, staff invites, template catalogs, feature-flag extensions.

-- ---------------------------------------------------------------------------
-- Permissions catalog
-- ---------------------------------------------------------------------------
create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  key varchar(120) not null,
  name varchar(160) not null,
  description varchar(500),
  created_at timestamptz not null default now(),
  constraint permissions_key_format_chk check (key ~ '^[a-z][a-z0-9_.]*$')
);

create unique index permissions_key_uidx on public.permissions (key);

create table public.role_permissions (
  role_id uuid not null references public.roles (id) on delete cascade,
  permission_id uuid not null references public.permissions (id) on delete cascade,
  granted_at timestamptz not null default now(),
  granted_by uuid references public.users (id) on delete set null,
  constraint role_permissions_pk primary key (role_id, permission_id)
);

create index role_permissions_permission_id_idx on public.role_permissions (permission_id);

-- ---------------------------------------------------------------------------
-- Staff invites
-- ---------------------------------------------------------------------------
create type public.staff_invite_status as enum ('pending', 'accepted', 'revoked', 'expired');

create table public.staff_invites (
  id uuid primary key default gen_random_uuid(),
  email varchar(320) not null,
  invited_by uuid not null references public.users (id) on delete restrict,
  token_hash varchar(128) not null,
  status public.staff_invite_status not null default 'pending',
  expires_at timestamptz not null,
  accepted_user_id uuid references public.users (id) on delete set null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint staff_invites_email_format_chk check (email = lower(email))
);

create unique index staff_invites_token_hash_uidx on public.staff_invites (token_hash);
create index staff_invites_email_status_idx on public.staff_invites (email, status);
create index staff_invites_expires_at_idx on public.staff_invites (expires_at);

create table public.staff_invite_roles (
  invite_id uuid not null references public.staff_invites (id) on delete cascade,
  role_id uuid not null references public.roles (id) on delete restrict,
  constraint staff_invite_roles_pk primary key (invite_id, role_id)
);

-- ---------------------------------------------------------------------------
-- Admin profile staff controls
-- ---------------------------------------------------------------------------
alter table public.admin_profiles
  add column if not exists must_change_password boolean not null default false,
  add column if not exists last_active_at timestamptz,
  add column if not exists disabled_at timestamptz,
  add column if not exists disabled_reason text;

-- ---------------------------------------------------------------------------
-- Roles: system flag + disable support
-- ---------------------------------------------------------------------------
alter table public.roles
  add column if not exists is_system boolean not null default false,
  add column if not exists status varchar(40) not null default 'active',
  add column if not exists updated_at timestamptz not null default now();

alter table public.roles
  drop constraint if exists roles_status_chk;
alter table public.roles
  add constraint roles_status_chk check (status in ('active', 'disabled'));

-- ---------------------------------------------------------------------------
-- Feature flag extensions (rules jsonb already exists; add schedule fields)
-- ---------------------------------------------------------------------------
alter table app_private.feature_flags
  add column if not exists enabled_at timestamptz,
  add column if not exists disabled_at timestamptz,
  add column if not exists schedule_start_at timestamptz,
  add column if not exists schedule_end_at timestamptz,
  add column if not exists rollout_percent integer not null default 100,
  add column if not exists internal_only boolean not null default false;

alter table app_private.feature_flags
  drop constraint if exists feature_flags_rollout_percent_chk;
alter table app_private.feature_flags
  add constraint feature_flags_rollout_percent_chk
    check (rollout_percent >= 0 and rollout_percent <= 100);

-- ---------------------------------------------------------------------------
-- Email / notification template catalogs (metadata only; bodies remain in code)
-- ---------------------------------------------------------------------------
create type public.template_channel as enum ('email', 'in_app', 'sms', 'push', 'whatsapp');
create type public.template_catalog_status as enum ('enabled', 'disabled');

create table public.email_template_catalog (
  key varchar(160) primary key,
  name varchar(200) not null,
  description varchar(500),
  status public.template_catalog_status not null default 'enabled',
  current_version varchar(40) not null default 'v1',
  preview_sample jsonb not null default '{}'::jsonb,
  updated_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint email_template_catalog_key_format_chk check (key ~ '^[a-z][a-z0-9_.]*$')
);

create table public.notification_template_catalog (
  key varchar(160) primary key,
  name varchar(200) not null,
  description varchar(500),
  channel public.template_channel not null default 'in_app',
  status public.template_catalog_status not null default 'enabled',
  current_version varchar(40) not null default 'v1',
  preview_sample jsonb not null default '{}'::jsonb,
  updated_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_template_catalog_key_format_chk check (key ~ '^[a-z][a-z0-9_.]*$')
);

-- ---------------------------------------------------------------------------
-- RLS deny-by-default for new public tables
-- ---------------------------------------------------------------------------
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.staff_invites enable row level security;
alter table public.staff_invite_roles enable row level security;
alter table public.email_template_catalog enable row level security;
alter table public.notification_template_catalog enable row level security;

-- ---------------------------------------------------------------------------
-- Seed roles (idempotent)
-- ---------------------------------------------------------------------------
insert into public.roles (key, name, description, is_system, status)
values
  ('super_admin', 'Super Admin', 'Full platform control including staff and roles.', true, 'active'),
  ('platform_admin', 'Administrator', 'Platform configuration and operational administration.', true, 'active'),
  ('finance_manager', 'Finance Manager', 'Full finance review authority.', true, 'active'),
  ('finance_officer', 'Finance Officer', 'Day-to-day deposit and withdrawal review.', true, 'active'),
  ('support_manager', 'Support Manager', 'Customer support leadership.', true, 'active'),
  ('support_agent', 'Support Agent', 'Customer support read and notes.', true, 'active'),
  ('compliance_officer', 'Compliance Officer', 'KYC, suspensions, and compliance review.', true, 'active'),
  ('auditor', 'Auditor', 'Read-only audit and security visibility.', true, 'active'),
  ('read_only', 'Read Only', 'Read-only operational visibility.', true, 'active'),
  ('finance_admin', 'Finance Admin (Legacy)', 'Legacy finance admin; prefer finance_manager.', true, 'active')
on conflict (key) do update
set
  name = excluded.name,
  description = excluded.description,
  is_system = excluded.is_system,
  status = excluded.status,
  updated_at = now();

-- Mark existing seeded roles as system if present
update public.roles
set is_system = true, updated_at = now()
where key in ('support_agent', 'finance_admin', 'platform_admin');

-- ---------------------------------------------------------------------------
-- Seed permissions
-- ---------------------------------------------------------------------------
insert into public.permissions (key, name, description)
values
  ('customers.read', 'Read customers', 'Search and view customer details.'),
  ('customers.update', 'Update customers', 'Update non-financial customer profile fields.'),
  ('customers.suspend', 'Suspend customers', 'Restrict, reactivate, or close customer accounts.'),
  ('customers.notes', 'Customer notes', 'Create customer notes.'),
  ('customers.kyc', 'Customer KYC', 'Update KYC and risk verification state.'),
  ('deposits.read', 'Read deposits', 'View deposit queues and details.'),
  ('deposits.review', 'Review deposits', 'Review deposits and add deposit notes.'),
  ('deposits.approve', 'Approve deposits', 'Approve or reject deposits via certified engine.'),
  ('withdrawals.read', 'Read withdrawals', 'View withdrawal queues and details.'),
  ('withdrawals.review', 'Review withdrawals', 'Review withdrawals and add withdrawal notes.'),
  ('withdrawals.approve', 'Approve withdrawals', 'Approve, reject, or queue payouts via certified engine.'),
  ('investments.read', 'Read investments', 'Read-only investment viewer.'),
  ('settlements.read', 'Read settlements', 'Read-only settlement viewer.'),
  ('reports.read', 'Read reports', 'View operational reports.'),
  ('reports.export', 'Export reports', 'Export CSV and Excel reports.'),
  ('emails.manage', 'Manage email templates', 'Manage email template catalog.'),
  ('notifications.manage', 'Manage notification templates', 'Manage notification template catalog.'),
  ('featureflags.manage', 'Manage feature flags', 'Create and toggle feature flags.'),
  ('system.manage', 'Manage system settings', 'Manage system settings.'),
  ('roles.manage', 'Manage roles', 'Create, edit, disable roles and assign permissions.'),
  ('permissions.manage', 'Manage permissions', 'View permission catalog and role grants.'),
  ('staff.manage', 'Manage staff', 'Invite, activate, disable staff and manage staff roles.'),
  ('staff.reset_password', 'Reset staff password', 'Trigger staff password reset.'),
  ('audit.read', 'Read audit logs', 'View global audit logs.'),
  ('jobs.manage', 'Manage background jobs', 'View and retry or cancel background jobs.'),
  ('security.read', 'Read security events', 'View security center events.'),
  ('monitoring.read', 'Read monitoring', 'View financial monitoring and system health.'),
  ('overview.read', 'Read overview', 'View admin overview metrics.')
on conflict (key) do update
set
  name = excluded.name,
  description = excluded.description;

-- ---------------------------------------------------------------------------
-- Helper: grant all listed permissions to a role by key
-- ---------------------------------------------------------------------------
-- Grants follow ADMIN_PERMISSION_MATRIX.md

-- super_admin: all permissions
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key = 'super_admin'
on conflict do nothing;

-- platform_admin
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.key in (
  'customers.read', 'customers.update', 'customers.notes',
  'deposits.read', 'deposits.review', 'deposits.approve',
  'withdrawals.read', 'withdrawals.review', 'withdrawals.approve',
  'investments.read', 'settlements.read',
  'reports.read', 'reports.export',
  'emails.manage', 'notifications.manage',
  'featureflags.manage', 'system.manage',
  'permissions.manage',
  'audit.read', 'jobs.manage', 'security.read',
  'monitoring.read', 'overview.read'
)
where r.key = 'platform_admin'
on conflict do nothing;

-- finance_manager + legacy finance_admin
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.key in (
  'customers.read',
  'deposits.read', 'deposits.review', 'deposits.approve',
  'withdrawals.read', 'withdrawals.review', 'withdrawals.approve',
  'investments.read', 'settlements.read',
  'reports.read', 'reports.export',
  'audit.read', 'jobs.manage',
  'monitoring.read', 'overview.read'
)
where r.key in ('finance_manager', 'finance_admin')
on conflict do nothing;

-- finance_officer
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.key in (
  'customers.read',
  'deposits.read', 'deposits.review', 'deposits.approve',
  'withdrawals.read', 'withdrawals.review', 'withdrawals.approve',
  'investments.read', 'settlements.read',
  'reports.read',
  'monitoring.read', 'overview.read'
)
where r.key = 'finance_officer'
on conflict do nothing;

-- support_manager
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.key in (
  'customers.read', 'customers.update', 'customers.notes',
  'deposits.read', 'withdrawals.read', 'investments.read',
  'reports.read',
  'audit.read', 'security.read',
  'overview.read'
)
where r.key = 'support_manager'
on conflict do nothing;

-- support_agent
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.key in (
  'customers.read', 'customers.notes',
  'deposits.read', 'withdrawals.read', 'investments.read',
  'overview.read'
)
where r.key = 'support_agent'
on conflict do nothing;

-- compliance_officer
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.key in (
  'customers.read', 'customers.update', 'customers.suspend', 'customers.notes', 'customers.kyc',
  'deposits.read', 'withdrawals.read', 'investments.read',
  'reports.read', 'reports.export',
  'audit.read', 'security.read',
  'overview.read'
)
where r.key = 'compliance_officer'
on conflict do nothing;

-- auditor
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.key in (
  'customers.read',
  'deposits.read', 'withdrawals.read', 'investments.read', 'settlements.read',
  'reports.read',
  'permissions.manage',
  'audit.read', 'security.read',
  'monitoring.read', 'overview.read'
)
where r.key = 'auditor'
on conflict do nothing;

-- read_only
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.key in (
  'customers.read',
  'deposits.read', 'withdrawals.read', 'investments.read', 'settlements.read',
  'reports.read',
  'overview.read'
)
where r.key = 'read_only'
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Default feature flags + settings
-- ---------------------------------------------------------------------------
insert into app_private.feature_flags (key, status, description, rules, rollout_percent, internal_only)
values
  ('maintenance_mode', 'disabled', 'Puts the platform into maintenance mode.', '{}'::jsonb, 100, false),
  ('registration_enabled', 'enabled', 'Allows new customer registration.', '{}'::jsonb, 100, false),
  ('withdrawals_enabled', 'enabled', 'Allows customer withdrawal requests.', '{}'::jsonb, 100, false),
  ('deposits_enabled', 'enabled', 'Allows customer deposit creation.', '{}'::jsonb, 100, false),
  ('investment_creation_enabled', 'enabled', 'Allows new investment activation.', '{}'::jsonb, 100, false),
  ('email_delivery_enabled', 'enabled', 'Allows transactional email delivery.', '{}'::jsonb, 100, false),
  ('referrals_enabled', 'disabled', 'Enables referral features when certified.', '{}'::jsonb, 100, false)
on conflict (key) do nothing;

insert into app_private.system_settings (key, value, description)
values
  ('platform.name', '"Unique Sky Way"'::jsonb, 'Public platform name.'),
  ('platform.support_email', '"support@uniqueskyway.com"'::jsonb, 'Support contact email.'),
  ('platform.sender_email', '"noreply@uniqueskyway.com"'::jsonb, 'Default transactional sender.'),
  ('platform.timezone', '"America/New_York"'::jsonb, 'Default platform timezone.'),
  ('platform.currency', '"USD"'::jsonb, 'Default platform currency.'),
  ('platform.country', '"US"'::jsonb, 'Default platform country.'),
  ('platform.maintenance_banner', '""'::jsonb, 'Optional maintenance banner text.'),
  ('auth.password_policy', '{"minLength":12,"requireUppercase":true,"requireLowercase":true,"requireNumber":true,"requireSymbol":true}'::jsonb, 'Password policy.'),
  ('auth.session_timeout_minutes', '10080'::jsonb, 'Session timeout in minutes.'),
  ('auth.otp_length', '6'::jsonb, 'OTP length.'),
  ('auth.otp_expiry_minutes', '15'::jsonb, 'OTP expiry in minutes.')
on conflict (key) do nothing;

-- Seed email template catalog keys commonly used by V2
insert into public.email_template_catalog (key, name, description, status, current_version)
values
  ('auth.verify_email', 'Verify email', 'Customer email verification.', 'enabled', 'v1'),
  ('auth.password_reset', 'Password reset', 'Customer password reset.', 'enabled', 'v1'),
  ('deposit.initiated', 'Deposit initiated', 'Deposit checkout initiated.', 'enabled', 'v1'),
  ('deposit.confirmed', 'Deposit confirmed', 'Deposit credited.', 'enabled', 'v1'),
  ('deposit.failed', 'Deposit failed', 'Deposit failed.', 'enabled', 'v1'),
  ('withdrawal.requested', 'Withdrawal requested', 'Withdrawal reserved for review.', 'enabled', 'v1'),
  ('withdrawal.approved', 'Withdrawal approved', 'Withdrawal approved.', 'enabled', 'v1'),
  ('withdrawal.rejected', 'Withdrawal rejected', 'Withdrawal rejected and released.', 'enabled', 'v1'),
  ('withdrawal.paid', 'Withdrawal paid', 'Withdrawal payout completed.', 'enabled', 'v1'),
  ('withdrawal.failed', 'Withdrawal failed', 'Withdrawal payout failed.', 'enabled', 'v1')
on conflict (key) do nothing;

insert into public.notification_template_catalog (key, name, description, channel, status, current_version)
values
  ('deposit.initiated', 'Deposit initiated', 'In-app deposit initiated.', 'in_app', 'enabled', 'v1'),
  ('deposit.confirmed', 'Deposit confirmed', 'In-app deposit confirmed.', 'in_app', 'enabled', 'v1'),
  ('deposit.failed', 'Deposit failed', 'In-app deposit failed.', 'in_app', 'enabled', 'v1'),
  ('withdrawal.requested', 'Withdrawal requested', 'In-app withdrawal requested.', 'in_app', 'enabled', 'v1'),
  ('withdrawal.approved', 'Withdrawal approved', 'In-app withdrawal approved.', 'in_app', 'enabled', 'v1'),
  ('withdrawal.rejected', 'Withdrawal rejected', 'In-app withdrawal rejected.', 'in_app', 'enabled', 'v1'),
  ('withdrawal.paid', 'Withdrawal paid', 'In-app withdrawal paid.', 'in_app', 'enabled', 'v1'),
  ('withdrawal.failed', 'Withdrawal failed', 'In-app withdrawal failed.', 'in_app', 'enabled', 'v1')
on conflict (key) do nothing;
