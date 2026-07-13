-- Phase 3 / 04 Notifications
-- Event-driven notification records, channel delivery tracking, email lifecycle, and outbox.

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  type varchar(120) not null,
  title varchar(180) not null,
  body text not null,
  priority public.notification_priority not null default 'info',
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_id_created_at_idx on public.notifications (user_id, created_at);
create index notifications_user_id_read_at_idx on public.notifications (user_id, read_at);
create index notifications_type_idx on public.notifications (type);

create table public.notification_channel_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  channel public.notification_channel not null,
  topic varchar(120) not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_channel_preferences_topic_chk check (topic ~ '^[a-z][a-z0-9_.]*$')
);

create unique index notification_channel_preferences_user_channel_topic_uidx
  on public.notification_channel_preferences (user_id, channel, topic);
create index notification_channel_preferences_user_id_idx on public.notification_channel_preferences (user_id);

create table app_private.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid references public.notifications (id) on delete cascade,
  recipient_user_id uuid references public.users (id) on delete set null,
  channel public.notification_channel not null,
  idempotency_key varchar(180) not null,
  provider_message_id varchar(180),
  status public.notification_delivery_status not null default 'pending',
  attempt_count integer not null default 0,
  last_attempt_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_deliveries_attempt_count_chk check (attempt_count >= 0)
);

create unique index notification_deliveries_idempotency_key_uidx
  on app_private.notification_deliveries (idempotency_key);
create index notification_deliveries_status_idx on app_private.notification_deliveries (status);
create index notification_deliveries_notification_id_idx on app_private.notification_deliveries (notification_id);

create table app_private.email_messages (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid references public.users (id) on delete set null,
  to_email varchar(320) not null,
  template_key varchar(120) not null,
  template_version varchar(40) not null,
  idempotency_key varchar(180) not null,
  provider_message_id varchar(180),
  status public.email_status not null default 'queued',
  attempt_count integer not null default 0,
  last_error text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint email_messages_attempt_count_chk check (attempt_count >= 0),
  constraint email_messages_template_key_chk check (template_key ~ '^[a-z][a-z0-9_.]*$'),
  constraint email_messages_email_not_blank_chk check (length(trim(to_email)) > 3)
);

create unique index email_messages_idempotency_key_uidx on app_private.email_messages (idempotency_key);
create index email_messages_user_id_idx on app_private.email_messages (recipient_user_id);
create index email_messages_status_idx on app_private.email_messages (status);
create index email_messages_template_idx on app_private.email_messages (template_key, template_version);

create table app_private.outbox_events (
  id uuid primary key default gen_random_uuid(),
  event_type varchar(160) not null,
  aggregate_type varchar(100) not null,
  aggregate_id varchar(120) not null,
  payload jsonb not null,
  status public.outbox_status not null default 'pending',
  attempt_count integer not null default 0,
  available_at timestamptz not null default now(),
  processed_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  constraint outbox_events_attempt_count_chk check (attempt_count >= 0),
  constraint outbox_events_aggregate_not_blank_chk check (
    length(trim(aggregate_type)) > 0
    and length(trim(aggregate_id)) > 0
  )
);

create index outbox_events_status_available_idx on app_private.outbox_events (status, available_at);
create index outbox_events_aggregate_idx on app_private.outbox_events (aggregate_type, aggregate_id);
create index outbox_events_event_type_idx on app_private.outbox_events (event_type);

create view app_private.email_queue as
select *
from app_private.email_messages
where status in ('queued', 'failed')
  and attempt_count < 5
order by created_at asc;
