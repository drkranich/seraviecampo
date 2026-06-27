-- Assinatura de Experiências (separada da assinatura de produtos do produtor)
create table if not exists public.experience_subscriptions (
  account_id uuid primary key references public.profiles(id) on delete cascade,
  plan text not null default 'exp_inicial',
  status text not null default 'inativa',
  stripe_subscription_id text,
  cancel_at_period_end boolean not null default false,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.experience_subscriptions enable row level security;

drop policy if exists exp_subs_select on public.experience_subscriptions;
create policy exp_subs_select on public.experience_subscriptions for select to authenticated
  using (account_id = auth.uid() or public.current_user_role() = 'super_admin');

drop policy if exists exp_subs_insert on public.experience_subscriptions;
create policy exp_subs_insert on public.experience_subscriptions for insert to authenticated
  with check (account_id = auth.uid());

drop policy if exists exp_subs_update on public.experience_subscriptions;
create policy exp_subs_update on public.experience_subscriptions for update to authenticated
  using (account_id = auth.uid()) with check (account_id = auth.uid());

-- Planos de Experiências (mensalidade + comissão própria, diferente de produtos)
insert into public.plans (id, role, name, tagline, price_cents, commission_pct, features, active, sort) values
  ('exp_inicial','experiencias','Experiências — Inicial','Comece a ofertar vivências',0,15,
     array['Publique experiências','Reservas e pagamento via Stripe','Comissão de 15% por reserva','Suporte por e-mail'], true, 1),
  ('exp_pro','experiencias','Experiências — Pro','Para anfitriões frequentes',3900,10,
     array['Tudo do Inicial','Destaque na vitrine','Comissão de 10% por reserva','Suporte prioritário'], true, 2),
  ('exp_premium','experiencias','Experiências — Premium','Operação completa de experiências',9900,6,
     array['Tudo do Pro','Prioridade máxima na vitrine','Comissão de 6% por reserva','Gerente de conta'], true, 3)
on conflict (id) do nothing;
