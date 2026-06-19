-- =====================================================================
-- Seravie Campo — Cesta, Pedidos e Checkout
-- Cada pedido é produtor<->cliente direto (contrato direto). Uma cesta
-- com itens de vários produtores gera um pedido por produtor.
-- =====================================================================

-- ---------- Tipos ----------
create type public.order_status as enum (
  'novo','preparando','saiu_entrega','entregue','cancelado'
);
create type public.payment_method as enum ('pix','cartao','dinheiro');

-- ---------- Cesta ----------
create table public.cart_items (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity   numeric not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

-- ---------- Pedidos ----------
create table public.orders (
  id               uuid primary key default gen_random_uuid(),
  customer_id      uuid not null references public.profiles(id) on delete cascade,
  producer_id      uuid not null references public.profiles(id) on delete cascade,
  status           public.order_status not null default 'novo',
  payment_method   public.payment_method,
  total_cents      integer not null default 0,
  delivery_name    text,
  delivery_phone   text,
  delivery_address text,
  delivery_notes   text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table public.order_items (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references public.orders(id) on delete cascade,
  product_id       uuid references public.products(id) on delete set null,
  product_name     text not null,
  unit             public.product_unit not null default 'unidade',
  unit_price_cents integer not null,
  quantity         numeric not null,
  line_total_cents integer not null
);

create index orders_customer_idx   on public.orders(customer_id);
create index orders_producer_idx   on public.orders(producer_id);
create index order_items_order_idx on public.order_items(order_id);

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.handle_updated_at();

-- ---------- RLS ----------
alter table public.cart_items  enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

create policy "cart_own" on public.cart_items for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "orders_select" on public.orders for select to authenticated
  using (customer_id = auth.uid() or producer_id = auth.uid() or public.current_user_role() = 'super_admin');
create policy "orders_insert_own" on public.orders for insert to authenticated
  with check (customer_id = auth.uid());
create policy "orders_update_parties" on public.orders for update to authenticated
  using (customer_id = auth.uid() or producer_id = auth.uid())
  with check (customer_id = auth.uid() or producer_id = auth.uid());

create policy "order_items_select" on public.order_items for select to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = order_items.order_id
      and (o.customer_id = auth.uid() or o.producer_id = auth.uid() or public.current_user_role() = 'super_admin')
  ));

-- ---------- Checkout atômico ----------
-- Lê a cesta do usuário, cria 1 pedido por produtor com seus itens,
-- calcula o total e esvazia a cesta. Retorna os IDs dos pedidos criados.
create function public.checkout(
  p_name text, p_phone text, p_address text, p_notes text, p_payment public.payment_method
)
returns setof uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_customer uuid := auth.uid();
  v_producer uuid;
  v_order uuid;
begin
  if v_customer is null then
    raise exception 'Usuario nao autenticado';
  end if;

  for v_producer in
    select distinct p.producer_id
    from cart_items ci
    join products p on p.id = ci.product_id
    where ci.user_id = v_customer
  loop
    insert into orders (customer_id, producer_id, status, payment_method,
                        delivery_name, delivery_phone, delivery_address, delivery_notes)
    values (v_customer, v_producer, 'novo', p_payment, p_name, p_phone, p_address, p_notes)
    returning id into v_order;

    insert into order_items (order_id, product_id, product_name, unit, unit_price_cents, quantity, line_total_cents)
    select v_order, p.id, p.name, p.unit, p.price_cents, ci.quantity, (p.price_cents * ci.quantity)::int
    from cart_items ci
    join products p on p.id = ci.product_id
    where ci.user_id = v_customer and p.producer_id = v_producer;

    update orders set total_cents = coalesce((
      select sum(line_total_cents) from order_items where order_id = v_order
    ), 0) where id = v_order;

    return next v_order;
  end loop;

  delete from cart_items where user_id = v_customer;
end;
$$;

-- Permite que usuários autenticados chamem o checkout via RPC.
grant execute on function public.checkout(text, text, text, text, public.payment_method) to authenticated;
