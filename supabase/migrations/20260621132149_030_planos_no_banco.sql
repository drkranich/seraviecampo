create table if not exists public.plans (
  id text primary key,
  role text not null,
  name text not null,
  tagline text not null default '',
  price_cents int not null default 0,
  commission_pct int,
  features text[] not null default '{}',
  stripe_price_id text,
  stripe_product_id text,
  active boolean not null default true,
  sort int not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.plans enable row level security;

drop policy if exists plans_read on public.plans;
create policy plans_read on public.plans for select using (true);

drop policy if exists plans_write on public.plans;
create policy plans_write on public.plans for all
  using (current_user_role() = 'super_admin')
  with check (current_user_role() = 'super_admin');

insert into public.plans (id, role, name, tagline, price_cents, commission_pct, features, active, sort) values
  ('campo','produtor','Campo','Para começar a vender',1990,12, array['Até 15 produtos','Pedidos e cesta','Perfil público','Comissão de 12% por venda','Suporte por e-mail'], true,1),
  ('gourmet','produtor','Gourmet','Para crescer com constância',4900,8, array['Produtos ilimitados','Assinaturas de cesta','Insights de vendas','Selo verificado','Comissão de 8% por venda','Suporte prioritário'], true,2),
  ('premium','produtor','Premium','Operação gourmet completa',9900,5, array['Tudo do Gourmet','IA Rural','Turismo + Agro','Comissão de 5% por venda','Marketing avançado','Gerente de conta'], true,3),
  ('cli_livre','cliente','Avulso (Degustação)','Experimente por 15 dias',0,null, array['Degustação de 15 dias','Até 5 compras de teste','Acesso à vitrine completa','Depois, escolha um plano pago'], true,1),
  ('cli_sabor','cliente','Clube Sabor','Para quem compra sempre',1990,null, array['Frete reduzido','Novidades antecipadas','5% de desconto','Cesta surpresa trimestral'], true,2),
  ('cli_gourmet','cliente','Clube Gourmet','A experiência completa',3990,null, array['Maior desconto no frete','10% de desconto','Cesta surpresa mensal','Acesso a produtores premium','Prioridade em reservas de colheita'], true,3),
  ('ent_base','entregador','Parceiro','Comece a entregar',0,null, array['Aceitar entregas','Ganhos por entrega','Histórico de corridas'], true,1),
  ('ent_pro','entregador','Entregador Pro','Mais entregas, mais ganhos',2990,null, array['Prioridade nas entregas da região','Selo Pro no perfil','Suporte prioritário','Relatório de ganhos'], true,2),
  ('ent_premium','entregador','Entregador Premium','Operação no máximo',5990,null, array['Tudo do Pro','Rotas exclusivas','Antecipação de ganhos','Gerente de conta'], true,3)
on conflict (id) do nothing;
