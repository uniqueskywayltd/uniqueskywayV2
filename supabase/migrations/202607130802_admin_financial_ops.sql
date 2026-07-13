-- Phase 8.2 Financial Operations
-- Polymorphic admin notes for deposit and withdrawal review (append-only).

create table public.admin_entity_notes (
  id uuid primary key default gen_random_uuid(),
  target_type varchar(100) not null,
  target_id uuid not null,
  author_user_id uuid not null references public.users (id) on delete restrict,
  body text not null,
  created_at timestamptz not null default now(),
  constraint admin_entity_notes_body_not_blank_chk check (length(trim(body)) > 0),
  constraint admin_entity_notes_target_type_chk check (
    target_type in ('deposit_intent', 'withdrawal_request')
  )
);

create index admin_entity_notes_target_created_idx
  on public.admin_entity_notes (target_type, target_id, created_at desc);

create index admin_entity_notes_author_idx
  on public.admin_entity_notes (author_user_id, created_at desc);

alter table public.admin_entity_notes enable row level security;
-- deny-by-default; service role used by app
