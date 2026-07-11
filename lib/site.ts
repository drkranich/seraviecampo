import type { SupabaseClient } from "@supabase/supabase-js";

export type Perfil = { tag: string; nome: string; desc: string };
export type Step = { title: string; desc: string };
export type EcosystemItem = { label: string; title: string; text: string };
export type DestinationItem = {
  name: string;
  region: string;
  image: string;
  href?: string;
  slug?: string;
  intro?: string;
  description?: string;
  best_time?: string;
  travel_time?: string;
  highlights?: string;
  cta_label?: string;
  cta_href?: string;
};
export type ExperienceTrack = { title: string; text: string; accent: string; href?: string };
export type GuideLink = { label: string; href: string };
export type TrustItem = { label: string; text: string };
export type FeaturedItem = { label: string; title: string; text: string; image: string; href?: string };
export type TestimonialItem = { quote: string; name: string; role: string };
export type FaqItem = { question: string; answer: string };
export type InstitutionalPage = {
  slug: string;
  label: string;
  title: string;
  summary: string;
  body: string;
  image: string;
  cta_label?: string;
  cta_href?: string;
  seo_title?: string;
  seo_description?: string;
};

export type SiteContent = {
  brand: string;
  favicon_url: string;
  seo_title: string;
  seo_description: string;
  og_image_url: string;
  hero_image_url: string;
  hero_kicker: string;
  hero_title: string;
  hero_subtitle: string;
  hero_cta: string;
  hero_teasers: string[];
  ecosystem: EcosystemItem[];
  destinations_label: string;
  destinations_title: string;
  destinations_text: string;
  destinations: DestinationItem[];
  stay_label: string;
  stay_title: string;
  stay_text: string;
  stay_types: string[];
  home_experiences_label: string;
  home_experiences_title: string;
  home_experiences_text: string;
  experience_tracks: ExperienceTrack[];
  products_label: string;
  products_title: string;
  products_text: string;
  product_tags: string[];
  guides_label: string;
  guide_links: GuideLink[];
  featured_label: string;
  featured_title: string;
  featured_text: string;
  featured_items: FeaturedItem[];
  host_label: string;
  host_title: string;
  host_text: string;
  host_tools: string[];
  trust_title: string;
  trust_items: TrustItem[];
  testimonials_label: string;
  testimonials_title: string;
  testimonials: TestimonialItem[];
  faq_label: string;
  faq_title: string;
  faq_items: FaqItem[];
  institutional_pages: InstitutionalPage[];
  host_cta_label: string;
  host_cta_href: string;
  perfis: Perfil[];
  steps_title: string;
  steps: Step[];
  cta_title: string;
  cta_text: string;
  cta_primary_label: string;
  cta_primary_href: string;
  cta_secondary_label: string;
  cta_secondary_href: string;
  footer: string;
  avisos: { cliente: string; produtor: string; entregador: string };
  experiencias_enabled: boolean;
  experiencias_title: string;
  experiencias_subtitle: string;
};

export type SiteCmsState = {
  draft: SiteContent;
  published: SiteContent;
  hasDraftChanges: boolean;
  publishedAt: string | null;
  draftUpdatedAt: string | null;
};

export type SiteContentEnvelope = {
  published?: Partial<SiteContent>;
  draft?: Partial<SiteContent>;
  published_at?: string | null;
  draft_updated_at?: string | null;
};

const heroImage =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2200&q=85";

