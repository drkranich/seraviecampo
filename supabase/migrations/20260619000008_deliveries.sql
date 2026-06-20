-- =====================================================================
-- Seravie Campo — Entregas (perfil Entregador)
-- Atribuição de entregador ao pedido + taxa de entrega + RLS.
-- Idempotente.
-- =====================================================================
alter table public.orders
  add column if not exists delivery_person_id uuid references public.profiles(id),
  add column if not exists delivery_fee_cents integer not null default 800;

create index if not exists orders_delivery_person_idx on public.orders(delivery_person_id);

-- Entregador vê entregas disponíveis (saiu para entrega, sem dono) e as suas
drop policy if exists "orders_select_courier" on public.orders;
create policy "orders_select_courier" on public.orders for select to authenticated
  using (
    public.current_user_role() = 'entregador'
    and ((status = 'saiu_entrega' and delivery_person_id is null) or delivery_person_id = auth.uid())
  );

-- Entregador aceita (assume) uma entrega disponível ou atualiza a sua;
-- só pode atribuir a si mesmo (with check).
drop policy if exists "orders_update_courier" on public.orders;
create policy "orders_update_courier" on public.orders for update to authenticated
  using (
    public.current_user_role() = 'entregador'
    and (delivery_person_id = auth.uid() or (status = 'saiu_entrega' and delivery_person_id is null))
  )
  with check (public.current_user_role() = 'entregador' and delivery_person_id = auth.uid());

-- Itens do pedido também visíveis ao entregador responsável
drop policy if exists "order_items_select" on public.order_items;
create policy "order_items_select" on public.order_items for select to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = order_items.order_id
      and (o.customer_id = auth.uid() or o.producer_id = auth.uid()
           or o.delivery_person_id = auth.uid()
           or public.current_user_role() = 'super_admin')
  ));
