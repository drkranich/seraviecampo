// Degustação do plano Avulso do cliente: 15 dias OU 5 compras.
export const TRIAL_DAYS = 15;
export const TRIAL_PURCHASES = 5;

export type TrialStatus = { paid: boolean; blocked: boolean; daysLeft: number; purchasesLeft: number };

export function trialStatus(args: { createdAt: string; purchaseCount: number; hasPaidPlan: boolean }): TrialStatus {
  if (args.hasPaidPlan) return { paid: true, blocked: false, daysLeft: 0, purchasesLeft: 0 };
  const start = new Date(args.createdAt).getTime();
  const daysUsed = Math.floor((Date.now() - start) / 86400000);
  const daysLeft = Math.max(0, TRIAL_DAYS - daysUsed);
  const purchasesLeft = Math.max(0, TRIAL_PURCHASES - args.purchaseCount);
  return { paid: false, blocked: daysLeft <= 0 || purchasesLeft <= 0, daysLeft, purchasesLeft };
}

export const PAID_CLIENT_PLANS = ["cli_sabor", "cli_gourmet"];
export const ACTIVE_SUB_STATUS = ["active", "ativa", "ativo", "trialing"];
