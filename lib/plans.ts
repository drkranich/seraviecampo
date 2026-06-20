export type PlanId = "campo" | "gourmet" | "premium";

export type Plan = {
  id: PlanId;
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

export function getPlan(id: string): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}

export function formatPlanPrice(cents: number): string {
  if (cents === 0) return "Grátis";
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