export const DEFAULT_SITE: SiteContent = {
  brand: "Seravie Campo",
  favicon_url: "",
  seo_title: "Seravie Campo - Turismo rural, experiências e produtos locais",
  seo_description: "Reserve experiências no campo, descubra destinos rurais e compre produtos regionais diretamente de anfitriões, produtores e parceiros locais.",
  og_image_url: heroImage,
  hero_image_url: heroImage,
  hero_kicker: "Turismo rural e economia local",
  hero_title: "Seravie Campo",
  hero_subtitle: "Um portal de turismo rural, cultura, gastronomia, produtos regionais e experiências no campo.",
  hero_cta: "Começar",
  hero_teasers: [
    "Hospedagens rurais, pousadas, cabanas e fazendas.",
    "Experiências com produtores, guias e comunidades.",
    "Produtos frescos, rotas sazonais e eventos locais.",
  ],
  ecosystem: [
    {
      label: "Hospede-se",
      title: "Estadas com identidade local",
      text: "Chalés, pousadas, fazendas, cabanas e sítios entram no mesmo mapa de experiências e produtos regionais.",
    },
    {
      label: "Viva",
      title: "Roteiros que acontecem no campo",
      text: "Cada destino pode reunir gastronomia, cultura, natureza, bem-estar e atividades rurais reserváveis.",
    },
    {
      label: "Compre",
      title: "Produtos de quem recebe você",
      text: "Cestas frescas, café, queijo, doces, artesanato e assinaturas regionais conectam visita e recorrência.",
    },
    {
      label: "Planeje",
      title: "Guias, eventos e serviços extras",
      text: "Clima, calendário, restaurantes, atrativos, transfer, chef, flores, fotos e guias locais em um só lugar.",
    },
  ],
  destinations_label: "Mapa de destinos",
  destinations_title: "Cidades que viram roteiro, não só resultado de busca.",
  destinations_text: "Cada destino pode reunir onde ficar, o que fazer, restaurantes, atrativos, clima, eventos, mapa e história local.",
  destinations: [
    {
      name: "Lavras Novas",
      region: "Serra, gastronomia e casarios",
      image: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80",
      href: "/destinos/lavras-novas",
      slug: "lavras-novas",
      intro: "Um distrito de serra para caminhar sem pressa, comer bem e dormir perto da natureza.",
      description: "Lavras Novas entra na Seravie Campo como um destino de fim de semana para pousadas, chalés, trilhas, gastronomia mineira e experiências com anfitriões locais.",
      best_time: "Outono, inverno e feriados prolongados",
      travel_time: "Roteiros de 2 a 4 dias",
      highlights: "Chalés com lareira\nTrilhas e mirantes\nGastronomia mineira\nExperiências guiadas",
      cta_label: "Ver experiências em Lavras Novas",
      cta_href: "/experiencias",
    },
    {
      name: "Ouro Preto",
      region: "História, igrejas e cultura viva",
      image: "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=900&q=80",
      href: "/destinos/ouro-preto",
      slug: "ouro-preto",
      intro: "Patrimônio, arte, comida regional e rotas rurais em volta de uma cidade histórica.",
      description: "Ouro Preto combina hospedagem histórica, restaurantes, visitas culturais, distritos rurais e experiências que conectam memória, território e produção local.",
      best_time: "Ano todo, com destaque para inverno e festivais",
      travel_time: "Roteiros de 2 a 5 dias",
      highlights: "Centro histórico\nDistritos e ateliês\nCafés e cozinha mineira\nGuias culturais",
      cta_label: "Planejar roteiro em Ouro Preto",
      cta_href: "/experiencias",
    },
    {
      name: "Capitólio",
      region: "Lagos, cachoeiras e passeios",
      image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80",
      href: "/destinos/capitolio",
      slug: "capitolio",
      intro: "Água, cânions, mirantes e hospedagens para quem busca natureza com estrutura.",
      description: "Capitólio aparece como destino de aventura leve, passeios de barco, cachoeiras, mirantes e produtos regionais para continuar a viagem depois da volta.",
      best_time: "Primavera, verão e meses de céu aberto",
      travel_time: "Roteiros de 3 a 5 dias",
      highlights: "Passeios de barco\nCachoeiras\nMirantes\nProdutos regionais",
      cta_label: "Explorar Capitólio",
      cta_href: "/experiencias",
    },
    {
      name: "Monte Verde",
      region: "Chalés, lareira e montanha",
      image: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=900&q=80",
      href: "/destinos/monte-verde",
      slug: "monte-verde",
      intro: "Montanha, frio, boa mesa e experiências para casais, famílias e pequenos grupos.",
      description: "Monte Verde reforça a vocação da Seravie Campo para estadias com curadoria, experiências de bem-estar, gastronomia, trilhas e pequenos produtores.",
      best_time: "Inverno, outono e escapadas românticas",
      travel_time: "Roteiros de 2 a 4 dias",
      highlights: "Chalés e pousadas\nCozinha de montanha\nTrilhas leves\nBem-estar rural",
      cta_label: "Descobrir Monte Verde",
      cta_href: "/experiencias",
    },
  ],
  stay_label: "Hospedagens e categorias",
  stay_title: "Do chalé romântico ao rancho produtivo.",
  stay_text: "A home agora prepara a Seravie Campo para crescer como portal de estadas, experiências, atrativos e economia local, sem abandonar o produtor rural.",
  stay_types: [
    "Chalés",
    "Fazendas",
    "Cabanas",
    "Glamping",
    "Pousadas",
    "Vinícolas",
    "Sítios",
    "Casas históricas",
    "Refúgios",
    "Tiny houses",
    "Ranchos",
    "Casas na montanha",
  ],
  home_experiences_label: "Experiências populares",
  home_experiences_title: "O campo como agenda, não como pano de fundo.",
  home_experiences_text: "Gastronomia, natureza, cultura, bem-estar e ruralidade entram como produtos reserváveis, com anfitriões e produtores no centro da narrativa.",
  experience_tracks: [
    {
      title: "Gastronomia",
      text: "Café especial, queijo artesanal, vinho, cerveja local, almoço na fazenda e fogão a lenha.",
      accent: "border-[#C2A878] text-[#D4BD8C]",
      href: "/experiencias",
    },
    {
      title: "Natureza",
      text: "Trilhas, cachoeiras, cavalgadas, observação de aves, fotografia e camping guiado.",
      accent: "border-[#7CA049] text-[#A9C875]",
      href: "/experiencias",
    },
    {
      title: "Cultura",
      text: "Tours históricos, festas tradicionais, oficinas, artesanato e vivências de comunidade.",
      accent: "border-[#B66E4B] text-[#E0A077]",
      href: "/experiencias",
    },
    {
      title: "Bem-estar",
      text: "Yoga, meditação, banho de floresta, massagem, spa rural e terapias naturais.",
      accent: "border-[#6D8EA0] text-[#A8C7D3]",
      href: "/experiencias",
    },
    {
      title: "Rural",
      text: "Ordenha, colheita, apicultura, horta orgânica, pão artesanal e dias de fazendeiro.",
      accent: "border-[#9A9A66] text-[#D3D19B]",
      href: "/experiencias",
    },
  ],
  products_label: "Produtos e assinaturas regionais",
  products_title: "A viagem continua na mesa de casa.",
  products_text: "Cestas de alimentos frescos, produtos artesanais, cafés, queijos, doces, artesanato e assinaturas regionais conectam turismo, recorrência e renda local.",
  product_tags: ["Cestas frescas", "Rotas do café", "Rotas do queijo", "Colhe e pague", "Artesãos locais", "Festas tradicionais"],
  guides_label: "Portal público completo",
  guide_links: [
    { label: "Melhor época para viajar", href: "/signup" },
    { label: "Como chegar e circular", href: "/signup" },
    { label: "Trilhas, cachoeiras e mirantes", href: "/signup" },
    { label: "Restaurantes e comida regional", href: "/signup" },
    { label: "Viagem com crianças e pets", href: "/signup" },
    { label: "Segurança, cancelamento e reembolso", href: "/signup" },
  ],
  featured_label: "Vitrines editáveis",
  featured_title: "O CMS transforma a home em uma curadoria viva.",
  featured_text: "Destaques de destinos, campanhas, épocas do ano e parceiros podem mudar sem mexer no código.",
  featured_items: [
    {
      label: "Temporada",
      title: "Fim de semana no campo",
      text: "Pacotes com hospedagem, comida regional e experiências guiadas para casais, famílias e grupos.",
      image: "https://images.unsplash.com/photo-1499696010180-025ef6e1a8f9?auto=format&fit=crop&w=900&q=80",
      href: "/experiencias",
    },
    {
      label: "Produto local",
      title: "Cestas da colheita",
      text: "Produtos frescos e artesanais conectados à viagem, à assinatura recorrente e ao produtor.",
      image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80",
      href: "/signup",
    },
    {
      label: "Experiência",
      title: "Vivências com anfitriões",
      text: "Café especial, queijo artesanal, trilhas, oficinas e cultura regional com agenda reservável.",
      image: "https://images.unsplash.com/photo-1528712306091-ed0763094c98?auto=format&fit=crop&w=900&q=80",
      href: "/experiencias",
    },
  ],
  host_label: "Área do anfitrião",
  host_title: "Produtores, pousadas, guias e restaurantes entram pela mesma porta.",
  host_text: "A página pública agora apresenta a Seravie Campo como uma infraestrutura regional: o visitante reserva, compra e planeja; o anfitrião publica, recebe e acompanha.",
  host_tools: ["Como anunciar", "Quanto ganhar", "Comissão clara", "Central do anfitrião", "Seguro e regras", "Ferramentas de gestão"],
  trust_title: "Confiança antes da reserva",
  trust_items: [
    { label: "Pagamentos e cancelamentos:", text: "políticas claras para reserva, reembolso e assinatura." },
    { label: "Avaliações e segurança:", text: "reputação, suporte, denúncias e comprovantes em um fluxo único." },
    { label: "Comunidade local:", text: "turismo, cultura e produção regional aparecem juntos, sem virar catálogo anônimo." },
  ],
  testimonials_label: "Sinais de confiança",
  testimonials_title: "Uma plataforma feita para quem visita e para quem recebe.",
  testimonials: [
    { quote: "A página mostra o destino inteiro, não apenas um anúncio isolado.", name: "Anfitriã rural", role: "Hospedagem e experiências" },
    { quote: "Consigo vender a vivência, os produtos e a relação com o visitante no mesmo lugar.", name: "Produtor local", role: "Produtos regionais" },
    { quote: "A jornada fica clara: descubro, reservo, compro e volto a acompanhar a região.", name: "Cliente viajante", role: "Turismo de proximidade" },
  ],
  faq_label: "Dúvidas frequentes",
  faq_title: "Antes de reservar ou anunciar",
  faq_items: [
    { question: "A Seravie Campo é uma hospedagem?", answer: "Não. A plataforma conecta visitantes, anfitriões, produtores, parceiros e entregadores dentro de uma experiência regional." },
    { question: "Quem pode anunciar?", answer: "Produtores rurais, pousadas, guias, restaurantes, artesãos, operadores locais e parceiros de experiências podem entrar pelo cadastro." },
    { question: "A página pública pode mudar sem código?", answer: "Sim. O super admin edita textos, imagens, vitrines, FAQ, depoimentos e CTAs pelo CMS." },
  ],
  institutional_pages: [
    {
      slug: "sobre",
      label: "Institucional",
      title: "Sobre a Seravie Campo",
      summary: "Uma plataforma para aproximar viajantes, produtores, anfitrioes e experiencias rurais em uma economia local mais organizada.",
      body: "A Seravie Campo nasce para transformar destinos rurais em ecossistemas vivos. A plataforma reune hospedagens, experiencias, produtos regionais, guias locais, entregas e conteudo publico em uma jornada unica.\n\nA proposta e dar mais autonomia para quem recebe e mais clareza para quem visita. O produtor, a pousada, o guia, o restaurante e o parceiro local passam a operar dentro de uma estrutura digital pensada para territorio, confianca e recorrencia.\n\nO visitante descobre destinos, planeja experiencias, compra produtos e acompanha a regiao mesmo depois da viagem. A comunidade local ganha ferramentas para publicar, vender, receber, organizar pedidos e construir reputacao.",
      image: heroImage,
      cta_label: "Criar conta",
      cta_href: "/signup",
      seo_title: "Sobre a Seravie Campo",
      seo_description: "Conheca a plataforma Seravie Campo para turismo rural, experiencias e economia local.",
    },
    {
      slug: "ajuda",
      label: "Ajuda",
      title: "Ajuda e suporte",
      summary: "Orientacoes para visitantes, produtores, anfitrioes, parceiros e entregadores usarem a plataforma com mais seguranca.",
      body: "Para visitantes, a Seravie Campo organiza descoberta, reserva, compra e acompanhamento em uma unica conta. Use as paginas publicas para conhecer destinos e entre para acessar pedidos, reservas, suporte e pagamentos.\n\nPara produtores e anfitrioes, o painel interno permite gerenciar perfil, produtos, experiencias, pedidos, reservas, financeiro e comunicacao com clientes. O super admin acompanha aprovacoes, moderacao, pagamentos e conteudo publico.\n\nEm caso de duvida, acesse sua area interna e abra o suporte. Quando houver uma compra, reserva ou entrega em andamento, mantenha as conversas e comprovantes dentro da plataforma.",
      image: "https://images.unsplash.com/photo-1528712306091-ed0763094c98?auto=format&fit=crop&w=1600&q=80",
      cta_label: "Entrar na conta",
      cta_href: "/login",
      seo_title: "Ajuda e suporte | Seravie Campo",
      seo_description: "Ajuda para usar a Seravie Campo como cliente, produtor, parceiro ou entregador.",
    },
    {
      slug: "termos",
      label: "Termos",
      title: "Termos de uso",
      summary: "Regras gerais para uso da plataforma, cadastro, publicacao de ofertas, pagamentos, reservas e comunicacao entre as partes.",
      body: "A Seravie Campo atua como plataforma de conexao entre usuarios, produtores, anfitrioes, parceiros e entregadores. Cada participante e responsavel pelas informacoes publicadas, pela qualidade do servico ofertado e pelo cumprimento das regras aplicaveis.\n\nAo usar a plataforma, o usuario concorda em manter dados verdadeiros, respeitar politicas de seguranca, nao publicar conteudo enganoso e cumprir combinados de pedido, reserva, entrega ou experiencia.\n\nPagamentos, cancelamentos, reembolsos, disputas e verificacoes podem seguir regras especificas exibidas nos fluxos internos. A plataforma pode moderar, suspender ou remover cadastros e conteudos que violem estes termos ou coloquem a comunidade em risco.",
      image: "https://images.unsplash.com/photo-1499696010180-025ef6e1a8f9?auto=format&fit=crop&w=1600&q=80",
      cta_label: "Falar com suporte",
      cta_href: "/login",
      seo_title: "Termos de uso | Seravie Campo",
      seo_description: "Termos gerais de uso da plataforma Seravie Campo.",
    },
    {
      slug: "privacidade",
      label: "Privacidade",
      title: "Privacidade e LGPD",
      summary: "Como a Seravie Campo trata dados pessoais para operar contas, pedidos, reservas, pagamentos, seguranca e suporte.",
      body: "A Seravie Campo coleta dados necessarios para cadastro, autenticacao, verificacao, pagamentos, pedidos, reservas, suporte e melhoria da experiencia. Isso pode incluir dados de contato, perfil, documentos, historico de uso, mensagens e comprovantes.\n\nOs dados sao usados para operar a plataforma, proteger usuarios, prevenir fraude, cumprir obrigacoes legais e permitir que clientes, produtores, parceiros e entregadores executem suas atividades com mais confianca.\n\nO usuario pode solicitar informacoes sobre seus dados e atualizacoes cadastrais pelos canais de suporte. Dados sensiveis e documentos devem ser tratados apenas pelos fluxos oficiais da plataforma.",
      image: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1600&q=80",
      cta_label: "Acessar suporte",
      cta_href: "/login",
      seo_title: "Privacidade e LGPD | Seravie Campo",
      seo_description: "Politica publica de privacidade e tratamento de dados da Seravie Campo.",
    },
  ],
  host_cta_label: "Anunciar na Seravie",
  host_cta_href: "/signup",
  perfis: [
    { tag: "Viajante", nome: "Para quem visita", desc: "Descubra destinos, experiências, produtos locais e roteiros rurais em uma só jornada." },
    { tag: "Anfitrião", nome: "Para quem recebe", desc: "Publique hospedagens, vivências, eventos e serviços com presença dentro do ecossistema regional." },
    { tag: "Produtor", nome: "Para quem produz", desc: "Venda cestas, cafés, queijos, doces, artesanato e assinaturas diretamente ao público certo." },
    { tag: "Seravie Hub", nome: "Para operar a rede", desc: "Gestão de aprovações, pagamentos, moderação, suporte, conteúdo e inteligência local." },
  ],
  steps_title: "Como a rede se conecta",
  steps: [
    { title: "Planeje", desc: "O visitante encontra destinos, hospedagens, restaurantes, atrativos, guias e eventos." },
    { title: "Reserve", desc: "Experiências, produtos e serviços extras entram no mesmo fluxo de confiança." },
    { title: "Volte", desc: "Assinaturas regionais e produtos artesanais mantêm a relação viva depois da viagem." },
  ],
  cta_title: "Faça parte do ecossistema",
  cta_text: "Viajantes, anfitriões, produtores, guias, restaurantes e entregadores em uma só plataforma.",
  cta_primary_label: "Criar conta",
  cta_primary_href: "/signup",
  cta_secondary_label: "Explorar experiências",
  cta_secondary_href: "/experiencias",
  avisos: { cliente: "", produtor: "", entregador: "" },
  experiencias_enabled: true,
  experiencias_title: "Experiências no campo",
  experiencias_subtitle: "Vivências, gastronomia rural, rotas culturais e turismo de produção com quem conhece o território.",
  footer: "© Seravie Campo - Sistema Operacional da Economia Local. A plataforma conecta usuários e não se responsabiliza por produção, transporte ou pagamento entre as partes.",
};

