alter table public.orders
  add column if not exists producer_paid_out boolean not null default false,
  add column if not exists courier_paid_out boolean not null default false;
