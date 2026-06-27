create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  sender text not null check (sender in ('user','support')),
  body text not null,
  created_at timestamptz not null default now()
);
alter table public.support_messages enable row level security;

drop policy if exists support_select on public.support_messages;
create policy support_select on public.support_messages for select
  using (user_id = auth.uid() or current_user_role() = 'super_admin');

drop policy if exists support_insert on public.support_messages;
create policy support_insert on public.support_messages for insert
  with check (
    (sender = 'user' and user_id = auth.uid())
    or (sender = 'support' and current_user_role() = 'super_admin')
  );

create index if not exists support_user_idx on public.support_messages(user_id, created_at);
