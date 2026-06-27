alter table public.orders add column if not exists self_delivery boolean not null default false;

-- Entregas próprias do produtor não entram no pool de entregadores
drop policy if exists orders_select_courier on public.orders;
create policy orders_select_courier on public.orders for select
  using (
    current_user_role() = 'entregador'
    and (
      (status = 'saiu_entrega' and delivery_person_id is null and coalesce(self_delivery, false) = false)
      or delivery_person_id = auth.uid()
    )
  );

drop policy if exists orders_update_courier on public.orders;
create policy orders_update_courier on public.orders for update
  using (
    current_user_role() = 'entregador'
    and (
      delivery_person_id = auth.uid()
      or (status = 'saiu_entrega' and delivery_person_id is null and coalesce(self_delivery, false) = false)
    )
  )
  with check (
    current_user_role() = 'entregador' and delivery_person_id = auth.uid()
  );
