alter table public.email_marketing_subscribers
  add column if not exists email_key text generated always as (lower(email)) stored;

alter table public.email_marketing_suppressions
  add column if not exists email_key text generated always as (lower(email)) stored;

create unique index if not exists email_marketing_subscribers_email_key_uidx
  on public.email_marketing_subscribers (email_key);

create unique index if not exists email_marketing_suppressions_email_key_uidx
  on public.email_marketing_suppressions (email_key);

alter table public.email_marketing_campaigns
  drop constraint if exists email_marketing_campaigns_status_check;

alter table public.email_marketing_campaigns
  add constraint email_marketing_campaigns_status_check
  check (status in ('draft', 'queued', 'scheduled', 'sending', 'sent', 'paused', 'cancelled', 'archived'));

alter table public.email_marketing_campaigns
  alter column stats set default jsonb_build_object(
    'queued', 0,
    'sent', 0,
    'opened', 0,
    'clicked', 0,
    'bounced', 0,
    'failed', 0,
    'skipped', 0,
    'unsubscribed', 0
  );

update public.email_marketing_campaigns
set stats = coalesce(stats, '{}'::jsonb) || jsonb_build_object(
  'queued', coalesce((stats->>'queued')::int, 0),
  'sent', coalesce((stats->>'sent')::int, 0),
  'opened', coalesce((stats->>'opened')::int, 0),
  'clicked', coalesce((stats->>'clicked')::int, 0),
  'bounced', coalesce((stats->>'bounced')::int, 0),
  'failed', coalesce((stats->>'failed')::int, 0),
  'skipped', coalesce((stats->>'skipped')::int, 0),
  'unsubscribed', coalesce((stats->>'unsubscribed')::int, 0)
);

create table if not exists public.email_marketing_deliveries (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.email_marketing_campaigns(id) on delete cascade,
  subscriber_id uuid references public.email_marketing_subscribers(id) on delete set null,
  recipient_user_id uuid references public.profiles(id) on delete set null,
  recipient_email text not null,
  recipient_email_key text generated always as (lower(recipient_email)) stored,
  recipient_name text,
  status text not null default 'queued' check (status in ('queued', 'sending', 'sent', 'failed', 'skipped', 'cancelled')),
  delivery_token text not null default encode(gen_random_bytes(24), 'hex'),
  provider text,
  provider_message_id text,
  error_message text,
  attempts int not null default 0 check (attempts >= 0),
  queued_at timestamptz not null default now(),
  sending_at timestamptz,
  sent_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint email_marketing_deliveries_email_check check (position('@' in recipient_email) > 1)
);

create unique index if not exists email_marketing_deliveries_campaign_email_uidx
  on public.email_marketing_deliveries (campaign_id, recipient_email_key);

create unique index if not exists email_marketing_deliveries_token_uidx
  on public.email_marketing_deliveries (delivery_token);

create index if not exists email_marketing_deliveries_campaign_status_idx
  on public.email_marketing_deliveries (campaign_id, status);

create index if not exists email_marketing_deliveries_email_idx
  on public.email_marketing_deliveries (recipient_email_key);

drop trigger if exists email_marketing_deliveries_set_updated_at on public.email_marketing_deliveries;
create trigger email_marketing_deliveries_set_updated_at
  before update on public.email_marketing_deliveries
  for each row execute function public.handle_updated_at();

alter table public.email_marketing_events
  add column if not exists delivery_id uuid references public.email_marketing_deliveries(id) on delete set null;

create index if not exists email_marketing_events_delivery_idx
  on public.email_marketing_events(delivery_id, event_type);

alter table public.email_marketing_deliveries enable row level security;

drop policy if exists email_marketing_deliveries_super_admin on public.email_marketing_deliveries;
create policy email_marketing_deliveries_super_admin on public.email_marketing_deliveries
  for all to authenticated
  using ((select public.current_user_role()) = 'super_admin'::public.user_role)
  with check ((select public.current_user_role()) = 'super_admin'::public.user_role);

grant select, insert, update, delete on public.email_marketing_deliveries to authenticated;
revoke all on public.email_marketing_deliveries from anon;

insert into public.email_marketing_segments (key, name, description, role_filter, rules, active)
values (
  'leads-site-publico',
  'Leads do site publico',
  'Pessoas que chamaram a Seravie Campo pelo atendimento publico e deixaram email de contato.',
  '{}'::public.user_role[],
  jsonb_build_object('include_leads', true),
  true
)
on conflict (key) do update set
  name = excluded.name,
  description = excluded.description,
  role_filter = excluded.role_filter,
  rules = excluded.rules,
  active = excluded.active,
  updated_at = now();
