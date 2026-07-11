drop policy if exists experiences_read_public_active on public.experiences;
drop policy if exists experiences_read_owner_admin on public.experiences;
drop policy if exists experiences_write on public.experiences;

create policy experiences_read_public_active
on public.experiences
for select
to anon
using (active is true and coalesce(archived, false) is false);

create policy experiences_read_authenticated
on public.experiences
for select
to authenticated
using (
  (active is true and coalesce(archived, false) is false)
  or producer_id = (select auth.uid())
  or (select public.current_user_role()) = 'super_admin'::public.user_role
);

create policy experiences_insert
on public.experiences
for insert
to authenticated
with check (
  producer_id = (select auth.uid())
  or (select public.current_user_role()) = 'super_admin'::public.user_role
);

create policy experiences_update
on public.experiences
for update
to authenticated
using (
  producer_id = (select auth.uid())
  or (select public.current_user_role()) = 'super_admin'::public.user_role
)
with check (
  producer_id = (select auth.uid())
  or (select public.current_user_role()) = 'super_admin'::public.user_role
);

create policy experiences_delete
on public.experiences
for delete
to authenticated
using (
  producer_id = (select auth.uid())
  or (select public.current_user_role()) = 'super_admin'::public.user_role
);

drop policy if exists products_select_public_available on public.products;
create policy products_select_public_available
on public.products
for select
to anon
using (available is true and coalesce(archived, false) is false);

drop policy if exists profiles_select_public_publishers on public.profiles;
create policy profiles_select_public_publishers
on public.profiles
for select
to anon
using (
  role in ('produtor'::public.user_role, 'parceiro'::public.user_role)
  and verification_status is distinct from 'rejeitado'
);

drop policy if exists site_content_write on public.site_content;

create policy site_content_insert_admin
on public.site_content
for insert
to authenticated
with check ((select public.current_user_role()) = 'super_admin'::public.user_role);

create policy site_content_update_admin
on public.site_content
for update
to authenticated
using ((select public.current_user_role()) = 'super_admin'::public.user_role)
with check ((select public.current_user_role()) = 'super_admin'::public.user_role);

create policy site_content_delete_admin
on public.site_content
for delete
to authenticated
using ((select public.current_user_role()) = 'super_admin'::public.user_role);
