import type { SupabaseClient } from "@supabase/supabase-js";

export type Perfil = { tag: string; nome: string; desc: string };
export type Step = { title: string; desc: string };
export type EcosystemItem = { label: string; title: string; text: string };
export type DestinationItem = { name: string; region: string; image: string; href?: string };
export type ExperienceTrack = { title: string; text: string; accent: string; href?: string };
export type GuideLink = { label: string; href: string };
export type TrustItem = { label: string; text: string };
export type FeaturedItem = { label: string; title: string; text: string; image: string; href?: string };
export type TestimonialItem = { quote: string; name: string; role: string };
export type FaqItem = { question: string; answer: string };

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
      href: "/experiencias",
    },
    {
      name: "Ouro Preto",
      region: "História, igrejas e cultura viva",
      image: "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=900&q=80",
      href: "/experiencias",
    },
    {
      name: "Capitólio",
      region: "Lagos, cachoeiras e passeios",
      image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80",
      href: "/experiencias",
    },
    {
      name: "Monte Verde",
      region: "Chalés, lareira e montanha",
      image: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=900&q=80",
      href: "/experiencias",
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

export async function getSite(supabase: SupabaseClient): Promise<SiteContent> {
  const { data } = await supabase.from("site_content").select("data").eq("id", 1).maybeSingle();
  const d = (data?.data ?? {}) as Partial<SiteContent>;

  return {
    ...DEFAULT_SITE,
    ...d,
    avisos: { ...DEFAULT_SITE.avisos, ...(d.avisos ?? {}) },
    perfis: withArray(d.perfis, DEFAULT_SITE.perfis),
    steps: withArray(d.steps, DEFAULT_SITE.steps),
    hero_teasers: withArray(d.hero_teasers, DEFAULT_SITE.hero_teasers),
    ecosystem: withArray(d.ecosystem, DEFAULT_SITE.ecosystem),
    destinations: withArray(d.destinations, DEFAULT_SITE.destinations),
    stay_types: withArray(d.stay_types, DEFAULT_SITE.stay_types),
    experience_tracks: withArray(d.experience_tracks, DEFAULT_SITE.experience_tracks),
    product_tags: withArray(d.product_tags, DEFAULT_SITE.product_tags),
    guide_links: withArray(d.guide_links, DEFAULT_SITE.guide_links),
    featured_items: withArray(d.featured_items, DEFAULT_SITE.featured_items),
    host_tools: withArray(d.host_tools, DEFAULT_SITE.host_tools),
    trust_items: withArray(d.trust_items, DEFAULT_SITE.trust_items),
    testimonials: withArray(d.testimonials, DEFAULT_SITE.testimonials),
    faq_items: withArray(d.faq_items, DEFAULT_SITE.faq_items),
  };
}
