alter table public.profiles
  add column if not exists stripe_account_version text not null default 'legacy',
  add column if not exists stripe_dashboard_type text,
  add column if not exists stripe_transfers_status text,
  add column if not exists stripe_account_status text not null default 'not_started',
  add column if not exists stripe_requirements_due text[] not null default '{}'::text[],
  add column if not exists stripe_requirements_past_due text[] not null default '{}'::text[],
  add column if not exists stripe_last_status_sync_at timestamptz;

create index if not exists profiles_stripe_account_status_idx
  on public.profiles(stripe_account_status);

update public.profiles
set
  stripe_account_status = case
    when stripe_charges_enabled then 'active'
    when stripe_account_id is not null then 'pending'
    else 'not_started'
  end,
  stripe_transfers_status = case
    when stripe_charges_enabled then 'active'
    else stripe_transfers_status
  end,
  stripe_dashboard_type = case
    when stripe_account_id is not null and stripe_dashboard_type is null then 'express'
    else stripe_dashboard_type
  end
where stripe_account_status = 'not_started'
  or stripe_transfers_status is null
  or (stripe_account_id is not null and stripe_dashboard_type is null);
