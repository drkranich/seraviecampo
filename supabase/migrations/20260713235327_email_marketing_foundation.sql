create table if not exists public.email_marketing_templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9_-]*$'),
  name text not null,
  description text not null default '',
  category text not null default 'newsletter',
  audience text[] not null default '{}'::text[],
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  subject text not null default '',
  preheader text not null default '',
  hero_title text not null default '',
  hero_body text not null default '',
  cta_label text not null default '',
  cta_url text not null default '',
  image_url text,
  palette jsonb not null default jsonb_build_object(
    'background', '#14160F',
    'surface', '#1F2318',
    'glass', '#28331E',
    'border', '#C2A878',
    'accent', '#C2A878',
    'text', '#E7E9DB',
    'muted', '#C9BE93'
  ),
  blocks jsonb not null default '[]'::jsonb check (jsonb_typeof(blocks) = 'array'),
  footer_note text not null default '',
  html_content text not null default '',
  plain_text text not null default '',
  is_system boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.email_marketing_segments (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key ~ '^[a-z0-9][a-z0-9_-]*$'),
  name text not null,
  description text not null default '',
  role_filter public.user_role[] not null default '{}'::public.user_role[],
  rules jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.email_marketing_subscribers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  email text not null,
  name text,
  role public.user_role,
  source text not null default 'manual',
  subscribed boolean not null default true,
  consent_source text,
  consent_at timestamptz,
  unsubscribed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint email_marketing_subscribers_email_check check (position('@' in email) > 1)
);

create unique index if not exists email_marketing_subscribers_email_uidx
  on public.email_marketing_subscribers (lower(email));

create table if not exists public.email_marketing_suppressions (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  reason text not null default 'unsubscribed',
  source text not null default 'seravie',
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint email_marketing_suppressions_email_check check (position('@' in email) > 1)
);

create unique index if not exists email_marketing_suppressions_email_uidx
  on public.email_marketing_suppressions (lower(email));

