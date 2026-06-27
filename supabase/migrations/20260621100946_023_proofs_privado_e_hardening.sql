-- Bucket privado para comprovantes (assinaturas e fotos de saída/entrega)
insert into storage.buckets (id, name, public) values ('proofs', 'proofs', false)
on conflict (id) do nothing;

-- INSERT: somente partes do pedido (pasta = order_id)
drop policy if exists proofs_insert on storage.objects;
create policy proofs_insert on storage.objects for insert to authenticated
with check (
  bucket_id = 'proofs'
  and exists (
    select 1 from public.orders o
    where o.id::text = (storage.foldername(name))[1]
      and (o.customer_id = auth.uid() or o.producer_id = auth.uid() or o.delivery_person_id = auth.uid())
  )
);

-- SELECT: partes do pedido ou super admin
drop policy if exists proofs_select on storage.objects;
create policy proofs_select on storage.objects for select to authenticated
using (
  bucket_id = 'proofs'
  and (
    current_user_role() = 'super_admin'
    or exists (
      select 1 from public.orders o
      where o.id::text = (storage.foldername(name))[1]
        and (o.customer_id = auth.uid() or o.producer_id = auth.uid() or o.delivery_person_id = auth.uid())
    )
  )
);

-- UPDATE (upsert) pelas partes
drop policy if exists proofs_update on storage.objects;
create policy proofs_update on storage.objects for update to authenticated
using (
  bucket_id = 'proofs'
  and exists (
    select 1 from public.orders o
    where o.id::text = (storage.foldername(name))[1]
      and (o.customer_id = auth.uid() or o.producer_id = auth.uid() or o.delivery_person_id = auth.uid())
  )
);

-- Hardening: admin_emails não deve ser chamável por anônimos
revoke execute on function public.admin_emails() from anon, public;
grant execute on function public.admin_emails() to authenticated;
