-- Phase 5 / 01 Customer Experience
-- Profile avatar metadata and customer account-experience preferences.

alter table public.customer_profiles
add column avatar_storage_path varchar(500),
add column avatar_content_type varchar(80),
add column avatar_updated_at timestamptz,
add constraint customer_profiles_avatar_content_type_chk check (
  avatar_content_type is null
  or avatar_content_type in ('image/webp')
);

create table public.customer_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  appearance varchar(20) not null default 'system',
  language varchar(16) not null default 'en',
  time_zone varchar(80) not null default 'America/New_York',
  in_app_notifications_enabled boolean not null default true,
  security_emails_enabled boolean not null default true,
  product_emails_enabled boolean not null default true,
  marketing_emails_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_preferences_appearance_chk check (appearance in ('system', 'light', 'dark')),
  constraint customer_preferences_language_chk check (language ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  constraint customer_preferences_time_zone_chk check (length(time_zone) between 3 and 80)
);

create unique index customer_preferences_user_id_uidx on public.customer_preferences (user_id);
create index customer_preferences_time_zone_idx on public.customer_preferences (time_zone);

alter table public.customer_preferences enable row level security;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'customer-avatars',
  'customer-avatars',
  true,
  1000000,
  array['image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy customer_preferences_select_own on public.customer_preferences
for select using (
  exists (
    select 1
    from public.users u
    where u.id = customer_preferences.user_id
      and u.auth_user_id = auth.uid()
  )
);

create policy customer_preferences_update_own on public.customer_preferences
for update using (
  exists (
    select 1
    from public.users u
    where u.id = customer_preferences.user_id
      and u.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.users u
    where u.id = customer_preferences.user_id
      and u.auth_user_id = auth.uid()
  )
);
