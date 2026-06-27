-- MÓDULO EXPERIÊNCIAS: turismo rural / vivências vendidas pela plataforma
create table if not exists public.experiences (
  id uuid primary key default gen_random_uuid(),
  producer_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  title text not null,
  category text not null default 'gastronomia',
  summary text not null default '',
  description text not null default '',
  duration_min int not null default 120,
  capacity int not null default 10,
  price_cents int not null default 0,
  currency text not null default 'BRL',
  location text not null default '',
  includes text[] not null default '{}',
  images text[] not null default '{}',
  active boolean not null default true,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.experiences enable row level security;

drop policy if exists experiences_read on public.experiences;
create policy experiences_read on public.experiences for select
  using ((active = true and archived = false) or producer_id = auth.uid() or current_user_role() = 'super_admin');

drop policy if exists experiences_write on public.experiences;
create policy experiences_write on public.experiences for all
  using (producer_id = auth.uid() or current_user_role() = 'super_admin')
  with check (producer_id = auth.uid() or current_user_role() = 'super_admin');

create index if not exists experiences_producer_idx on public.experiences(producer_id);
create index if not exists experiences_active_idx on public.experiences(active, archived);

create table if not exists public.experience_bookings (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references public.experiences(id) on delete cascade,
  producer_id uuid not null references public.profiles(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  date date not null,
  time text not null default '',
  people int not null default 1,
  total_cents int not null default 0,
  currency text not null default 'BRL',
  status text not null default 'pendente',
  payment_status text not null default 'pendente',
  paid_at timestamptz,
  producer_paid_out boolean not null default false,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.experience_bookings enable row level security;

drop policy if exists exp_bookings_select on public.experience_bookings;
create policy exp_bookings_select on public.experience_bookings for select
  using (customer_id = auth.uid() or producer_id = auth.uid() or current_user_role() = 'super_admin');

drop policy if exists exp_bookings_insert on public.experience_bookings;
create policy exp_bookings_insert on public.experience_bookings for insert
  with check (customer_id = auth.uid());

drop policy if exists exp_bookings_update on public.experience_bookings;
create policy exp_bookings_update on public.experience_bookings for update
  using (producer_id = auth.uid() or current_user_role() = 'super_admin')
  with check (producer_id = auth.uid() or current_user_role() = 'super_admin');

create index if not exists exp_bookings_producer_idx on public.experience_bookings(producer_id);
create index if not exists exp_bookings_customer_idx on public.experience_bookings(customer_id);
create index if not exists exp_bookings_exp_idx on public.experience_bookings(experience_id);
