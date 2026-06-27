create table if not exists public.site_content (
  id int primary key default 1,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint site_content_single check (id = 1)
);
insert into public.site_content (id, data) values (1, '{}'::jsonb) on conflict (id) do nothing;

alter table public.site_content enable row level security;

drop policy if exists site_content_read on public.site_content;
create policy site_content_read on public.site_content for select using (true);

drop policy if exists site_content_write on public.site_content;
create policy site_content_write on public.site_content for all
  using (current_user_role() = 'super_admin')
  with check (current_user_role() = 'super_admin');
