import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { AppShell, PRODUTOR_NAV } from "@/components/AppShell";
import { stripeEnabled } from "@/lib/stripe";
import { getPlansByRole } from "@/lib/plans-db";
import { SubscriptionPlans } from "@/components/SubscriptionPlans";
import { SubscriptionStatus } from "@/components/SubscriptionStatus";

export default async function AssinaturaPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; canceled?: string; error?: string; cancelado?: string }>;
}) {
  const { user, profile } = await requireRole("produtor");
  const { ok, canceled, error, cancelado } = await searchParams;
  const supabase = await createClient();

  const { data: sub } = await supabase
    .from("subscriptions").select("plan, status, current_period_end, cancel_at_period_end")
    .eq("account_id", user.id).maybeSingle();
  const currentPlan = (sub?.status === "ativa" ? sub?.plan : "campo") as string;
  const enabled = stripeEnabled();
  const plans = await getPlansByRole(supabase, "produtor");

  const errMsg: Record<string, string> = {
    stripe_off: "Pagamentos ainda não ativados pela plataforma.",
    price_off: "Preço deste plano ainda não configurado.",
    plano_invalido: "Plano inválido.",
  };

  return (
    <AppShell badge="Produtor Rural" nav={PRODUTOR_NAV} userName={profile?.full_name ?? "Produtor"} profileHref="/produtor/perfil" title="Meu Plano" subtitle="Escolha o plano da Seravie Campo para a sua operação.">
      {ok && <div className="mb-4 rounded-lg border border-forest-700 bg-forest-900/40 px-3 py-2 text-sm text-forest-200">Assinatura ativada! Bem-vindo ao próximo nível.</div>}
      {canceled && <div className="mb-4 rounded-lg border border-campo-border bg-campo-surface2 px-3 py-2 text-sm text-stone-400">Assinatura não concluída. Você pode tentar novamente quando quiser.</div>}
      {error && <div className="mb-4 rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">{errMsg[error] ?? decodeURIComponent(error)}</div>}
      {!enabled && <div className="mb-6 rounded-xl border border-campo-border bg-campo-surface2 px-4 py-3 text-sm text-stone-400">Os pagamentos estão em configuração pela plataforma. Você pode ver os planos abaixo; a assinatura é liberada assim que o Stripe for ativado.</div>}
      {cancelado && <div className="mb-4 rounded-lg border border-forest-700 bg-forest-900/40 px-3 py-2 text-sm text-forest-200">Assinatura cancelada. Ativa até o fim do ciclo; sem cobrança no próximo mês.</div>}

      <SubscriptionStatus sub={sub} back="/produtor/assinatura" />
      <SubscriptionPlans plans={plans} currentPlan={currentPlan} enabled={enabled} highlightId="gourmet" />
    </AppShell>
  );
}
