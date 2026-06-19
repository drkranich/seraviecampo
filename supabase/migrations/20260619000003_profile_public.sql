-- =====================================================================
-- Seravie Campo — Perfil público do produtor
-- Campos de história/apresentação para a vitrine do cliente
-- ("o cliente compra a história").
-- =====================================================================

alter table public.profiles
  add column bio       text,   -- história / apresentação
  add column cover_url text,   -- imagem de capa do perfil
  add column farm_name text;   -- nome da fazenda/sítio

comment on column public.profiles.bio is 'História/apresentação pública do produtor.';
