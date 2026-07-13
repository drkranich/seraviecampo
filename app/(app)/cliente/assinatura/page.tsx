import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { AppShell, CLIENTE_NAV } from "@/components/AppShell";
import { SubscriptionPlans } from "@/components/SubscriptionPlans";
import { getPlansByRole } from "@/lib/plans-db";
import { SubscriptionStatus } from "@/components/SubscriptionStatus";
import { stripeEnabled } from "@/lib/stripe";
import { trialStatus, PAID_CLIENT_PLANS, ACTIVE_SUB_STATUS } from "@/lib/trial";

export default async function AssinaturaClientePage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; canceled?: string; error?: string; trial?: string; cancelado?: string }>;
}) {
  const { user, profile } = await requireRole("cliente");
  const { ok, canceled, error, trial, cancelado } = await searchParams;
  const supabase = await createClient();
  const plans = await getPlansByRole(supabase, "cliente");
  const { data: sub } = await supabase.from("subscriptions").select("plan, status, current_period_end, cancel_at_period_end").eq("account_id", user.id).maybeSingle();
  const currentPlan = (sub?.status === "ativa" ? sub?.plan : "cli_livre") as string;

  const hasPaid = !!(sub && sub.status && ACTIVE_SUB_STATUS.includes(sub.status) && PAID_CLIENT_PLANS.includes(sub.plan as string));
  const { count } = await supabase.from("orders").select("id", { count: "exact", head: true })
    .eq("customer_id", user.id).neq("status", "cancelado");
  const { data: prof } = await supabase.from("profiles").select("created_at").eq("id", user.id).single();
  const st = trialStatus({ createdAt: prof?.created_at ?? new Date().toISOString(), purchaseCount: count ?? 0, hasPaidPlan: hasPaid });

  const errMsg: Record<string, string> = {
    stripe_off: "Pagamento online temporariamente indisponível. Tente novamente em instantes ou acione o suporte.",
    price_off: "Este plano precisa de um preço Stripe vinculado. Avise o suporte para ajustar.",
  };

  return (
    <AppShell badge="Clube Gourmet" nav={CLIENTE_NAV} userName={profile?.full_name ?? "Cliente"} title="Assinatura" subtitle="Vire membro do Clube e receba mais por menos.">
      {ok && <div className="mb-4 rounded-lg border border-forest-700 bg-forest-900/40 px-3 py-2 text-sm text-forest-200">Assinatura ativada! Bem-vindo ao Clube.</div>}
      {trial === "expirado" && <div className="mb-4 rounded-lg border border-gold/40 bg-gold/10 px-3 py-2 text-sm text-gold">Sua degustação terminou (15 dias ou 5 compras). Escolha um plano para continuar comprando.</div>}
      {!st.paid && trial !== "expirado" && (
        <div className="mb-4 rounded-lg border border-campo-border bg-campo-surface2 px-3 py-2 text-sm text-stone-300">
          Degustação ativa: <strong className="text-gold">{st.daysLeft} dia(s)</strong> e <strong className="text-gold">{st.purchasesLeft} compra(s)</strong> restantes. Depois disso, assine um plano para continuar.
        </div>
      )}
      {canceled && <div className="mb-4 rounded-lg border border-campo-border bg-campo-surface2 px-3 py-2 text-sm text-stone-400">Assinatura não concluída.</div>}
      {error && <div className="mb-4 rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">{errMsg[error] ?? decodeURIComponent(error)}</div>}
      {!stripeEnabled() && (
        <div className="mb-6 rounded-xl border border-campo-border bg-campo-surface2 px-4 py-3 text-sm text-stone-400">
          Pagamento online temporariamente indisponível. Os planos continuam visíveis; tente assinar novamente em instantes.
        </div>
      )}
      {cancelado && <div className="mb-4 rounded-lg border border-forest-700 bg-forest-900/40 px-3 py-2 text-sm text-forest-200">Assinatura cancelada. Ativa até o fim do ciclo; sem cobrança no próximo mês.</div>}
      <SubscriptionStatus sub={sub} back="/cliente/assinatura" />
      <SubscriptionPlans plans={plans} currentPlan={currentPlan} enabled={stripeEnabled()} highlightId="cli_sabor" />
    </AppShell>
  );
}
