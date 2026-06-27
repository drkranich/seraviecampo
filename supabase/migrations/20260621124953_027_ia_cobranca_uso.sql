alter table public.profiles add column if not exists ai_card_added boolean not null default false;

create table if not exists public.ai_usage (
  producer_id uuid not null references public.profiles(id) on delete cascade,
  period text not null,
  count int not null default 0,
  cost_cents int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (producer_id, period)
);
alter table public.ai_usage enable row level security;

drop policy if exists ai_usage_rw on public.ai_usage;
create policy ai_usage_rw on public.ai_usage for all
  using (producer_id = auth.uid() or current_user_role() = 'super_admin')
  with check (producer_id = auth.uid());
