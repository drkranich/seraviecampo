export type PlanId = "campo" | "gourmet" | "premium";

export type Plan = {
  id: string;
  name: string;
  price_cents: number;
  tagline: string;
  features: string[];
  priceEnv?: string; // env var com o price_xxx do Stripe
};

export const PLANS: Plan[] = [
  {
    id: "campo",
    name: "Campo",
    price_cents: 0,
    tagline: "Para começar a vender",
    features: ["Até 15 produtos", "Pedidos e cesta", "Perfil público", "Suporte por e-mail"],
  },
  {
    id: "gourmet",
    name: "Gourmet",
    price_cents: 4900,
    tagline: "Para crescer com constância",
    features: ["Produtos ilimitados", "Assinaturas de cesta", "Insights de vendas", "Selo verificado", "Suporte prioritário"],
    priceEnv: "STRIPE_PRICE_GOURMET",
  },
  {
    id: "premium",
    name: "Premium",
    price_cents: 9900,
    tagline: "Operação gourmet completa",
    features: ["Tudo do Gourmet", "IA Rural", "Turismo + Agro", "Marketing avançado", "Gerente de conta"],
    priceEnv: "STRIPE_PRICE_PREMIUM",
  },
];


// ---------- Planos do Cliente (Clube Gourmet) ----------
export const CLIENTE_PLANS: Plan[] = [
  {
    id: "cli_livre",
    name: "Avulso",
    price_cents: 0,
    tagline: "Compre quando quiser",
    features: ["Compra avulsa", "Acesso à vitrine completa", "Acompanhar pedidos"],
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
    features: ["Frete grátis", "10% de desconto", "Cesta surpresa mensal", "Acesso a produtores premium", "Prioridade em reservas de colheita"],
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

export function formatPlanPrice(cents: number): string {
  if (cents === 0) return "Grátis";
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
