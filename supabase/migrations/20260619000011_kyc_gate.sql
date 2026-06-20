-- =====================================================================
-- Seravie Campo — Trava de documento (KYC)
-- kyc_exempt: contas isentas da obrigatoriedade de documento
-- (as contas de teste existentes foram marcadas como isentas em produção).
-- =====================================================================
alter table public.profiles
  add column if not exists kyc_exempt boolean not null default false;
