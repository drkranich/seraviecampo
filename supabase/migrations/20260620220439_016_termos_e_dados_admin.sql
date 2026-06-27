-- Captura de origem (IP/país/dispositivo) no perfil
alter table public.profiles
  add column if not exists last_ip text,
  add column if not exists last_country text,
  add column if not exists last_device text;

-- Termos versionados (editáveis pelo super admin)
create table if not exists public.legal_terms (
  slug text primary key,
  title text not null,
  content text not null,
  version int not null default 1,
  updated_by uuid,
  updated_at timestamptz not null default now()
);
alter table public.legal_terms enable row level security;

drop policy if exists legal_terms_select on public.legal_terms;
create policy legal_terms_select on public.legal_terms for select using (auth.uid() is not null);

drop policy if exists legal_terms_write on public.legal_terms;
create policy legal_terms_write on public.legal_terms for all
  using (current_user_role() = 'super_admin')
  with check (current_user_role() = 'super_admin');

-- Aceites assinados (com IP, país, dispositivo, hora)
create table if not exists public.term_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  terms_slug text not null,
  terms_version int not null,
  content_snapshot text not null,
  ip text,
  country text,
  device text,
  user_agent text,
  full_name text,
  email text,
  accepted_at timestamptz not null default now()
);
alter table public.term_acceptances enable row level security;

drop policy if exists term_acceptances_insert on public.term_acceptances;
create policy term_acceptances_insert on public.term_acceptances for insert with check (user_id = auth.uid());

drop policy if exists term_acceptances_select on public.term_acceptances;
create policy term_acceptances_select on public.term_acceptances for select
  using (user_id = auth.uid() or current_user_role() = 'super_admin');

create index if not exists term_acc_user_idx on public.term_acceptances(user_id);

-- Admin pode ver as selfies (orofacial) no Storage
drop policy if exists selfies_select_admin on storage.objects;
create policy selfies_select_admin on storage.objects for select to authenticated
  using (bucket_id = 'selfies' and current_user_role() = 'super_admin');

-- Função para o super admin obter e-mails (auth.users)
create or replace function public.admin_emails()
returns table(id uuid, email text)
language sql
security definer
set search_path to public, auth
as $function$
  select u.id, u.email::text
  from auth.users u
  where public.current_user_role() = 'super_admin';
$function$;

grant execute on function public.admin_emails() to authenticated;
