import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { AppShell, PRODUTOR_NAV } from "@/components/AppShell";
import { PayoutTransferTable } from "@/components/PayoutTransferTable";
import { stripeEnabled } from "@/lib/stripe";
import {
  refreshStripeAccountStatus,
  stripeAccountReady,
  stripeAccountStatusFromProfile,
  stripeAccountStatusText,
  stripeAccountStatusTitle,
  stripeConnectVersion,
} from "@/lib/stripe-connect";
import { formatBRL } from "@/lib/catalog";
import { DEFAULT_PRODUCER_PLAN } from "@/lib/plans";
import { getPlanById, producerCommissionPctDb } from "@/lib/plans-db";
import { courierShareCents } from "@/lib/shipping";
import { sumTransfers, type PayoutTransferRow } from "@/lib/financial";
import { setPayoutMode } from "./actions";

type PayableOrder = {
  total_cents: number;
  delivery_fee_cents: number;
  self_delivery: boolean;
  producer_paid_out: boolean;
  courier_paid_out: boolean;
};

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
    .select("stripe_account_id, stripe_charges_enabled, stripe_account_version, stripe_account_status, stripe_transfers_status, stripe_requirements_due, stripe_requirements_past_due, payout_mode")
    .eq("id", user.id)
    .single();
  let accountId = (acc?.stripe_account_id as string | null) ?? null;
  const accountVersion = stripeConnectVersion(acc?.stripe_account_version);
  let accountStatus = stripeAccountStatusFromProfile(acc);
  let chargesEnabled = stripeAccountReady(acc);

  // Atualiza status da conta conectada (ao voltar do onboarding ou no load)
  if (stripeEnabled() && accountId) {
    try {
      const status = await refreshStripeAccountStatus(supabase, user.id, accountId, accountVersion);
      accountStatus = status.accountStatus;
      chargesEnabled = status.ready;
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
  const plan = await getPlanById(supabase, planId);
  const pct = await producerCommissionPctDb(supabase, planId);

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

  const [{ data: transferData }, { data: payableOrderData }] = await Promise.all([
    supabase.from("payout_transfers")
      .select("id, source_type, source_id, recipient_id, stripe_transfer_id, stripe_reversal_id, kind, amount_cents, currency, status, error, created_at, reversed_at")
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false })
      .limit(12),
    supabase.from("orders")
      .select("total_cents, delivery_fee_cents, self_delivery, producer_paid_out, courier_paid_out")
      .eq("producer_id", user.id)
      .neq("status", "cancelado")
      .eq("payment_status", "pago"),
  ]);
  const transfers = (transferData ?? []) as PayoutTransferRow[];
  const payableOrders = (payableOrderData ?? []) as PayableOrder[];
  const pendingProducts = payableOrders
    .filter((order) => !order.producer_paid_out)
    .reduce((total, order) => {
      const revenue = order.total_cents - (order.delivery_fee_cents || 0);
      return total + Math.max(0, revenue - Math.round((revenue * pct) / 100));
    }, 0);
  const pendingSelfDelivery = payableOrders
    .filter((order) => order.self_delivery && !order.courier_paid_out)
    .reduce((total, order) => total + courierShareCents(order.delivery_fee_cents || 0), 0);
  const pendingPayout = pendingProducts + pendingSelfDelivery;
  const sentPayout = sumTransfers(transfers, "created");
  const reversedPayout = sumTransfers(transfers, "reversed");
  const failedTransfers = transfers.filter((transfer) => transfer.status === "failed").length;

  const errMsg: Record<string, string> = {
    stripe_off: "Pagamento online temporariamente indisponível. Tente novamente em instantes ou acione o suporte.",
    connect_setup: "Não foi possível abrir o onboarding do Stripe agora. Tente novamente em instantes.",
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
          A Seravie Campo intermedia os pagamentos via Stripe, calcula a comissão da
          plataforma e repassa seus valores para a conta conectada. Conecte-a uma vez para começar.
        </p>

        <div className="mt-6">
          {!stripeEnabled() ? (
            <StatusBox tone="muted" title="Pagamento online indisponível">
              Não foi possível carregar o Stripe neste ambiente. Tente novamente em instantes
              ou acione o suporte interno.
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
              <StatusBox tone={accountStatus === "restricted" ? "warn" : "muted"} title={stripeAccountStatusTitle(accountStatus)}>
                {stripeAccountStatusText(Boolean(accountId), accountStatus)}
              </StatusBox>
              <button className="mt-4 rounded-lg bg-gold px-6 py-2.5 font-medium text-campo-bg transition hover:bg-gold-light">
                Continuar cadastro
              </button>
            </form>
          ) : (
            <StatusBox tone="ok" title="Conta conectada ✓">
              Tudo certo! Você já pode receber os repasses dos pagamentos intermediados pela Seravie Campo.
            </StatusBox>
          )}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 font-serif text-xl text-forest-100">Extrato de repasses</h2>
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Line label="A liberar" value={formatBRL(pendingPayout)} accent />
          <Line label="Enviado via Stripe" value={formatBRL(sentPayout)} />
          <Line label="Estornado" value={formatBRL(reversedPayout)} />
          <Line label="Falhas de repasse" value={String(failedTransfers)} />
        </div>
        <PayoutTransferTable transfers={transfers} />
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
