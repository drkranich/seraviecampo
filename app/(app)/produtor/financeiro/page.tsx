import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { AppShell, PRODUTOR_NAV } from "@/components/AppShell";
import { stripeEnabled, getAccount } from "@/lib/stripe";
import { formatBRL } from "@/lib/catalog";
import { getPlan, producerCommissionPct, DEFAULT_PRODUCER_PLAN } from "@/lib/plans";
import { setPayoutMode } from "./actions";

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ refresh?: string; error?: string; ok?: string }>;
}) {
  const { user, profile } = await requireRole("produtor");
  const { refresh, error, ok } = await searchParams;
  const supabase = await createClient();

  const { data: acc } = await supabase
    .from("profiles")
    .select("stripe_account_id, stripe_charges_enabled, payout_mode")
    .eq("id", user.id)
    .single();
  let accountId = (acc?.stripe_account_id as string | null) ?? null;
  let chargesEnabled = Boolean(acc?.stripe_charges_enabled);

  // Atualiza status da conta conectada (ao voltar do onboarding ou no load)
  if (stripeEnabled() && accountId) {
    try {
      const acc = await getAccount(accountId);
      if (acc.charges_enabled !== chargesEnabled) {
        chargesEnabled = acc.charges_enabled;
        await supabase.from("profiles").update({ stripe_charges_enabled: chargesEnabled }).eq("id", user.id);
      }
    } catch {
      /* mantém status atual */
    }
  }

  // Plano do produtor, comissão e repasse
  const payoutMode = ((acc as { payout_mode?: string } | null)?.payout_mode ?? "mensal");
  const { data: sub } = await supabase
    .from("subscriptions").select("plan, status").eq("account_id", user.id)
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  const planId = ((sub?.plan as string) || DEFAULT_PRODUCER_PLAN);
  const plan = getPlan(planId);
  const pct = producerCommissionPct(planId);

  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const { data: paidOrders } = await supabase
    .from("orders").select("total_cents, delivery_fee_cents")
    .eq("producer_id", user.id).neq("status", "cancelado")
    .in("payment_status", ["pago", "na_entrega"])
    .gte("created_at", monthStart.toISOString());
  const rows = (paidOrders ?? []) as { total_cents: number; delivery_fee_cents: number }[];
  const productRevenue = rows.reduce((acc2, o) => acc2 + (o.total_cents - (o.delivery_fee_cents || 0)), 0);
  const commission = Math.round((productRevenue * pct) / 100);
  const subscriptionCost = plan?.price_cents ?? 0;
  const netMensal = productRevenue - commission - subscriptionCost;

  const errMsg: Record<string, string> = {
    stripe_off: "A plataforma ainda não ativou o Stripe. Volte em breve.",
  };

  return (
    <AppShell
      badge="Produtor Rural" nav={PRODUTOR_NAV}
      userName={profile?.full_name ?? "Produtor"} profileHref="/produtor/perfil"
      title="Financeiro" subtitle="Receba os pagamentos dos seus clientes via Stripe."
    >
      {error && (
        <div className="mb-4 rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {errMsg[error] ?? decodeURIComponent(error)}
        </div>
      )}
      {ok && (
        <div className="mb-4 rounded-lg border border-forest-700 bg-forest-900/40 px-3 py-2 text-sm text-forest-200">
          Preferência de repasse atualizada.
        </div>
      )}
      {refresh && chargesEnabled && (
        <div className="mb-4 rounded-lg border border-forest-700 bg-forest-900/40 px-3 py-2 text-sm text-forest-200">
          Conta verificada — você já pode receber pagamentos.
        </div>
      )}

      <section className="glass max-w-2xl rounded-2xl border border-campo-border p-6">
        <h2 className="font-serif text-xl text-forest-100">Conta de recebimento (Stripe Connect)</h2>
        <p className="mt-2 text-sm leading-relaxed text-stone-400">
          A Seravie Campo conecta você ao cliente — o dinheiro das vendas cai direto na
          sua conta Stripe. Conecte-a uma vez para começar a cobrar.
        </p>

        <div className="mt-6">
          {!stripeEnabled() ? (
            <StatusBox tone="muted" title="Stripe em configuração">
              A integração de pagamentos será ativada pela plataforma. Assim que disponível,
              o botão de conectar aparece aqui.
            </StatusBox>
          ) : !accountId ? (
            <form action="/api/stripe/connect" method="post">
              <StatusBox tone="muted" title="Conta ainda não conectada">
                Conecte sua conta Stripe para receber os pagamentos dos pedidos.
              </StatusBox>
              <button className="mt-4 rounded-lg bg-gold px-6 py-2.5 font-medium text-campo-bg transition hover:bg-gold-light">
                Conectar conta Stripe
              </button>
            </form>
          ) : !chargesEnabled ? (
            <form action="/api/stripe/connect" method="post">
              <StatusBox tone="warn" title="Cadastro incompleto">
                Você começou a conexão, mas o Stripe ainda precisa de alguns dados.
                Continue o cadastro para liberar os recebimentos.
              </StatusBox>
              <button className="mt-4 rounded-lg bg-gold px-6 py-2.5 font-medium text-campo-bg transition hover:bg-gold-light">
                Continuar cadastro
              </button>
            </form>
          ) : (
            <StatusBox tone="ok" title="Conta conectada ✓">
              Tudo certo! Você já pode receber pagamentos dos clientes diretamente.
            </StatusBox>
          )}
        </div>
      </section>

      <section className="glass mt-6 max-w-2xl rounded-2xl border border-campo-border p-6">
        <h2 className="font-serif text-xl text-forest-100">Plano, comissão e repasse</h2>
        <p className="mt-2 text-sm text-stone-400">
          Plano atual: <strong className="text-gold">{plan?.name ?? planId}</strong> · mensalidade {formatBRL(subscriptionCost)} · comissão <strong className="text-gold">{pct}%</strong> por venda.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Line label="Vendas do mês (produtos)" value={formatBRL(productRevenue)} />
          <Line label={`Comissão (${pct}%)`} value={`- ${formatBRL(commission)}`} />
          <Line label="Mensalidade" value={`- ${formatBRL(subscriptionCost)}`} />
          <Line label="A receber (mês)" value={formatBRL(netMensal)} accent />
        </div>

        <form action={setPayoutMode} className="mt-6 space-y-3">
          <p className="text-sm text-stone-300">Como você quer receber:</p>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-campo-border bg-campo-bg p-3 transition hover:border-gold/50 has-[:checked]:border-gold has-[:checked]:bg-forest-900/40">
            <input type="radio" name="payout_mode" value="mensal" defaultChecked={payoutMode !== "imediato"} className="mt-1 accent-gold" />
            <span>
              <span className="block text-sm font-medium text-forest-100">Acumulado mensal</span>
              <span className="block text-xs text-stone-400">Recebe o total do mês já com mensalidade e comissão descontadas.</span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-campo-border bg-campo-bg p-3 transition hover:border-gold/50 has-[:checked]:border-gold has-[:checked]:bg-forest-900/40">
            <input type="radio" name="payout_mode" value="imediato" defaultChecked={payoutMode === "imediato"} className="mt-1 accent-gold" />
            <span>
              <span className="block text-sm font-medium text-forest-100">No dia útil seguinte</span>
              <span className="block text-xs text-stone-400">Recebe a cada venda no próximo dia útil, com comissão e mensalidade descontadas.</span>
            </span>
          </label>
          <button className="rounded-lg bg-gold px-6 py-2.5 font-medium text-campo-bg transition hover:bg-gold-light">Salvar preferência</button>
        </form>
      </section>
    </AppShell>
  );
}

function Line({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-campo-border bg-campo-surface2/50 p-3">
      <p className="text-xs uppercase tracking-wider text-stone-500">{label}</p>
      <p className={`mt-1 font-serif text-lg ${accent ? "text-gold" : "text-forest-100"}`}>{value}</p>
    </div>
  );
}

function StatusBox({ tone, title, children }: { tone: "ok" | "warn" | "muted"; title: string; children: React.ReactNode }) {
  const styles = {
    ok: "border-forest-700 bg-forest-900/40 text-forest-200",
    warn: "border-gold/40 bg-gold/10 text-gold",
    muted: "border-campo-border bg-campo-surface2 text-stone-400",
  }[tone];
  return (
    <div className={`rounded-xl border px-4 py-3 ${styles}`}>
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-xs leading-relaxed opacity-90">{children}</p>
    </div>
  );
}
