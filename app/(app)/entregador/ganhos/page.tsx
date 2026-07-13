import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { AppShell, ENTREGADOR_NAV } from "@/components/AppShell";
import { PayoutTransferTable } from "@/components/PayoutTransferTable";
import { AreaChart } from "@/components/charts";
import { formatBRL } from "@/lib/catalog";
import { courierShareCents } from "@/lib/shipping";
import { sumTransfers, type PayoutTransferRow } from "@/lib/financial";
import { stripeAccountStatusFromProfile, stripeAccountStatusText } from "@/lib/stripe-connect";

type Row = { delivery_fee_cents: number; created_at: string };
type PendingOrder = { delivery_fee_cents: number };
function startOfDay(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x; }

export default async function GanhosPage() {
  const { user, profile } = await requireRole("entregador");
  const supabase = await createClient();

  const since = new Date(); since.setDate(since.getDate() - 30);
  const { data } = await supabase
    .from("orders")
    .select("delivery_fee_cents, created_at")
    .eq("delivery_person_id", user.id)
    .eq("status", "entregue")
    .gte("created_at", since.toISOString());

  const rows = (data ?? []) as Row[];
  const total = rows.reduce((s, r) => s + courierShareCents(r.delivery_fee_cents || 0), 0);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const mes = rows.filter((r) => new Date(r.created_at) >= monthStart).reduce((s, r) => s + courierShareCents(r.delivery_fee_cents || 0), 0);

  const [{ data: transferData }, { data: pendingOrderData }, { data: accountData }] = await Promise.all([
    supabase.from("payout_transfers")
      .select("id, source_type, source_id, recipient_id, stripe_transfer_id, stripe_reversal_id, kind, amount_cents, currency, status, error, created_at, reversed_at")
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false })
      .limit(12),
    supabase.from("orders")
      .select("delivery_fee_cents")
      .eq("delivery_person_id", user.id)
      .eq("status", "entregue")
      .eq("payment_status", "pago")
      .eq("courier_paid_out", false),
    supabase.from("profiles")
      .select("stripe_account_id, stripe_charges_enabled, stripe_account_status, stripe_transfers_status")
      .eq("id", user.id)
      .single(),
  ]);
  const transfers = (transferData ?? []) as PayoutTransferRow[];
  const pendingOrders = (pendingOrderData ?? []) as PendingOrder[];
  const pendingPayout = pendingOrders.reduce((total2, order) => total2 + courierShareCents(order.delivery_fee_cents || 0), 0);
  const sentPayout = sumTransfers(transfers, "created");
  const reversedPayout = sumTransfers(transfers, "reversed");
  const failedTransfers = transfers.filter((transfer) => transfer.status === "failed").length;
  const accountConnected = Boolean(accountData?.stripe_account_id);
  const accountStatus = stripeAccountStatusFromProfile(accountData);

  const labels: string[] = [];
  const series: number[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = startOfDay(new Date(now)); d.setDate(d.getDate() - i);
    const next = new Date(d); next.setDate(next.getDate() + 1);
    labels.push(d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }));
    series.push(rows.filter((r) => { const rd = new Date(r.created_at); return rd >= d && rd < next; }).reduce((s, r) => s + courierShareCents(r.delivery_fee_cents || 0), 0) / 100);
  }

  return (
    <AppShell badge="Entregador" nav={ENTREGADOR_NAV} userName={profile?.full_name ?? "Entregador"} title="Ganhos" subtitle="Suas comissões de entrega e repasses Stripe.">
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Este mês" value={formatBRL(mes)} accent />
        <Stat label="Últimos 30 dias" value={formatBRL(total)} />
        <Stat label="A liberar" value={formatBRL(pendingPayout)} />
        <Stat label="Entregas (30d)" value={String(rows.length)} />
      </div>

      <section className="glass mb-6 rounded-2xl border border-campo-border p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-lg text-forest-100">Conta de recebimento</h2>
            <p className="mt-1 text-sm text-stone-400">{stripeAccountStatusText(accountConnected, accountStatus)}</p>
          </div>
          <form action="/api/stripe/connect" method="post">
            <button className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-campo-bg transition hover:bg-gold-light">
              {accountConnected ? "Atualizar Stripe" : "Conectar Stripe"}
            </button>
          </form>
        </div>
      </section>

      <section className="glass rounded-2xl border border-campo-border p-5">
        <h2 className="mb-4 font-serif text-lg text-forest-100">Ganhos por dia</h2>
        <AreaChart data={series} labels={labels} />
      </section>

      <section className="mt-6">
        <h2 className="mb-3 font-serif text-xl text-forest-100">Extrato de repasses</h2>
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <Stat label="Enviado via Stripe" value={formatBRL(sentPayout)} />
          <Stat label="Estornado" value={formatBRL(reversedPayout)} />
          <Stat label="Falhas de repasse" value={String(failedTransfers)} />
        </div>
        <PayoutTransferTable transfers={transfers} empty="Nenhum repasse de entrega registrado ainda." />
      </section>
    </AppShell>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="glass rounded-2xl border border-campo-border p-5">
      <p className="text-xs uppercase tracking-wider text-stone-500">{label}</p>
      <p className={`mt-2 font-serif text-2xl ${accent ? "text-gold" : "text-forest-100"}`}>{value}</p>
    </div>
  );
}
