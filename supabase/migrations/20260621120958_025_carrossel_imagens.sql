alter table public.products add column if not exists images text[] not null default '{}';
alter table public.posts add column if not exists images text[] not null default '{}';
