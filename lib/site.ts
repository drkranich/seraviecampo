import type { SupabaseClient } from "@supabase/supabase-js";

export type Perfil = { tag: string; nome: string; desc: string };
export type Step = { title: string; desc: string };

export type SiteContent = {
  brand: string;
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
};

export const DEFAULT_SITE: SiteContent = {
  brand: "Seravie Campo",
  hero_kicker: "Agro Gourmet",
  hero_title: "Seravie Campo",
  hero_subtitle: "O Sistema Operacional da Economia Local — conectando o campo e a cidade com produtos extraordinários, com logística justa e pagamentos transparentes.",
  hero_cta: "Criar conta",
  perfis: [
    { tag: "Clube Gourmet", nome: "Para você, cliente", desc: "Descubra produtores perto de você, monte sua cesta e acompanhe cada pedido — do campo à sua porta." },
    { tag: "Oferta", nome: "Para o produtor rural", desc: "Venda direto ao consumidor, conte a história dos seus produtos e receba com repasses automáticos." },
    { tag: "Logística", nome: "Para o entregador", desc: "Aceite entregas da sua região, faça rotas inteligentes e receba pelo frete a cada corrida." },
    { tag: "Super Admin", nome: "Seravie Hub", desc: "Gestão completa do ecossistema: aprovações, pagamentos, moderação e inteligência estratégica." },
  ],
  steps_title: "Como funciona",
  steps: [
    { title: "1. Descubra", desc: "O cliente encontra produtores locais e produtos com história, por proximidade." },
    { title: "2. Peça e pague", desc: "Pagamento seguro, frete calculado por distância e incluso no valor — sem surpresas." },
    { title: "3. Receba", desc: "O produtor despacha e o entregador leva até a porta, com comprovante de entrega." },
  ],
  cta_title: "Faça parte do ecossistema",
  cta_text: "Produtores, clientes e entregadores em uma só plataforma. Comece agora, é rápido.",
  avisos: { cliente: "", produtor: "", entregador: "" },
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
