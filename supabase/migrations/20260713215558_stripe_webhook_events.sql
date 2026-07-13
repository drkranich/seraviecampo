create table if not exists public.stripe_webhook_events (
  id text primary key,
  type text not null,
  object_id text,
  livemode boolean,
  status text not null default 'processing'
    check (status in ('processing', 'processed', 'failed')),
  error text,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.stripe_webhook_events enable row level security;

revoke all on public.stripe_webhook_events from anon;
revoke insert, update, delete, truncate, references, trigger on public.stripe_webhook_events from authenticated;
grant select on public.stripe_webhook_events to authenticated;
grant all on public.stripe_webhook_events to service_role;

drop policy if exists stripe_webhook_events_admin_select on public.stripe_webhook_events;
create policy stripe_webhook_events_admin_select
on public.stripe_webhook_events
for select
to authenticated
using ((select public.current_user_role()) = 'super_admin'::public.user_role);

create index if not exists stripe_webhook_events_created_idx
  on public.stripe_webhook_events(created_at desc);

create index if not exists stripe_webhook_events_status_idx
  on public.stripe_webhook_events(status, updated_at desc);

drop trigger if exists stripe_webhook_events_set_updated_at on public.stripe_webhook_events;
create trigger stripe_webhook_events_set_updated_at
  before update on public.stripe_webhook_events
  for each row execute function public.handle_updated_at();
