-- Public buckets for funding-wallet QR codes and optional deposit transfer screenshots.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'funding-wallet-qrs',
  'funding-wallet-qrs',
  true,
  2000000,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'deposit-evidence',
  'deposit-evidence',
  true,
  3000000,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
