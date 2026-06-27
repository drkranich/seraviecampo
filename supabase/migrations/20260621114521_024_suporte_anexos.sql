alter table public.support_messages
  add column if not exists attachment_url text,
  add column if not exists attachment_type text;

-- Bucket privado para anexos do suporte (pasta = user_id da conversa)
insert into storage.buckets (id, name, public) values ('support', 'support', false)
on conflict (id) do nothing;

drop policy if exists support_files_insert on storage.objects;
create policy support_files_insert on storage.objects for insert to authenticated
with check (
  bucket_id = 'support'
  and ((storage.foldername(name))[1] = auth.uid()::text or current_user_role() = 'super_admin')
);

drop policy if exists support_files_select on storage.objects;
create policy support_files_select on storage.objects for select to authenticated
using (
  bucket_id = 'support'
  and ((storage.foldername(name))[1] = auth.uid()::text or current_user_role() = 'super_admin')
);
