alter table public.profiles
  add column if not exists country text not null default 'BR',
  add column if not exists currency text not null default 'BRL';
