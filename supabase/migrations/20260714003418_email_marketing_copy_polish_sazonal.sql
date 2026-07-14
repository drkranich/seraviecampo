update public.email_marketing_templates
set
  hero_title = 'O melhor da estação, direto do território',
  hero_body = 'Quando a safra muda, a viagem também muda. A Seravie Campo organiza produtos, roteiros e experiências que acompanham o tempo da terra.',
  blocks = jsonb_build_array(
    jsonb_build_object('title', 'Produtos da época', 'text', 'Destaque alimentos, cestas e pequenos lotes com maior frescor e disponibilidade.'),
    jsonb_build_object('title', 'Vivências sazonais', 'text', 'Colheitas, degustações, piqueniques, cafés, queijarias e roteiros que dependem do calendário local.'),
    jsonb_build_object('title', 'Curadoria Seravie', 'text', 'A seleção prioriza ofertas alinhadas ao campo, à cultura regional e à experiência do visitante.')
  ),
  updated_at = now()
where slug = 'campanha-sazonal-colheita';
