drop policy if exists experiences_read on public.experiences;
drop policy if exists experiences_write on public.experiences;

create policy experiences_read_public_active
on public.experiences
for select
to anon, authenticated
using (active is true and coalesce(archived, false) is false);

create policy experiences_read_owner_admin
on public.experiences
for select
to authenticated
using (
  producer_id = auth.uid()
  or public.current_user_role() = 'super_admin'::public.user_role
);

create policy experiences_write
on public.experiences
for all
to authenticated
using (
  producer_id = auth.uid()
  or public.current_user_role() = 'super_admin'::public.user_role
)
with check (
  producer_id = auth.uid()
  or public.current_user_role() = 'super_admin'::public.user_role
);

drop policy if exists products_select_public_available on public.products;
create policy products_select_public_available
on public.products
for select
to anon, authenticated
using (available is true and coalesce(archived, false) is false);

drop policy if exists profiles_select_public_publishers on public.profiles;
create policy profiles_select_public_publishers
on public.profiles
for select
to anon, authenticated
using (
  role in ('produtor'::public.user_role, 'parceiro'::public.user_role)
  and verification_status is distinct from 'rejeitado'
);

drop policy if exists site_content_write on public.site_content;
create policy site_content_write
on public.site_content
for all
to authenticated
using (public.current_user_role() = 'super_admin'::public.user_role)
with check (public.current_user_role() = 'super_admin'::public.user_role);
