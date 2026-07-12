create table if not exists public.public_support_threads (
  id uuid primary key default gen_random_uuid(),
  visitor_token_hash text not null,
  visitor_name text,
  visitor_email text,
  visitor_phone text,
  subject text,
  source_path text,
  status text not null default 'open' check (status in ('open', 'closed')),
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.public_support_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.public_support_threads(id) on delete cascade,
  sender text not null check (sender in ('visitor', 'support')),
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);

alter table public.public_support_threads enable row level security;
alter table public.public_support_messages enable row level security;

drop policy if exists public_support_threads_admin_select on public.public_support_threads;
create policy public_support_threads_admin_select
on public.public_support_threads
for select
to authenticated
using ((select public.current_user_role()) = 'super_admin'::public.user_role);

drop policy if exists public_support_threads_admin_update on public.public_support_threads;
create policy public_support_threads_admin_update
on public.public_support_threads
for update
to authenticated
using ((select public.current_user_role()) = 'super_admin'::public.user_role)
with check ((select public.current_user_role()) = 'super_admin'::public.user_role);

drop policy if exists public_support_messages_admin_select on public.public_support_messages;
create policy public_support_messages_admin_select
on public.public_support_messages
for select
to authenticated
using ((select public.current_user_role()) = 'super_admin'::public.user_role);

drop policy if exists public_support_messages_admin_insert on public.public_support_messages;
create policy public_support_messages_admin_insert
on public.public_support_messages
for insert
to authenticated
with check (
  sender = 'support'
  and (select public.current_user_role()) = 'super_admin'::public.user_role
);

create index if not exists public_support_threads_last_message_idx
  on public.public_support_threads(last_message_at desc);
create index if not exists public_support_threads_token_idx
  on public.public_support_threads(visitor_token_hash);
create index if not exists public_support_messages_thread_idx
  on public.public_support_messages(thread_id, created_at);

drop trigger if exists public_support_threads_set_updated_at on public.public_support_threads;
create trigger public_support_threads_set_updated_at
  before update on public.public_support_threads
  for each row execute function public.handle_updated_at();

create or replace function public.touch_public_support_thread()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  update public.public_support_threads
  set last_message_at = new.created_at,
      updated_at = now()
  where id = new.thread_id;
  return new;
end;
$$;

drop trigger if exists public_support_messages_touch_thread on public.public_support_messages;
create trigger public_support_messages_touch_thread
  after insert on public.public_support_messages
  for each row execute function public.touch_public_support_thread();
