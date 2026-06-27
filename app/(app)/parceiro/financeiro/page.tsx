import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { AppShell, PARCEIRO_NAV } from "@/components/AppShell";
import { stripeEnabled, getAccount } from "@/lib/stripe";
import { formatMoney } from "@/lib/money";
import { getPlanById, experiencePlanIdOf, experienceCommissionPct } from "@/lib/plans-db";
import { setPayoutMode } from "./actions";

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

  const errMsg: Record<string, string> = {
    stripe_off: "A plataforma ainda não ativou o Stripe. Volte em breve.",
    connect_setup: "Os recebimentos via Stripe estão sendo ativados pela plataforma. Tente novamente em breve.",
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
          O valor das reservas cai direto na sua conta Stripe, já com a comissão da plataforma descontada. Conecte-a uma vez para começar.
        </p>
        <div className="mt-6">
          {!stripeEnabled() ? (
            <StatusBox tone="muted" title="Stripe em configuração">A integração será ativada pela plataforma.</StatusBox>
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
