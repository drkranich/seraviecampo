-- GPS: coordenadas no perfil
alter table public.profiles
  add column if not exists lat double precision,
  add column if not exists lng double precision,
  add column if not exists geo_updated_at timestamptz;

-- RESERVA DE COLHEITA
create table if not exists public.harvest_reservations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  producer_id uuid not null references public.profiles(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  quantity numeric not null default 1,
  status text not null default 'reservado',
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.harvest_reservations enable row level security;

drop policy if exists hr_select on public.harvest_reservations;
create policy hr_select on public.harvest_reservations for select
  using (customer_id = auth.uid() or producer_id = auth.uid() or current_user_role() = 'super_admin');

drop policy if exists hr_insert on public.harvest_reservations;
create policy hr_insert on public.harvest_reservations for insert
  with check (customer_id = auth.uid());

drop policy if exists hr_update on public.harvest_reservations;
create policy hr_update on public.harvest_reservations for update
  using (customer_id = auth.uid() or producer_id = auth.uid())
  with check (customer_id = auth.uid() or producer_id = auth.uid());

create index if not exists hr_producer_idx on public.harvest_reservations(producer_id);
create index if not exists hr_customer_idx on public.harvest_reservations(customer_id);

-- FEED SOCIAL
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  body text not null,
  image_url text,
  created_at timestamptz not null default now()
);
alter table public.posts enable row level security;

drop policy if exists posts_select on public.posts;
create policy posts_select on public.posts for select using (auth.uid() is not null);

drop policy if exists posts_insert on public.posts;
create policy posts_insert on public.posts for insert with check (author_id = auth.uid());

drop policy if exists posts_update on public.posts;
create policy posts_update on public.posts for update using (author_id = auth.uid()) with check (author_id = auth.uid());

drop policy if exists posts_delete on public.posts;
create policy posts_delete on public.posts for delete using (author_id = auth.uid() or current_user_role() = 'super_admin');

create index if not exists posts_author_idx on public.posts(author_id);
create index if not exists posts_created_idx on public.posts(created_at desc);
