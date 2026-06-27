/* eslint-disable @typescript-eslint/no-explicit-any */
export type DbPlan = {
  id: string;
  role: string;
  name: string;
  tagline: string;
  price_cents: number;
  commission_pct: number | null;
  features: string[];
  stripe_price_id: string | null;
  stripe_product_id: string | null;
  active: boolean;
  sort: number;
};

// Fallback: env var por id (mantém Stripe atual se stripe_price_id estiver vazio).
const PRICE_ENV: Record<string, string> = {
  campo: "STRIPE_PRICE_CAMPO",
  gourmet: "STRIPE_PRICE_GOURMET",
  premium: "STRIPE_PRICE_PREMIUM",
  cli_sabor: "STRIPE_PRICE_CLI_SABOR",
  cli_gourmet: "STRIPE_PRICE_CLI_GOURMET",
  ent_pro: "STRIPE_PRICE_ENT_PRO",
  ent_premium: "STRIPE_PRICE_ENT_PREMIUM",
};

export function effectivePriceId(p: Pick<DbPlan, "id" | "stripe_price_id">): string | null {
  if (p.stripe_price_id && p.stripe_price_id.trim()) return p.stripe_price_id.trim();
  const env = PRICE_ENV[p.id];
  return env ? (process.env[env]?.trim() || null) : null;
}

export async function getPlans(db: any): Promise<DbPlan[]> {
  const { data } = await db.from("plans").select("*").order("role", { ascending: true }).order("sort", { ascending: true });
  return (data ?? []) as DbPlan[];
}

export async function getPlansByRole(db: any, role: string): Promise<DbPlan[]> {
  const { data } = await db.from("plans").select("*").eq("role", role).eq("active", true).order("sort", { ascending: true });
  return (data ?? []) as DbPlan[];
}

export async function getPlanById(db: any, id: string): Promise<DbPlan | null> {
  const { data } = await db.from("plans").select("*").eq("id", id).maybeSingle();
  return (data ?? null) as DbPlan | null;
}

export async function producerCommissionPctDb(db: any, planId?: string | null): Promise<number> {
  const p = await getPlanById(db, planId || "campo");
  return p?.commission_pct ?? 12;
}

// ---------- Experiências: planos e comissão (separados dos produtos) ----------
const EXP_ACTIVE = ["active", "ativa", "ativo", "trialing"];
export const DEFAULT_EXPERIENCE_PLAN = "exp_inicial";
export const DEFAULT_EXPERIENCE_COMMISSION = 15;

export async function getExperiencePlans(db: any): Promise<DbPlan[]> {
  return getPlansByRole(db, "experiencias");
}

// Plano de experiências do anfitrião (produtor ou parceiro). Default: exp_inicial.
export async function experiencePlanIdOf(db: any, accountId: string): Promise<string> {
  const { data: sub } = await db.from("experience_subscriptions").select("plan, status").eq("account_id", accountId).maybeSingle();
  if (sub && sub.status && EXP_ACTIVE.includes(sub.status)) return (sub.plan as string) || DEFAULT_EXPERIENCE_PLAN;
  return DEFAULT_EXPERIENCE_PLAN;
}

export async function experienceCommissionPct(db: any, accountId: string): Promise<number> {
  const planId = await experiencePlanIdOf(db, accountId);
  const p = await getPlanById(db, planId);
  return p?.commission_pct ?? DEFAULT_EXPERIENCE_COMMISSION;
}
