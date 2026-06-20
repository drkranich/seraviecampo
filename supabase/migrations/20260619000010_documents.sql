-- =====================================================================
-- Seravie Campo — Documentos de identidade (KYC), bucket PRIVADO
-- CNH (entregador) e RG (cliente/produtor). Acesso: dono + super_admin.
-- =====================================================================
alter table public.profiles
  add column if not exists document_url text,    -- caminho no bucket privado
  add column if not exists document_type text;   -- 'rg' | 'cnh'

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false) on conflict (id) do nothing;

drop policy if exists "documents_insert_own" on storage.objects;
create policy "documents_insert_own" on storage.objects for insert to authenticated
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "documents_update_own" on storage.objects;
create policy "documents_update_own" on storage.objects for update to authenticated
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

-- Leitura: só o próprio dono ou o super_admin (para verificação)
drop policy if exists "documents_select_own_or_admin" on storage.objects;
create policy "documents_select_own_or_admin" on storage.objects for select to authenticated
  using (bucket_id = 'documents' and ((storage.foldername(name))[1] = auth.uid()::text or public.current_user_role() = 'super_admin'));
