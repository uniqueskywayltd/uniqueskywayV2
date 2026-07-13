-- Phase 8.1 Customer Administration
-- Admin-authored notes attached to a customer for support and review context.

create table public.customer_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  author_user_id uuid not null references public.users (id) on delete restrict,
  body text not null,
  created_at timestamptz not null default now(),
  constraint customer_notes_body_not_blank_chk check (length(trim(body)) > 0)
);
create index customer_notes_user_id_created_idx on public.customer_notes (user_id, created_at desc);

alter table public.customer_notes enable row level security;
-- deny-by-default; service role used by app
