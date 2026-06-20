-- =====================================================================
-- Seravie Campo — Pagamentos (Stripe) e Verificação Facial
-- Stripe Connect no produtor + assinatura do SaaS + selfie/verificação.
-- =====================================================================

-- ---------- Perfil: Stripe Connect + verificação facial ----------
alter table public.profiles
  add column stripe_account_id      text,   -- conta conectada (Stripe Connect)
  add column stripe_charges_enabled boolean not null default false,
  add column stripe_customer_id     text,   -- cliente de billing do SaaS
  add column selfie_url             text,   -- caminho da selfie no Storage
  add column face_verified          boolean not null default false,
  add column verified_at            timestamptz;

-- ---------- Assinatura do SaaS (produtor paga a Seravie Campo) ----------
create table public.subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  account_id             uuid not null unique references public.profiles(id) on delete cascade,
  plan                   text not null default 'campo',     -- campo | gourmet | premium
  status                 text not null default 'inativa',   -- inativa | ativa | trial | cancelada | pendente
  stripe_subscription_id text,
  current_period_end     timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.handle_updated_at();

alter table public.subscriptions enable row level security;

create policy "subscriptions_select_own" on public.subscriptions for select to authenticated
  using (account_id = auth.uid() or public.current_user_role() = 'super_admin');
create policy "subscriptions_upsert_own" on public.subscriptions for insert to authenticated
  with check (account_id = auth.uid());
create policy "subscriptions_update_own" on public.subscriptions for update to authenticated
  using (account_id = auth.uid()) with check (account_id = auth.uid());

-- ---------- Storage: bucket privado de selfies ----------
insert into storage.buckets (id, name, public)
values ('selfies', 'selfies', false)
on conflict (id) do nothing;

create policy "selfies_insert_own" on storage.objects for insert to authenticated
  with check (bucket_id = 'selfies' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "selfies_select_own" on storage.objects for select to authenticated
  using (bucket_id = 'selfies' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "selfies_update_own" on storage.objects for update to authenticated
  using (bucket_id = 'selfies' and (storage.foldername(name))[1] = auth.uid()::text);