function withArray<T>(value: T[] | undefined, fallback: T[]) {
  return Array.isArray(value) ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeDestinations(value: DestinationItem[] | undefined) {
  return withArray(value, DEFAULT_SITE.destinations).map((destination) => {
    const fallback = DEFAULT_SITE.destinations.find((item) => item.name === destination.name);
    const slug = destination.slug || fallback?.slug || slugify(destination.name);

    return {
      ...fallback,
      ...destination,
      slug,
    };
  });
}

export function destinationHref(destination: DestinationItem) {
  if (destination.href && destination.href !== "/experiencias") return destination.href;
  return `/destinos/${destination.slug || slugify(destination.name)}`;
}

export function destinationHighlights(destination: DestinationItem) {
  return String(destination.highlights || "")
    .split(/\r?\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function isEnvelope(data: Record<string, unknown>) {
  return isRecord(data.published) || isRecord(data.draft);
}

function envelopeFrom(raw: unknown): SiteContentEnvelope {
  if (!isRecord(raw)) return {};
  if (isEnvelope(raw)) return raw as SiteContentEnvelope;
  return {
    published: raw as Partial<SiteContent>,
    draft: raw as Partial<SiteContent>,
    published_at: null,
    draft_updated_at: null,
  };
}

function normalizeSiteContent(value: Partial<SiteContent> | undefined): SiteContent {
  const d = value ?? {};

  return {
    ...DEFAULT_SITE,
    ...d,
    avisos: { ...DEFAULT_SITE.avisos, ...(d.avisos ?? {}) },
    perfis: withArray(d.perfis, DEFAULT_SITE.perfis),
    steps: withArray(d.steps, DEFAULT_SITE.steps),
    hero_teasers: withArray(d.hero_teasers, DEFAULT_SITE.hero_teasers),
    ecosystem: withArray(d.ecosystem, DEFAULT_SITE.ecosystem),
    destinations: normalizeDestinations(d.destinations),
    stay_types: withArray(d.stay_types, DEFAULT_SITE.stay_types),
    experience_tracks: withArray(d.experience_tracks, DEFAULT_SITE.experience_tracks),
    product_tags: withArray(d.product_tags, DEFAULT_SITE.product_tags),
    guide_links: withArray(d.guide_links, DEFAULT_SITE.guide_links),
    featured_items: withArray(d.featured_items, DEFAULT_SITE.featured_items),
    host_tools: withArray(d.host_tools, DEFAULT_SITE.host_tools),
    trust_items: withArray(d.trust_items, DEFAULT_SITE.trust_items),
    testimonials: withArray(d.testimonials, DEFAULT_SITE.testimonials),
    faq_items: withArray(d.faq_items, DEFAULT_SITE.faq_items),
    institutional_pages: withArray(d.institutional_pages, DEFAULT_SITE.institutional_pages).map((page) => ({
      ...page,
      slug: page.slug || slugify(page.title),
    })),
  };
}

function sameContent(a: SiteContent, b: SiteContent) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export async function getSite(supabase: SupabaseClient): Promise<SiteContent> {
  const { data } = await supabase.from("site_content").select("data").eq("id", 1).maybeSingle();
  const envelope = envelopeFrom(data?.data);
  return normalizeSiteContent(envelope.published ?? (data?.data as Partial<SiteContent> | undefined));
}

export async function getSiteCmsState(supabase: SupabaseClient): Promise<SiteCmsState> {
  const { data } = await supabase.from("site_content").select("data").eq("id", 1).maybeSingle();
  const envelope = envelopeFrom(data?.data);
  const published = normalizeSiteContent(envelope.published);
  const draft = normalizeSiteContent(envelope.draft ?? envelope.published);

  return {
    draft,
    published,
    hasDraftChanges: !sameContent(draft, published),
    publishedAt: envelope.published_at ?? null,
    draftUpdatedAt: envelope.draft_updated_at ?? null,
  };
}

export function findDestination(site: SiteContent, slug: string) {
  return site.destinations.find((destination) => (destination.slug || slugify(destination.name)) === slug);
}

export function findInstitutionalPage(site: SiteContent, slug: string) {
  return site.institutional_pages.find((page) => (page.slug || slugify(page.title)) === slug);
}
