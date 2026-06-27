alter table public.orders
  add column if not exists delivery_signature_url text,
  add column if not exists delivery_photo_url text,
  add column if not exists delivered_at timestamptz;
