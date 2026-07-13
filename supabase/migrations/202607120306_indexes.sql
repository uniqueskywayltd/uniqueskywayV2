-- Phase 3 / 06 Indexes
-- Access-pattern indexes separated from entity creation.

create index if not exists investments_user_status_created_idx
  on public.investments (user_id, status, created_at desc);

create index if not exists notifications_unread_created_idx
  on public.notifications (user_id, created_at desc)
  where read_at is null;

create index if not exists ledger_entries_account_created_desc_idx
  on public.ledger_entries (account_id, created_at desc);

create index if not exists withdrawal_requests_admin_queue_idx
  on public.withdrawal_requests (status, created_at)
  where status in ('requested', 'reserved', 'under_review', 'approved', 'processing');

create index if not exists deposit_intents_admin_queue_idx
  on public.deposit_intents (status, created_at)
  where status in ('created', 'pending');

create index if not exists settlement_runs_status_date_idx
  on public.settlement_runs (status, settlement_date);

create index if not exists roi_schedule_items_investment_status_date_idx
  on public.roi_schedule_items (investment_id, status, settlement_date);

create index if not exists payment_provider_events_lookup_idx
  on public.payment_provider_events (provider, provider_event_id, status);

create index if not exists email_messages_dispatch_idx
  on app_private.email_messages (status, created_at)
  where status in ('queued', 'failed');

create index if not exists outbox_events_dispatch_idx
  on app_private.outbox_events (status, available_at, created_at)
  where status in ('pending', 'failed');

create index if not exists background_jobs_dispatch_idx
  on app_private.background_jobs (status, run_at, created_at)
  where status in ('pending', 'failed');

create index if not exists audit_logs_target_created_idx
  on audit.audit_logs (target_type, target_id, created_at desc);
