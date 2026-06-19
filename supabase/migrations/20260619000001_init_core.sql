-- =====================================================================
-- Seravie Campo — Migration inicial: núcleo de identidade e perfis
-- Fundação compartilhada pelos 4 perfis do ecossistema.
-- =====================================================================

-- ---------- Tipos ----------
-- Os quatro papéis do ecossistema Seravie Campo
create type public.user_role as enum (
  'super_admin',  -- Seravie OS
  'produtor',     -- Produtor Rural
  'cliente',      -- Cliente Final
  'entregador'    -- Entregador
);

-- Estado de verificação (modelo estilo Stripe: documento, selfie, etc.)
create type public.verification_status as enum (
  'pendente',
  'em_analise',
  'verificado',
  'rejeitado'
);

-- ---------- Tabela: profiles ----------
-- Estende auth.users com dados de perfil e papel no ecossistema.
create table public.profiles (
  id                  uuid primary key references auth.users (id) on delete cascade,
  role                public.user_role not null default 'cliente',
  full_name           text,
  display_name        text,
  avatar_url          text,
  phone               text,
  city                text,
  state               text,
  verification_status public.verification_status not null default 'pendente',
  -- Aceite obrigatório de termos (Política de Intermediação)
  terms_accepted_at   timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.profiles is
  'Perfis de usuário do Seravie Campo, vinculados a auth.users. Define o papel (super_admin, produtor, cliente, entregador).';

-- ---------- Trigger: updated_at automático ----------
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- ---------- Trigger: criar profile ao registrar usuário ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'cliente')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Helper: papel do usuário atual ----------
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ---------- Row Level Security ----------
alter table public.profiles enable row level security;

-- Todo usuário autenticado pode ler perfis (catálogo público de produtores etc.).
create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

-- Usuário pode atualizar apenas o próprio perfil.
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Super admin pode atualizar qualquer perfil (aprovações/moderação).
create policy "profiles_update_admin"
  on public.profiles for update
  to authenticated
  using (public.current_user_role() = 'super_admin');
