-- =====================================================================
-- Seravie Campo — Endurecimento de segurança (advisors do Supabase)
-- =====================================================================

-- 1) Fixar search_path da função de trigger (evita sequestro de search_path)
alter function public.handle_updated_at() set search_path = public;

-- 2) Bucket público não precisa de SELECT amplo em storage.objects:
--    a URL pública já serve os arquivos. Remover evita listagem do bucket.
drop policy if exists "media_read_public" on storage.objects;

-- 3) Menor privilégio nas funções SECURITY DEFINER expostas pela API REST.
--    Funções de trigger/evento não devem ser chamáveis por RPC.
revoke execute on function public.handle_new_user()    from anon, authenticated, public;
revoke execute on function public.handle_updated_at()  from anon, authenticated, public;

do $$ begin
  revoke execute on function public.rls_auto_enable() from anon, authenticated, public;
exception when undefined_function then null; end $$;

-- current_user_role é usada nas políticas RLS dos usuários autenticados.
revoke execute on function public.current_user_role() from anon, public;
grant  execute on function public.current_user_role() to authenticated;

-- checkout só faz sentido para usuário autenticado.
revoke execute on function public.checkout(text, text, text, text, public.payment_method) from anon, public;
grant  execute on function public.checkout(text, text, text, text, public.payment_method) to authenticated;
