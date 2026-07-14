update public.email_marketing_templates
set
  subject = replace(subject, 'condicao', 'condição'),
  preheader = replace(preheader, 'condicao', 'condição'),
  hero_title = replace(hero_title, 'condicao', 'condição'),
  hero_body = replace(hero_body, 'condicao', 'condição'),
  cta_label = replace(cta_label, 'condicao', 'condição'),
  footer_note = replace(replace(footer_note, 'condicao', 'condição'), 'autentica', 'autêntica'),
  blocks = replace(replace(blocks::text, 'condicao', 'condição'), 'autentica', 'autêntica')::jsonb,
  updated_at = now()
where is_system = true;
