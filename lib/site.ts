import type { SupabaseClient } from "@supabase/supabase-js";

export type Perfil = { tag: string; nome: string; desc: string };
export type Step = { title: string; desc: string };

export type SiteContent = {
  brand: string;
  favicon_url: string;
  hero_kicker: string;
  hero_title: string;
  hero_subtitle: string;
  hero_cta: string;
  perfis: Perfil[];
  steps_title: string;
  steps: Step[];
  cta_title: string;
  cta_text: string;
  footer: string;
  avisos: { cliente: string; produtor: string; entregador: string };
  experiencias_enabled: boolean;
  experiencias_title: string;
  experiencias_subtitle: string;
};

export const DEFAULT_SITE: SiteContent = {
  brand: "Seravie Campo",
  favicon_url: "",
  hero_kicker: "Turismo rural e economia local",
  hero_title: "Seravie Campo",
  hero_subtitle: "Um portal de turismo rural, cultura, gastronomia, produtos regionais e experiências no campo.",
  hero_cta: "Começar",
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
  avisos: { cliente: "", produtor: "", entregador: "" },
  experiencias_enabled: true,
  experiencias_title: "Experiências no campo",
  experiencias_subtitle: "Vivências, gastronomia rural, rotas culturais e turismo de produção com quem conhece o território.",
  footer: "© Seravie Campo — Sistema Operacional da Economia Local. A plataforma conecta usuários e não se responsabiliza por produção, transporte ou pagamento entre as partes.",
};

export async function getSite(supabase: SupabaseClient): Promise<SiteContent> {
  const { data } = await supabase.from("site_content").select("data").eq("id", 1).maybeSingle();
  const d = (data?.data ?? {}) as Partial<SiteContent>;
  return {
    ...DEFAULT_SITE,
    ...d,
    avisos: { ...DEFAULT_SITE.avisos, ...(d.avisos ?? {}) },
    perfis: Array.isArray(d.perfis) && d.perfis.length ? d.perfis : DEFAULT_SITE.perfis,
    steps: Array.isArray(d.steps) && d.steps.length ? d.steps : DEFAULT_SITE.steps,
  };
}
