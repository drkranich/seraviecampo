import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { AppShell, CLIENTE_NAV } from "@/components/AppShell";
import { SubscriptionPlans } from "@/components/SubscriptionPlans";
import { CLIENTE_PLANS } from "@/lib/plans";
import { stripeEnabled } from "@/lib/stripe";

export default async function AssinaturaClientePage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; canceled?: string; error?: string }>;
}) {
  const { user, profile } = await requireRole("cliente");
  const { ok, canceled, error } = await searchParams;
  const supabase = await createClient();
  const { data: sub } = await supabase.from("subscriptions").select("plan, status").eq("account_id", user.id).maybeSingle();
  const currentPlan = (sub?.status === "ativa" ? sub?.plan : "cli_livre") as string;

  const errMsg: Record<string, string> = {
    stripe_off: "Pagamentos ainda não ativados pela plataforma.",
    price_off: "Preço deste plano ainda não configurado.",
  };

  return (
    <AppShell badge="Clube Gourmet" nav={CLIENTE_NAV} userName={profile?.full_name ?? "Cliente"} title="Assinatura" subtitle="Vire membro do Clube e receba mais por menos.">
      {ok && <div className="mb-4 rounded-lg border border-forest-700 bg-forest-900/40 px-3 py-2 text-sm text-forest-200">Assinatura ativada! Bem-vindo ao Clube.</div>}
      {canceled && <div className="mb-4 rounded-lg border border-campo-border bg-campo-surface2 px-3 py-2 text-sm text-stone-400">Assinatura não concluída.</div>}
      {error && <div className="mb-4 rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">{errMsg[error] ?? decodeURIComponent(error)}</div>}
      {!stripeEnabled() && (
        <div className="mb-6 rounded-xl border border-campo-border bg-campo-surface2 px-4 py-3 text-sm text-stone-400">
          Pagamentos em configuração. Você pode ver os planos; a assinatura é liberada quando o Stripe for ativado.
        </div>
      )}
      <SubscriptionPlans plans={CLIENTE_PLANS} currentPlan={currentPlan} enabled={stripeEnabled()} highlightId="cli_sabor" />
    </AppShell>
  );
}
