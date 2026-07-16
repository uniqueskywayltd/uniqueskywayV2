-- Production email identity + platform contact defaults
-- Canonical address: info@uniqueskyway.com

update app_private.system_settings
set
  value = '"info@uniqueskyway.com"'::jsonb,
  description = coalesce(description, 'Support contact email.'),
  updated_at = now()
where key = 'platform.support_email';

update app_private.system_settings
set
  value = '"info@uniqueskyway.com"'::jsonb,
  description = coalesce(description, 'Default transactional sender.'),
  updated_at = now()
where key = 'platform.sender_email';

insert into app_private.system_settings (key, value, description)
values
  ('platform.company_name', '"Unique Sky Way"'::jsonb, 'Legal / company display name.'),
  ('platform.phone', '""'::jsonb, 'Primary support phone number.'),
  ('platform.business_hours', '"Mon–Fri 09:00–17:00 America/New_York"'::jsonb, 'Published support hours.'),
  ('platform.contact_email', '"info@uniqueskyway.com"'::jsonb, 'Public contact email.'),
  ('email.from_display', '"Unique Sky Way <info@uniqueskyway.com>"'::jsonb, 'Transactional From display identity.'),
  ('email.reply_to', '"info@uniqueskyway.com"'::jsonb, 'Transactional Reply-To address.')
on conflict (key) do update
set
  value = excluded.value,
  description = excluded.description,
  updated_at = now()
where app_private.system_settings.key in (
  'platform.company_name',
  'platform.phone',
  'platform.business_hours',
  'platform.contact_email',
  'email.from_display',
  'email.reply_to'
);
