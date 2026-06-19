-- =====================================================================
-- Seravie Campo — Catálogo do Produtor
-- Propriedades rurais + produtos (com a "Minha Produção": plantado,
-- crescendo, pronto, reservado) e RLS por produtor.
-- =====================================================================

-- ---------- Tipos ----------
create type public.product_category as enum (
  'hortifruti','laticinios','ovos','carnes','mel_geleias',
  'cafe','bebidas','paes_massas','organicos','outros'
);

create type public.production_status as enum (
  'plantado',   -- 🌱
  'crescendo',  -- 🌿
  'pronto',     -- 🍅 disponível para venda
  'reservado'   -- 📦 reserva de colheita
);

create type public.product_unit as enum (
  'kg','g','unidade','duzia','litro','maco','bandeja','pote','caixa'
);

-- ---------- Propriedades rurais ----------
create table public.properties (
  id           uuid primary key default gen_random_uuid(),
  producer_id  uuid not null references public.profiles(id) on delete cascade,
  name         text not null,
  description  text,
  city         text,
  state        text,
  latitude     double precision,
  longitude    double precision,
  cover_url    text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.properties is
  'Propriedades rurais cadastradas por produtores.';

-- ---------- Produtos ----------
create table public.products (
  id                uuid primary key default gen_random_uuid(),
  producer_id       uuid not null references public.profiles(id) on delete cascade,
  property_id       uuid references public.properties(id) on delete set null,
  name              text not null,
  description       text,                 -- a "história" do produto
  category          public.product_category not null default 'outros',
  production_status public.production_status not null default 'pronto',
  price_cents       integer not null default 0 check (price_cents >= 0),
  unit              public.product_unit not null default 'unidade',
  stock             numeric not null default 0 check (stock >= 0),
  is_organic        boolean not null default false,
  available         boolean not null default true,  -- publicado/visível
  available_from    date,                 -- reserva de colheita
  image_url         text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.products is
  'Produtos anunciados pelos produtores no marketplace Seravie Campo.';

-- ---------- Índices ----------
create index products_producer_idx   on public.products(producer_id);
create index products_category_idx   on public.products(category);
create index products_available_idx  on public.products(available);
create index properties_producer_idx on public.properties(producer_id);

-- ---------- Triggers updated_at ----------
create trigger properties_set_updated_at
  before update on public.properties
  for each row execute function public.handle_updated_at();

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.handle_updated_at();

-- ---------- Row Level Security ----------
alter table public.properties enable row level security;
alter table public.products   enable row level security;

-- Propriedades: leitura pública (autenticados); escrita só do dono.
create policy "properties_select" on public.properties for select to authenticated
  using (true);
create policy "properties_insert_own" on public.properties for insert to authenticated
  with check (producer_id = auth.uid());
create policy "properties_update_own" on public.properties for update to authenticated
  using (producer_id = auth.uid()) with check (producer_id = auth.uid());
create policy "properties_delete_own" on public.properties for delete to authenticated
  using (producer_id = auth.uid());

-- Produtos: clientes veem os disponíveis; produtor vê/gere os seus; admin vê tudo.
create policy "products_select" on public.products for select to authenticated
  using (
    available = true
    or producer_id = auth.uid()
    or public.current_user_role() = 'super_admin'
  );
create policy "products_insert_own" on public.products for insert to authenticated
  with check (producer_id = auth.uid());
create policy "products_update_own" on public.products for update to authenticated
  using (producer_id = auth.uid()) with check (producer_id = auth.uid());
create policy "products_delete_own" on public.products for delete to authenticated
  using (producer_id = auth.uid());
