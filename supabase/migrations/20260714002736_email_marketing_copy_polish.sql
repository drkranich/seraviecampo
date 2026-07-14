create or replace function pg_temp.seravie_email_copy_polish(value text)
returns text
language plpgsql
as $$
declare
  result text := coalesce(value, '');
begin
  result := replace(result, 'Voce', 'Você');
  result := replace(result, 'voce', 'você');
  result := replace(result, 'experiencias', 'experiências');
  result := replace(result, 'Experiencias', 'Experiências');
  result := replace(result, 'experiencia', 'experiência');
  result := replace(result, 'anfitrioes', 'anfitriões');
  result := replace(result, 'anfitriao', 'anfitrião');
  result := replace(result, 'Anfitriao', 'Anfitrião');
  result := replace(result, 'comeca', 'começa');
  result := replace(result, 'autenticas', 'autênticas');
  result := replace(result, 'autentica', 'autêntica');
  result := replace(result, 'regioes', 'regiões');
  result := replace(result, 'regiao', 'região');
  result := replace(result, 'degustacoes', 'degustações');
  result := replace(result, 'Degustacoes', 'Degustações');
  result := replace(result, 'vivencias', 'vivências');
  result := replace(result, 'Vivencias', 'Vivências');
  result := replace(result, 'vivencia', 'vivência');
  result := replace(result, 'confianca', 'confiança');
  result := replace(result, 'mantem', 'mantém');
  result := replace(result, 'presenca', 'presença');
  result := replace(result, 'tras', 'trás');
  result := replace(result, 'historia', 'história');
  result := replace(result, 'pratica', 'prática');
  result := replace(result, 'disponiveis', 'disponíveis');
  result := replace(result, 'visivel', 'visível');
  result := replace(result, 'familia', 'família');
  result := replace(result, 'metodo', 'método');
  result := replace(result, 'producao', 'produção');
  result := replace(result, 'Relacao', 'Relação');
  result := replace(result, 'recem-publicada', 'recém-publicada');
  result := replace(result, ' ja ', ' já ');
  result := replace(result, 'seguranca', 'segurança');
  result := replace(result, 'antecedencia', 'antecedência');
  result := replace(result, 'estacao', 'estação');
  result := replace(result, 'epoca', 'época');
  result := replace(result, 'cafes', 'cafés');
  result := replace(result, 'calendario', 'calendário');
  result := replace(result, 'selecao', 'seleção');
  result := replace(result, 'condicoes', 'condições');
  result := replace(result, 'condicao', 'condição');
  result := replace(result, 'territorio', 'território');
  result := replace(result, 'tambem', 'também');
  return result;
end;
$$;

update public.email_marketing_segments
set
  name = pg_temp.seravie_email_copy_polish(name),
  description = pg_temp.seravie_email_copy_polish(description),
  updated_at = now()
where key in ('parceiros-experiencias');

update public.email_marketing_templates
set
  name = pg_temp.seravie_email_copy_polish(name),
  description = pg_temp.seravie_email_copy_polish(description),
  subject = pg_temp.seravie_email_copy_polish(subject),
  preheader = pg_temp.seravie_email_copy_polish(preheader),
  hero_title = pg_temp.seravie_email_copy_polish(hero_title),
  hero_body = pg_temp.seravie_email_copy_polish(hero_body),
  cta_label = pg_temp.seravie_email_copy_polish(cta_label),
  blocks = pg_temp.seravie_email_copy_polish(blocks::text)::jsonb,
  footer_note = pg_temp.seravie_email_copy_polish(footer_note),
  html_content = '',
  plain_text = '',
  updated_at = now()
where is_system = true;

update public.email_marketing_templates
set
  description = 'Campanha de conversão para estimular nova compra ou reserva.',
  hero_title = 'Seu próximo encontro com o campo pode começar hoje',
  hero_body = 'Criamos uma condição especial para você voltar a descobrir produtores, destinos e experiências da Seravie Campo.',
  cta_label = 'Usar condição especial',
  blocks = jsonb_build_array(
    jsonb_build_object('title', 'Para comprar produtos', 'text', 'Use a campanha para cestas, cafés, queijos, geleias e produtos regionais selecionados.'),
    jsonb_build_object('title', 'Para reservar experiências', 'text', 'A oferta também pode levar o cliente para vivências, hospedagens e roteiros com anfitriões.'),
    jsonb_build_object('title', 'Para presentear', 'text', 'Transforme a campanha em convite para alguém descobrir a Seravie Campo.')
  ),
  footer_note = 'Condições promocionais podem ter prazo, limite de uso e regras específicas.',
  updated_at = now()
where slug = 'cupom-retorno';

update public.email_marketing_templates
set
  name = 'Reativação de clientes',
  description = 'Campanha para clientes sem compra ou reserva recente.',
  subject = 'Tem novidade no campo para você',
  preheader = 'Destinos, produtos e experiências foram atualizados na Seravie Campo.',
  hero_title = 'O campo mudou desde sua última visita',
  hero_body = 'Novos produtores, anfitriões e experiências entram na Seravie Campo para tornar a descoberta mais rica, regional e confiável.',
  blocks = jsonb_build_array(
    jsonb_build_object('title', 'Novos destinos', 'text', 'A plataforma mostra cidades e regiões conforme ofertas reais cadastradas por produtores e parceiros.'),
    jsonb_build_object('title', 'Novos sabores', 'text', 'Produtos regionais e alimentos frescos aparecem conforme disponibilidade de cada produtor.'),
    jsonb_build_object('title', 'Novas experiências', 'text', 'Vivências rurais, gastronômicas e culturais podem ser reservadas diretamente pela Seravie Campo.')
  ),
  footer_note = 'Você pode ajustar preferências e comunicações pela sua conta.',
  updated_at = now()
where slug = 'reativacao-clientes';

update public.email_marketing_templates
set
  name = 'Chamada para anfitriões e produtores',
  description = 'Campanha para atrair novos fornecedores alinhados à proposta da Seravie Campo.',
  subject = 'Anuncie sua experiência rural na Seravie Campo',
  preheader = 'Uma plataforma para produtores, anfitriões e destinos com identidade local.',
  hero_title = 'Seu território pode receber melhor',
  hero_body = 'A Seravie Campo foi criada para reunir hospedagens, experiências, produtos regionais e produtores que querem vender com mais organização, suporte e visibilidade.',
  blocks = jsonb_build_array(
    jsonb_build_object('title', 'Vitrine pública viva', 'text', 'Destinos e ofertas aparecem no site conforme cadastros reais, sem depender de curadoria manual em cada cidade.'),
    jsonb_build_object('title', 'Painel de gestão', 'text', 'Produtores e parceiros organizam produtos, experiências, reservas, pedidos e financeiro em um único lugar.'),
    jsonb_build_object('title', 'Pagamentos integrados', 'text', 'A Seravie Campo intermedia pagamentos e suporte para uma jornada mais confiável.')
  ),
  updated_at = now()
where slug = 'chamada-para-anfitrioes';
