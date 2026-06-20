-- =====================================================================
-- Seravie Campo — Dados do entregador (veículo)
-- =====================================================================
alter table public.profiles
  add column if not exists vehicle_type text,
  add column if not exists vehicle_plate text;
