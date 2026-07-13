import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { AppShell, ENTREGADOR_NAV } from "@/components/AppShell";
import { SubscriptionPlans } from "@/components/SubscriptionPlans";
import { getPlansByRole } from "@/lib/plans-db";
import { SubscriptionStatus } from "@/components/SubscriptionStatus";
import { stripeEnabled } from "@/lib/stripe";

export default async function AssinaturaEntregadorPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; canceled?: string; error?: string; cancelado?: string }>;
}) {
  const { user, profile } = await requireRole("entregador");
  const { ok, canceled, error, cancelado } = await searchParams;
  const supabase = await createClient();
  const plans = await getPlansByRole(supabase, "entregador");
  const { data: sub } = await supabase.from("subscriptions").select("plan, status, current_period_end, cancel_at_period_end").eq("account_id", user.id).maybeSingle();
  const currentPlan = (sub?.status === "ativa" ? sub?.plan : "ent_base") as string;

  const errMsg: Record<string, string> = {
    stripe_off: "Pagamento online temporariamente indisponível. Tente novamente em instantes ou acione o suporte.",
    price_off: "Este plano precisa de um preço Stripe vinculado. Avise o suporte para ajustar.",
  };

  return (
    <AppShell badge="Entregador" nav={ENTREGADOR_NAV} userName={profile?.full_name ?? "Entregador"} title="Plano do entregador" subtitle="Mais prioridade e ganhos com um plano Pro.">
      {ok && <div className="mb-4 rounded-lg border border-forest-700 bg-forest-900/40 px-3 py-2 text-sm text-forest-200">Plano ativado!</div>}
      {canceled && <div className="mb-4 rounded-lg border border-campo-border bg-campo-surface2 px-3 py-2 text-sm text-stone-400">Assinatura não concluída.</div>}
      {error && <div className="mb-4 rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">{errMsg[error] ?? decodeURIComponent(error)}</div>}
      {!stripeEnabled() && (
        <div className="mb-6 rounded-xl border border-campo-border bg-campo-surface2 px-4 py-3 text-sm text-stone-400">
          Pagamento online temporariamente indisponível. Os planos continuam visíveis; tente assinar novamente em instantes.
        </div>
      )}
      {cancelado && <div className="mb-4 rounded-lg border border-forest-700 bg-forest-900/40 px-3 py-2 text-sm text-forest-200">Assinatura cancelada. Ativa até o fim do ciclo; sem cobrança no próximo mês.</div>}
      <SubscriptionStatus sub={sub} back="/entregador/assinatura" />
      <SubscriptionPlans plans={plans} currentPlan={currentPlan} enabled={stripeEnabled()} highlightId="ent_pro" />
    </AppShell>
  );
}
