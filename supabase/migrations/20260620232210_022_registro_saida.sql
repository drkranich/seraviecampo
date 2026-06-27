alter table public.orders
  add column if not exists dispatch_photo_url text,
  add column if not exists dispatch_signature_url text,
  add column if not exists dispatched_at timestamptz;
