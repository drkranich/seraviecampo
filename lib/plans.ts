export type PlanId = "campo" | "gourmet" | "premium";

export type Plan = {
  id: string;
  name: string;
  price_cents: number;
  tagline: string;
  features: string[];
  priceEnv?: string; // env var com o price_xxx do Stripe
  commissionPct?: number; // comissão da plataforma sobre vendas (planos do produtor)
};

export const PLANS: Plan[] = [
  {
    id: "campo",
    name: "Campo",
    price_cents: 1990,
    tagline: "Para começar a vender",
    commissionPct: 12,
    features: ["Até 15 produtos", "Pedidos e cesta", "Perfil público", "Comissão de 12% por venda", "Suporte por e-mail"],
    priceEnv: "STRIPE_PRICE_CAMPO",
  },
  {
    id: "gourmet",
    name: "Gourmet",
    price_cents: 4900,
    tagline: "Para crescer com constância",
    commissionPct: 8,
    features: ["Produtos ilimitados", "Assinaturas de cesta", "Insights de vendas", "Selo verificado", "Comissão de 8% por venda", "Suporte prioritário"],
    priceEnv: "STRIPE_PRICE_GOURMET",
  },
  {
    id: "premium",
    name: "Premium",
    price_cents: 9900,
    tagline: "Operação gourmet completa",
    commissionPct: 5,
    features: ["Tudo do Gourmet", "IA Rural", "Turismo + Agro", "Comissão de 5% por venda", "Marketing avançado", "Gerente de conta"],
    priceEnv: "STRIPE_PRICE_PREMIUM",
  },
];


// ---------- Planos do Cliente (Clube Gourmet) ----------
export const CLIENTE_PLANS: Plan[] = [
  {
    id: "cli_livre",
    name: "Avulso (Degustação)",
    price_cents: 0,
    tagline: "Experimente por 15 dias",
    features: ["Degustação de 15 dias", "Até 5 compras de teste", "Acesso à vitrine completa", "Depois, escolha um plano pago"],
  },
  {
    id: "cli_sabor",
    name: "Clube Sabor",
    price_cents: 1990,
    tagline: "Para quem compra sempre",
    features: ["Frete reduzido", "Novidades antecipadas", "5% de desconto", "Cesta surpresa trimestral"],
    priceEnv: "STRIPE_PRICE_CLI_SABOR",
  },
  {
    id: "cli_gourmet",
    name: "Clube Gourmet",
    price_cents: 3990,
    tagline: "A experiência completa",
    features: ["Maior desconto no frete", "10% de desconto", "Cesta surpresa mensal", "Acesso a produtores premium", "Prioridade em reservas de colheita"],
    priceEnv: "STRIPE_PRICE_CLI_GOURMET",
  },
];

// ---------- Planos do Entregador ----------
export const ENTREGADOR_PLANS: Plan[] = [
  {
    id: "ent_base",
    name: "Parceiro",
    price_cents: 0,
    tagline: "Comece a entregar",
    features: ["Aceitar entregas", "Ganhos por entrega", "Histórico de corridas"],
  },
  {
    id: "ent_pro",
    name: "Entregador Pro",
    price_cents: 2990,
    tagline: "Mais entregas, mais ganhos",
    features: ["Prioridade nas entregas da região", "Selo Pro no perfil", "Suporte prioritário", "Relatório de ganhos"],
    priceEnv: "STRIPE_PRICE_ENT_PRO",
  },
  {
    id: "ent_premium",
    name: "Entregador Premium",
    price_cents: 5990,
    tagline: "Operação no máximo",
    features: ["Tudo do Pro", "Rotas exclusivas", "Antecipação de ganhos", "Gerente de conta"],
    priceEnv: "STRIPE_PRICE_ENT_PREMIUM",
  },
];

export const ALL_PLANS: Plan[] = [...PLANS, ...CLIENTE_PLANS, ...ENTREGADOR_PLANS];

export function getPlan(id: string): Plan | undefined {
  return ALL_PLANS.find((p) => p.id === id);
}

// Plano padrão do produtor quando não há assinatura ativa
export const DEFAULT_PRODUCER_PLAN = "campo";

export function producerCommissionPct(planId?: string | null): number {
  const p = PLANS.find((x) => x.id === (planId || DEFAULT_PRODUCER_PLAN));
  return p?.commissionPct ?? 12;
}

export function formatPlanPrice(cents: number): string {
  if (cents === 0) return "Grátis";
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Área de assinatura conforme o tipo do plano
export function planArea(planId?: string | null): string {
  const id = planId || "";
  if (id.startsWith("cli_")) return "/cliente/assinatura";
  if (id.startsWith("ent_")) return "/entregador/assinatura";
  return "/produtor/assinatura";
}
