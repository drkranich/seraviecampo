alter table public.orders
  add column if not exists stripe_checkout_session_id text,
  add column if not exists stripe_payment_intent_id text,
  add column if not exists stripe_refund_id text,
  add column if not exists refunded_at timestamptz;

alter table public.experience_bookings
  add column if not exists stripe_checkout_session_id text,
  add column if not exists stripe_payment_intent_id text,
  add column if not exists stripe_refund_id text,
  add column if not exists refunded_at timestamptz;

alter table public.disputes
  add column if not exists stripe_dispute_id text,
  add column if not exists stripe_refund_id text,
  add column if not exists refund_amount_cents integer,
  add column if not exists stripe_status text,
  add column if not exists stripe_reason text,
  add column if not exists updated_at timestamptz not null default now();

drop trigger if exists disputes_set_updated_at on public.disputes;
create trigger disputes_set_updated_at
  before update on public.disputes
  for each row execute function public.handle_updated_at();

create index if not exists orders_stripe_payment_intent_idx
  on public.orders(stripe_payment_intent_id);
create index if not exists exp_bookings_stripe_payment_intent_idx
  on public.experience_bookings(stripe_payment_intent_id);
create index if not exists disputes_stripe_dispute_idx
  on public.disputes(stripe_dispute_id);
create index if not exists disputes_stripe_refund_idx
  on public.disputes(stripe_refund_id);

create table if not exists public.payment_refunds (
  id uuid primary key default gen_random_uuid(),
  dispute_id uuid references public.disputes(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  booking_id uuid references public.experience_bookings(id) on delete set null,
  stripe_refund_id text unique,
  stripe_payment_intent_id text,
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'BRL',
  status text not null default 'pending',
  reason text,
  failure_reason text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payment_refunds enable row level security;

revoke all on public.payment_refunds from anon;
revoke all on public.payment_refunds from authenticated;
grant select on public.payment_refunds to authenticated;
grant all on public.payment_refunds to service_role;

drop policy if exists payment_refunds_select on public.payment_refunds;
create policy payment_refunds_select
on public.payment_refunds
for select
to authenticated
using (
  (select public.current_user_role()) = 'super_admin'::public.user_role
  or created_by = (select auth.uid())
  or exists (
    select 1 from public.orders o
    where o.id = payment_refunds.order_id
      and (o.customer_id = (select auth.uid()) or o.producer_id = (select auth.uid()) or o.delivery_person_id = (select auth.uid()))
  )
  or exists (
    select 1 from public.experience_bookings b
    where b.id = payment_refunds.booking_id
      and (b.customer_id = (select auth.uid()) or b.producer_id = (select auth.uid()))
  )
);

drop trigger if exists payment_refunds_set_updated_at on public.payment_refunds;
create trigger payment_refunds_set_updated_at
  before update on public.payment_refunds
  for each row execute function public.handle_updated_at();

create index if not exists payment_refunds_order_idx
  on public.payment_refunds(order_id);
create index if not exists payment_refunds_booking_idx
  on public.payment_refunds(booking_id);
create index if not exists payment_refunds_status_idx
  on public.payment_refunds(status, updated_at desc);

create table if not exists public.payout_transfers (
  id uuid primary key default gen_random_uuid(),
  source_type text not null check (source_type in ('order', 'experience_booking')),
  source_id uuid not null,
  recipient_id uuid references public.profiles(id) on delete set null,
  destination_account_id text not null,
  stripe_transfer_id text unique,
  stripe_reversal_id text,
  kind text not null,
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'BRL',
  status text not null default 'created' check (status in ('created', 'failed', 'reversed')),
  error text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  reversed_at timestamptz
);

alter table public.payout_transfers enable row level security;

revoke all on public.payout_transfers from anon;
revoke all on public.payout_transfers from authenticated;
grant select on public.payout_transfers to authenticated;
grant all on public.payout_transfers to service_role;

drop policy if exists payout_transfers_select on public.payout_transfers;
create policy payout_transfers_select
on public.payout_transfers
for select
to authenticated
using (
  (select public.current_user_role()) = 'super_admin'::public.user_role
  or recipient_id = (select auth.uid())
);

create index if not exists payout_transfers_source_idx
  on public.payout_transfers(source_type, source_id);
create index if not exists payout_transfers_recipient_idx
  on public.payout_transfers(recipient_id, created_at desc);
create index if not exists payout_transfers_status_idx
  on public.payout_transfers(status, created_at desc);

create table if not exists public.stripe_disputes (
  id text primary key,
  charge_id text,
  stripe_payment_intent_id text,
  order_id uuid references public.orders(id) on delete set null,
  booking_id uuid references public.experience_bookings(id) on delete set null,
  amount_cents integer,
  currency text,
  status text,
  reason text,
  evidence_due_by timestamptz,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.stripe_disputes enable row level security;

revoke all on public.stripe_disputes from anon;
revoke all on public.stripe_disputes from authenticated;
grant select on public.stripe_disputes to authenticated;
grant all on public.stripe_disputes to service_role;

drop policy if exists stripe_disputes_admin_select on public.stripe_disputes;
create policy stripe_disputes_admin_select
on public.stripe_disputes
for select
to authenticated
using ((select public.current_user_role()) = 'super_admin'::public.user_role);

drop trigger if exists stripe_disputes_set_updated_at on public.stripe_disputes;
create trigger stripe_disputes_set_updated_at
  before update on public.stripe_disputes
  for each row execute function public.handle_updated_at();

create index if not exists stripe_disputes_payment_intent_idx
  on public.stripe_disputes(stripe_payment_intent_id);
create index if not exists stripe_disputes_status_idx
  on public.stripe_disputes(status, updated_at desc);
