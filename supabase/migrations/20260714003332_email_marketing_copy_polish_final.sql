update public.email_marketing_templates
set
  blocks = jsonb_build_array(
    jsonb_build_object('title', 'Hospedagens com identidade', 'text', 'Pousadas, casas, fazendas e estadias que preservam a paisagem e a cultura local.'),
    jsonb_build_object('title', 'Experiências de verdade', 'text', 'Degustações, visitas guiadas, colheitas, oficinas e encontros conduzidos por quem conhece o território.'),
    jsonb_build_object('title', 'Produtos regionais', 'text', 'Cestas, queijos, cafés, geleias, hortas e pequenos lotes para completar a viagem ou receber em casa.')
  ),
  updated_at = now()
where slug = 'destino-em-destaque';

update public.email_marketing_templates
set
  subject = 'Uma nova experiência rural está esperando por você',
  preheader = 'Vivências, degustações e encontros com anfitriões locais.',
  hero_body = 'Experiências da Seravie Campo aproximam viajantes de anfitriões, cozinhas, paisagens, saberes e pequenos produtores. Uma nova vivência entrou na plataforma e já pode ser reservada.',
  blocks = jsonb_build_array(
    jsonb_build_object('title', 'Anfitrião local', 'text', 'Cada experiência nasce de quem conhece o território e sabe receber com autenticidade.'),
    jsonb_build_object('title', 'Agenda clara', 'text', 'Datas, capacidade, valores e detalhes ficam organizados para o cliente decidir com segurança.'),
    jsonb_build_object('title', 'Pagamento pela plataforma', 'text', 'A Seravie Campo centraliza a reserva, o pagamento e o suporte ao cliente.')
  ),
  updated_at = now()
where slug = 'experiencia-publicada';
