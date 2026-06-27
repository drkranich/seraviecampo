-- Pagamento
alter table public.orders
  add column if not exists payment_status text not null default 'pendente',
  add column if not exists paid_at timestamptz;

-- Admin pode atualizar pedidos (para resolver reembolsos)
drop policy if exists orders_update_admin on public.orders;
create policy orders_update_admin on public.orders for update
  using (current_user_role() = 'super_admin')
  with check (current_user_role() = 'super_admin');

-- Disputas / resolução de conflitos
create table if not exists public.disputes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  opened_by uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  opened_role text not null,
  reason text not null,
  description text,
  status text not null default 'aberta',
  resolution_note text,
  refunded boolean not null default false,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
alter table public.disputes enable row level security;

drop policy if exists disputes_select on public.disputes;
create policy disputes_select on public.disputes for select using (
  opened_by = auth.uid()
  or current_user_role() = 'super_admin'
  or exists (
    select 1 from public.orders o
    where o.id = order_id
      and (o.customer_id = auth.uid() or o.producer_id = auth.uid() or o.delivery_person_id = auth.uid())
  )
);

drop policy if exists disputes_insert on public.disputes;
create policy disputes_insert on public.disputes for insert with check (
  opened_by = auth.uid()
  and exists (
    select 1 from public.orders o
    where o.id = order_id
      and (o.customer_id = auth.uid() or o.producer_id = auth.uid() or o.delivery_person_id = auth.uid())
  )
);

drop policy if exists disputes_update_admin on public.disputes;
create policy disputes_update_admin on public.disputes for update
  using (current_user_role() = 'super_admin')
  with check (current_user_role() = 'super_admin');

create index if not exists disputes_order_idx on public.disputes(order_id);
create index if not exists disputes_status_idx on public.disputes(status);