create table if not exists public.email_marketing_campaigns (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references public.email_marketing_templates(id) on delete set null,
  segment_id uuid references public.email_marketing_segments(id) on delete set null,
  name text not null,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'sending', 'sent', 'paused', 'archived')),
  subject text not null default '',
  preheader text not null default '',
  from_name text not null default 'Seravie Campo',
  reply_to_email text,
  scheduled_at timestamptz,
  sent_at timestamptz,
  content_snapshot jsonb not null default '{}'::jsonb,
  stats jsonb not null default jsonb_build_object(
    'queued', 0,
    'sent', 0,
    'opened', 0,
    'clicked', 0,
    'bounced', 0,
    'unsubscribed', 0
  ),
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.email_marketing_events (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.email_marketing_campaigns(id) on delete cascade,
  subscriber_id uuid references public.email_marketing_subscribers(id) on delete set null,
  recipient_user_id uuid references public.profiles(id) on delete set null,
  recipient_email text not null,
  event_type text not null check (event_type in ('queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'unsubscribed', 'failed')),
  provider_message_id text,
  provider_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists email_marketing_templates_status_idx on public.email_marketing_templates(status);
create index if not exists email_marketing_campaigns_status_idx on public.email_marketing_campaigns(status);
create index if not exists email_marketing_campaigns_template_idx on public.email_marketing_campaigns(template_id);
create index if not exists email_marketing_events_campaign_idx on public.email_marketing_events(campaign_id, event_type);

drop trigger if exists email_marketing_templates_set_updated_at on public.email_marketing_templates;
create trigger email_marketing_templates_set_updated_at
  before update on public.email_marketing_templates
  for each row execute function public.handle_updated_at();

drop trigger if exists email_marketing_segments_set_updated_at on public.email_marketing_segments;
create trigger email_marketing_segments_set_updated_at
  before update on public.email_marketing_segments
  for each row execute function public.handle_updated_at();

drop trigger if exists email_marketing_subscribers_set_updated_at on public.email_marketing_subscribers;
create trigger email_marketing_subscribers_set_updated_at
  before update on public.email_marketing_subscribers
  for each row execute function public.handle_updated_at();

drop trigger if exists email_marketing_campaigns_set_updated_at on public.email_marketing_campaigns;
create trigger email_marketing_campaigns_set_updated_at
  before update on public.email_marketing_campaigns
  for each row execute function public.handle_updated_at();

alter table public.email_marketing_templates enable row level security;
alter table public.email_marketing_segments enable row level security;
alter table public.email_marketing_subscribers enable row level security;
alter table public.email_marketing_suppressions enable row level security;
alter table public.email_marketing_campaigns enable row level security;
alter table public.email_marketing_events enable row level security;

drop policy if exists email_marketing_templates_super_admin on public.email_marketing_templates;
create policy email_marketing_templates_super_admin on public.email_marketing_templates
  for all to authenticated
  using ((select public.current_user_role()) = 'super_admin'::public.user_role)
  with check ((select public.current_user_role()) = 'super_admin'::public.user_role);

drop policy if exists email_marketing_segments_super_admin on public.email_marketing_segments;
create policy email_marketing_segments_super_admin on public.email_marketing_segments
  for all to authenticated
  using ((select public.current_user_role()) = 'super_admin'::public.user_role)
  with check ((select public.current_user_role()) = 'super_admin'::public.user_role);

drop policy if exists email_marketing_subscribers_super_admin on public.email_marketing_subscribers;
create policy email_marketing_subscribers_super_admin on public.email_marketing_subscribers
  for all to authenticated
  using ((select public.current_user_role()) = 'super_admin'::public.user_role)
  with check ((select public.current_user_role()) = 'super_admin'::public.user_role);

drop policy if exists email_marketing_suppressions_super_admin on public.email_marketing_suppressions;
create policy email_marketing_suppressions_super_admin on public.email_marketing_suppressions
  for all to authenticated
  using ((select public.current_user_role()) = 'super_admin'::public.user_role)
  with check ((select public.current_user_role()) = 'super_admin'::public.user_role);

drop policy if exists email_marketing_campaigns_super_admin on public.email_marketing_campaigns;
create policy email_marketing_campaigns_super_admin on public.email_marketing_campaigns
  for all to authenticated
  using ((select public.current_user_role()) = 'super_admin'::public.user_role)
  with check ((select public.current_user_role()) = 'super_admin'::public.user_role);

drop policy if exists email_marketing_events_super_admin on public.email_marketing_events;
create policy email_marketing_events_super_admin on public.email_marketing_events
  for all to authenticated
  using ((select public.current_user_role()) = 'super_admin'::public.user_role)
  with check ((select public.current_user_role()) = 'super_admin'::public.user_role);

grant select, insert, update, delete on
  public.email_marketing_templates,
  public.email_marketing_segments,
  public.email_marketing_subscribers,
  public.email_marketing_suppressions,
  public.email_marketing_campaigns,
  public.email_marketing_events
to authenticated;

revoke all on
  public.email_marketing_templates,
  public.email_marketing_segments,
  public.email_marketing_subscribers,
  public.email_marketing_suppressions,
  public.email_marketing_campaigns,
  public.email_marketing_events
from anon;

insert into public.email_marketing_segments (key, name, description, role_filter, rules, active)
values
  ('todos-clientes', 'Clientes da Seravie', 'Clientes cadastrados para receber ofertas, destinos e novidades da plataforma.', array['cliente']::public.user_role[], '{}'::jsonb, true),
  ('produtores-rurais', 'Produtores rurais', 'Produtores que vendem produtos, cestas, colheitas e itens regionais.', array['produtor']::public.user_role[], '{}'::jsonb, true),
  ('parceiros-experiencias', 'Parceiros de experiencias', 'Hosts, anfitrioes e operadores de experiencias rurais.', array['parceiro']::public.user_role[], '{}'::jsonb, true),
  ('entregadores', 'Entregadores', 'Rede de entrega e operacao logistica da Seravie Campo.', array['entregador']::public.user_role[], '{}'::jsonb, true),
  ('ecossistema-seravie', 'Ecossistema Seravie', 'Todos os perfis operacionais e comerciais da plataforma.', array['cliente','produtor','parceiro','entregador']::public.user_role[], '{}'::jsonb, true)
on conflict (key) do update set
  name = excluded.name,
  description = excluded.description,
  role_filter = excluded.role_filter,
  rules = excluded.rules,
  active = excluded.active,
  updated_at = now();

insert into public.email_marketing_templates (
  slug, name, description, category, audience, status, subject, preheader,
  hero_title, hero_body, cta_label, cta_url, blocks, footer_note, is_system
) values
  (
    'boas-vindas-clientes',
    'Boas-vindas para clientes',
    'Primeiro contato com quem chegou para descobrir destinos, produtores e experiencias.',
    'boas-vindas',
    array['cliente'],
    'published',
    'Seu acesso ao campo comeca aqui',
    'Descubra destinos, produtores e experiencias selecionadas pela Seravie Campo.',
    'Bem-vindo a Seravie Campo',
    'A Seravie Campo aproxima voce de hospedagens rurais, experiencias autenticas e produtos regionais com curadoria, pagamento seguro e atendimento humano.',
    'Explorar destinos',
    'https://seraviecampo.com/experiencias',
    jsonb_build_array(
      jsonb_build_object('title', 'Escolha pelo destino', 'text', 'Busque cidades, regioes e roteiros para encontrar estadias, colheitas, degustacoes e vivencias que combinam com sua viagem.'),
      jsonb_build_object('title', 'Compre com confianca', 'text', 'Reservas e pedidos podem ser acompanhados pela plataforma, com suporte interno da equipe Seravie Campo.'),
      jsonb_build_object('title', 'Valorize quem produz', 'text', 'Cada compra aproxima voce de produtores, anfitrioes e comunidades que mantem viva a cultura do campo.')
    ),
    'Voce recebeu este email porque criou uma conta ou demonstrou interesse na Seravie Campo.',
    true
  ),
  (
    'destino-em-destaque',
    'Destino em destaque',
    'Campanha editorial para apresentar uma cidade ou regiao com ofertas reais da plataforma.',
    'destinos',
    array['cliente', 'lead'],
    'published',
    'Um destino do campo para viver com calma',
    'Hospedagens, sabores e experiencias locais reunidos pela Seravie Campo.',
    'Um lugar para chegar sem pressa',
    'Entre montanhas, cozinhas regionais e produtores locais, a Seravie Campo seleciona experiencias para quem quer viajar com mais presenca e menos improviso.',
    'Ver experiencias do destino',
    'https://seraviecampo.com/destinos',
    jsonb_build_array(
      jsonb_build_object('title', 'Hospedagens com identidade', 'text', 'Pousadas, casas, fazendas e estadias que preservam a paisagem e a cultura local.'),
      jsonb_build_object('title', 'Experiencias de verdade', 'text', 'Degustacoes, visitas guiadas, colheitas, oficinas e encontros conduzidos por quem conhece o territorio.'),
      jsonb_build_object('title', 'Produtos regionais', 'text', 'Cestas, queijos, cafes, geleias, hortas e pequenos lotes para completar a viagem ou receber em casa.')
    ),
    'As ofertas podem variar conforme disponibilidade dos anfitrioes e produtores.',
    true
  ),
  (
    'produtor-rural-em-destaque',
    'Produtor rural em destaque',
    'Template para contar a historia de um produtor e puxar trafego para seus produtos.',
    'produtores',
    array['cliente'],
    'published',
    'Conheca quem produz com identidade local',
    'Uma historia do campo selecionada pela Seravie Campo.',
    'Por tras de cada produto existe uma origem',
    'A Seravie Campo valoriza produtores que cultivam, transformam e entregam alimentos com cuidado. Esta campanha aproxima o cliente da historia, da pratica e dos produtos disponiveis.',
    'Conhecer o produtor',
    'https://seraviecampo.com/cliente/explorar',
    jsonb_build_array(
      jsonb_build_object('title', 'Origem visivel', 'text', 'Mostre a propriedade, a familia, o metodo de producao e o que torna aquele produto especial.'),
      jsonb_build_object('title', 'Produtos em destaque', 'text', 'Organize a campanha com os itens mais frescos, sazonais ou representativos do produtor.'),
      jsonb_build_object('title', 'Relacao direta', 'text', 'O cliente compra pela plataforma e acompanha pedidos com suporte da Seravie Campo.')
    ),
    'A Seravie Campo intermedia a experiencia de compra e suporte dentro da plataforma.',
    true
  ),
  (
    'experiencia-publicada',
    'Nova experiencia publicada',
    'Aviso editorial para divulgar uma experiencia rural recem-publicada.',
    'experiencias',
    array['cliente', 'lead'],
    'published',
    'Uma nova experiencia rural esta esperando por voce',
    'Vivencias, degustacoes e encontros com anfitrioes locais.',
    'Viva o campo por dentro',
    'Experiencias da Seravie Campo aproximam viajantes de anfitrioes, cozinhas, paisagens, saberes e pequenos produtores. Uma nova vivencia entrou na plataforma e ja pode ser reservada.',
    'Reservar experiencia',
    'https://seraviecampo.com/experiencias',
    jsonb_build_array(
      jsonb_build_object('title', 'Anfitriao local', 'text', 'Cada experiencia nasce de quem conhece o territorio e sabe receber com autenticidade.'),
      jsonb_build_object('title', 'Agenda clara', 'text', 'Datas, capacidade, valores e detalhes ficam organizados para o cliente decidir com seguranca.'),
      jsonb_build_object('title', 'Pagamento pela plataforma', 'text', 'A Seravie Campo centraliza a reserva, o pagamento e o suporte ao cliente.')
    ),
    'Reserve com antecedencia para garantir disponibilidade.',
    true
  ),
  (
    'campanha-sazonal-colheita',
    'Campanha sazonal de colheita',
    'Campanha para ciclos de safra, feriados, fins de semana e temporadas regionais.',
    'sazonal',
    array['cliente'],
    'published',
    'A temporada do campo chegou',
    'Produtos frescos, colheitas abertas e experiencias para viver a estacao.',
    'O melhor da estacao, direto do territorio',
    'Quando a safra muda, a viagem tambem muda. A Seravie Campo organiza produtos, roteiros e experiencias que acompanham o tempo da terra.',
    'Ver ofertas da temporada',
    'https://seraviecampo.com/experiencias',
    jsonb_build_array(
      jsonb_build_object('title', 'Produtos da epoca', 'text', 'Destaque alimentos, cestas e pequenos lotes com maior frescor e disponibilidade.'),
      jsonb_build_object('title', 'Vivencias sazonais', 'text', 'Colheitas, degustacoes, piqueniques, cafes, queijarias e roteiros que dependem do calendario local.'),
      jsonb_build_object('title', 'Curadoria Seravie', 'text', 'A selecao prioriza ofertas alinhadas ao campo, a cultura regional e a experiencia do visitante.')
    ),
    'Campanha sujeita a disponibilidade e condicoes de cada produtor ou anfitriao.',
    true
  ),
  (
    'cupom-retorno',
    'Cupom de retorno',
    'Campanha de conversao para estimular nova compra ou reserva.',
    'conversao',
    array['cliente'],
    'published',
    'Volte ao campo com uma condicao especial',
    'Uma oportunidade para reservar, comprar ou presentear com Seravie Campo.',
    'Seu proximo encontro com o campo pode comecar hoje',
    'Criamos uma condicao especial para voce voltar a descobrir produtores, destinos e experiencias da Seravie Campo.',
    'Usar condicao especial',
    'https://seraviecampo.com/cliente/explorar',
    jsonb_build_array(
      jsonb_build_object('title', 'Para comprar produtos', 'text', 'Use a campanha para cestas, cafes, queijos, geleias e produtos regionais selecionados.'),
      jsonb_build_object('title', 'Para reservar experiencias', 'text', 'A oferta tambem pode levar o cliente para vivencias, hospedagens e roteiros com anfitrioes.'),
      jsonb_build_object('title', 'Para presentear', 'text', 'Transforme a campanha em convite para alguem descobrir a Seravie Campo.')
    ),
    'Condicoes promocionais podem ter prazo, limite de uso e regras especificas.',
    true
  ),
  (
    'reativacao-clientes',
    'Reativacao de clientes',
    'Campanha para clientes sem compra ou reserva recente.',
    'retencao',
    array['cliente'],
    'published',
    'Tem novidade no campo para voce',
    'Destinos, produtos e experiencias foram atualizados na Seravie Campo.',
    'O campo mudou desde sua ultima visita',
    'Novos produtores, anfitrioes e experiencias entram na Seravie Campo para tornar a descoberta mais rica, regional e confiavel.',
    'Ver novidades',
    'https://seraviecampo.com/cliente',
    jsonb_build_array(
      jsonb_build_object('title', 'Novos destinos', 'text', 'A plataforma mostra cidades e regioes conforme ofertas reais cadastradas por produtores e parceiros.'),
      jsonb_build_object('title', 'Novos sabores', 'text', 'Produtos regionais e alimentos frescos aparecem conforme disponibilidade de cada produtor.'),
      jsonb_build_object('title', 'Novas experiencias', 'text', 'Vivencias rurais, gastronomicas e culturais podem ser reservadas diretamente pela Seravie Campo.')
    ),
    'Voce pode ajustar preferencias e comunicacoes pela sua conta.',
    true
  ),
  (
    'chamada-para-anfitrioes',
    'Chamada para anfitrioes e produtores',
    'Campanha para atrair novos fornecedores alinhados a proposta da Seravie Campo.',
    'fornecedores',
    array['produtor', 'parceiro', 'lead'],
    'published',
    'Anuncie sua experiencia rural na Seravie Campo',
    'Uma plataforma para produtores, anfitrioes e destinos com identidade local.',
    'Seu territorio pode receber melhor',
    'A Seravie Campo foi criada para reunir hospedagens, experiencias, produtos regionais e produtores que querem vender com mais organizacao, suporte e visibilidade.',
    'Quero anunciar',
    'https://seraviecampo.com/signup',
    jsonb_build_array(
      jsonb_build_object('title', 'Vitrine publica viva', 'text', 'Destinos e ofertas aparecem no site conforme cadastros reais, sem depender de curadoria manual em cada cidade.'),
      jsonb_build_object('title', 'Painel de gestao', 'text', 'Produtores e parceiros organizam produtos, experiencias, reservas, pedidos e financeiro em um unico lugar.'),
      jsonb_build_object('title', 'Pagamentos integrados', 'text', 'A Seravie Campo intermedia pagamentos e suporte para uma jornada mais confiavel.')
    ),
    'A equipe Seravie avalia cadastros para manter a proposta rural, regional e autentica.',
    true
  )
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  category = excluded.category,
  audience = excluded.audience,
  status = excluded.status,
  subject = excluded.subject,
  preheader = excluded.preheader,
  hero_title = excluded.hero_title,
  hero_body = excluded.hero_body,
  cta_label = excluded.cta_label,
  cta_url = excluded.cta_url,
  blocks = excluded.blocks,
  footer_note = excluded.footer_note,
  is_system = excluded.is_system,
  updated_at = now();
