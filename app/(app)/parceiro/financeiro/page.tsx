import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { AppShell, PARCEIRO_NAV } from "@/components/AppShell";
import { PayoutTransferTable } from "@/components/PayoutTransferTable";
import { stripeEnabled, getAccount } from "@/lib/stripe";
import { formatMoney } from "@/lib/money";
import { getPlanById, experiencePlanIdOf, experienceCommissionPct } from "@/lib/plans-db";
import { sumTransfers, type PayoutTransferRow } from "@/lib/financial";
import { setPayoutMode } from "./actions";

type PayableBooking = {
  total_cents: number;
  producer_paid_out: boolean;
};

export default async function FinanceiroParceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ refresh?: string; error?: string; ok?: string }>;
}) {
  const { user, profile } = await requireRole("parceiro");
  const { refresh, error, ok } = await searchParams;
  const supabase = await createClient();

  const { data: acc } = await supabase
    .from("profiles").select("stripe_account_id, stripe_charges_enabled, payout_mode, currency").eq("id", user.id).single();
  const accountId = (acc?.stripe_account_id as string | null) ?? null;
  let chargesEnabled = Boolean(acc?.stripe_charges_enabled);
  const currency = (acc?.currency as string) || "BRL";
  const payoutMode = ((acc as { payout_mode?: string } | null)?.payout_mode ?? "mensal");

  if (stripeEnabled() && accountId) {
    try {
      const a = await getAccount(accountId);
      if (a.charges_enabled !== chargesEnabled) {
        chargesEnabled = a.charges_enabled;
        await supabase.from("profiles").update({ stripe_charges_enabled: chargesEnabled }).eq("id", user.id);
      }
    } catch { /* mantém status */ }
  }

  const planId = await experiencePlanIdOf(supabase, user.id);
  const plan = await getPlanById(supabase, planId);
  const pct = await experienceCommissionPct(supabase, user.id);

  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const { data: paid } = await supabase
    .from("experience_bookings").select("total_cents")
    .eq("producer_id", user.id).eq("payment_status", "pago")
    .gte("created_at", monthStart.toISOString());
  const gross = (paid ?? []).reduce((s, b) => s + ((b.total_cents as number) || 0), 0);
  const commission = Math.round((gross * pct) / 100);
  const mensalidade = plan?.price_cents ?? 0;
  const net = gross - commission;

  const [{ data: transferData }, { data: payableBookingData }] = await Promise.all([
    supabase.from("payout_transfers")
      .select("id, source_type, source_id, recipient_id, stripe_transfer_id, stripe_reversal_id, kind, amount_cents, currency, status, error, created_at, reversed_at")
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false })
      .limit(12),
    supabase.from("experience_bookings")
      .select("total_cents, producer_paid_out")
      .eq("producer_id", user.id)
      .neq("status", "cancelado")
      .eq("payment_status", "pago"),
  ]);
  const transfers = (transferData ?? []) as PayoutTransferRow[];
  const payableBookings = (payableBookingData ?? []) as PayableBooking[];
  const pendingPayout = payableBookings
    .filter((booking) => !booking.producer_paid_out)
    .reduce((total, booking) => {
      const value = booking.total_cents || 0;
      return total + Math.max(0, value - Math.round((value * pct) / 100));
    }, 0);
  const sentPayout = sumTransfers(transfers, "created");
  const reversedPayout = sumTransfers(transfers, "reversed");
  const failedTransfers = transfers.filter((transfer) => transfer.status === "failed").length;

  const errMsg: Record<string, string> = {
    stripe_off: "Pagamento online temporariamente indisponível. Tente novamente em instantes ou acione o suporte.",
    connect_setup: "Não foi possível abrir o onboarding do Stripe agora. Tente novamente em instantes.",
  };

  return (
    <AppShell badge="Parceiro de Experiências" nav={PARCEIRO_NAV} userName={profile?.full_name ?? "Parceiro"} profileHref="/parceiro/perfil"
      title="Financeiro" subtitle="Receba os pagamentos das suas experiências via Stripe.">
      {error && <div className="mb-4 rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">{errMsg[error] ?? decodeURIComponent(error)}</div>}
      {ok && <div className="mb-4 rounded-lg border border-forest-700 bg-forest-900/40 px-3 py-2 text-sm text-forest-200">Preferência de repasse atualizada.</div>}
      {refresh && chargesEnabled && <div className="mb-4 rounded-lg border border-forest-700 bg-forest-900/40 px-3 py-2 text-sm text-forest-200">Conta verificada — você já pode receber pagamentos.</div>}

      <section className="glass max-w-2xl rounded-2xl border border-campo-border p-6">
        <h2 className="font-serif text-xl text-forest-100">Conta de recebimento (Stripe Connect)</h2>
        <p className="mt-2 text-sm leading-relaxed text-stone-400">
          A Seravie Campo intermedia os pagamentos das reservas via Stripe, calcula a comissão da plataforma e repassa seus valores para a conta conectada. Conecte-a uma vez para começar.
        </p>
        <div className="mt-6">
          {!stripeEnabled() ? (
            <StatusBox tone="muted" title="Pagamento online indisponível">Não foi possível carregar o Stripe neste ambiente. Tente novamente em instantes ou acione o suporte interno.</StatusBox>
          ) : !accountId ? (
            <form action="/api/stripe/connect" method="post">
              <StatusBox tone="muted" title="Conta ainda não conectada">Conecte sua conta Stripe para receber pelas reservas.</StatusBox>
              <button className="mt-4 rounded-lg bg-gold px-6 py-2.5 font-medium text-campo-bg transition hover:bg-gold-light">Conectar conta Stripe</button>
            </form>
          ) : !chargesEnabled ? (
            <form action="/api/stripe/connect" method="post">
              <StatusBox tone="warn" title="Cadastro incompleto">Continue o cadastro no Stripe para liberar os recebimentos.</StatusBox>
              <button className="mt-4 rounded-lg bg-gold px-6 py-2.5 font-medium text-campo-bg transition hover:bg-gold-light">Continuar cadastro</button>
            </form>
          ) : (
            <StatusBox tone="ok" title="Conta conectada ✓">Tudo certo! Você já pode receber pelas experiências.</StatusBox>
          )}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 font-serif text-xl text-forest-100">Extrato de repasses</h2>
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Line label="A liberar" value={formatMoney(pendingPayout, currency)} accent />
          <Line label="Enviado via Stripe" value={formatMoney(sentPayout, currency)} />
          <Line label="Estornado" value={formatMoney(reversedPayout, currency)} />
          <Line label="Falhas de repasse" value={String(failedTransfers)} />
        </div>
        <PayoutTransferTable transfers={transfers} empty="Nenhum repasse de experiência registrado ainda." />
      </section>

      <section className="glass mt-6 max-w-2xl rounded-2xl border border-campo-border p-6">
        <h2 className="font-serif text-xl text-forest-100">Plano, comissão e repasse</h2>
        <p className="mt-2 text-sm text-stone-400">
          Plano: <strong className="text-gold">{plan?.name ?? planId}</strong> · mensalidade {formatMoney(mensalidade, currency)} · comissão <strong className="text-gold">{pct}%</strong> por reserva.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Line label="Reservas pagas (mês)" value={formatMoney(gross, currency)} />
          <Line label={`Comissão (${pct}%)`} value={`- ${formatMoney(commission, currency)}`} />
          <Line label="Mensalidade do plano" value={formatMoney(mensalidade, currency)} />
          <Line label="A receber (mês)" value={formatMoney(net, currency)} accent />
        </div>

        <form action={setPayoutMode} className="mt-6 space-y-3">
          <p className="text-sm text-stone-300">Como você quer receber:</p>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-campo-border bg-campo-bg p-3 transition hover:border-gold/50 has-[:checked]:border-gold has-[:checked]:bg-forest-900/40">
            <input type="radio" name="payout_mode" value="mensal" defaultChecked={payoutMode !== "imediato"} className="mt-1 accent-gold" />
            <span><span className="block text-sm font-medium text-forest-100">Acumulado mensal</span><span className="block text-xs text-stone-400">Recebe o total do mês com a comissão já descontada.</span></span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-campo-border bg-campo-bg p-3 transition hover:border-gold/50 has-[:checked]:border-gold has-[:checked]:bg-forest-900/40">
            <input type="radio" name="payout_mode" value="imediato" defaultChecked={payoutMode === "imediato"} className="mt-1 accent-gold" />
            <span><span className="block text-sm font-medium text-forest-100">No dia útil seguinte</span><span className="block text-xs text-stone-400">Recebe a cada reserva no próximo dia útil, com a comissão descontada.</span></span>
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
