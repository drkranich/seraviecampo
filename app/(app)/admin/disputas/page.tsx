import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { AppShell, ADMIN_NAV } from "@/components/AppShell";
import { formatBRL } from "@/lib/catalog";
import { DISPUTE_STATUS_LABEL, DISPUTE_STATUS_STYLE, DISPUTE_REASON_LABEL, type Dispute, type DisputeStatus } from "@/lib/disputes";
import { resolveDispute } from "@/lib/actions/disputes";

type Row = Dispute & {
  order: {
    id: string;
    total_cents: number;
    payment_status: string;
    status: string;
    customer_id: string;
    producer_id: string;
    stripe_payment_intent_id: string | null;
    stripe_refund_id: string | null;
  } | null;
};

export default async function AdminDisputasPage({
  searchParams,
}: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  await requireRole("super_admin");
  const sp = await searchParams;
  const supabase = await createClient();

  const { data } = await supabase
    .from("disputes")
    .select("*, order:orders(id, total_cents, payment_status, status, customer_id, producer_id, stripe_payment_intent_id, stripe_refund_id)")
    .order("created_at", { ascending: false });
  const disputes = (data ?? []) as unknown as Row[];

  const abertas = disputes.filter((d) => d.status === "aberta" || d.status === "em_analise");

  return (
    <AppShell badge="Seravie Hub" nav={ADMIN_NAV} title="Disputas e reembolsos" subtitle={`${abertas.length} em aberto · ${disputes.length} no total`}>
      {sp.ok && <div className="mb-4 rounded-lg border border-forest-700 bg-forest-900/40 px-3 py-2 text-sm text-forest-200">Disputa atualizada.</div>}
      {sp.error && <div className="mb-4 rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">{decodeURIComponent(sp.error)}</div>}

      {disputes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-campo-border glass p-10 text-center text-stone-400">Nenhuma disputa registrada.</div>
      ) : (
        <div className="space-y-4">
          {disputes.map((d) => {
            const pending = d.status === "aberta" || d.status === "em_analise";
            const stripeRefundId = d.stripe_refund_id || d.order?.stripe_refund_id || null;
            const canRefund = Boolean(d.order?.stripe_payment_intent_id) && !stripeRefundId;
            return (
              <article key={d.id} className="glass rounded-2xl border border-campo-border p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-campo-border pb-3">
                  <div>
                    <p className="font-serif text-lg text-forest-100">{DISPUTE_REASON_LABEL[d.reason] ?? d.reason}</p>
                    <p className="text-xs text-stone-500">
                      Aberta por <strong className="text-stone-300">{d.opened_role}</strong> · {new Date(d.created_at).toLocaleString("pt-BR")}
                      {d.order ? ` · Pedido ${formatBRL(d.order.total_cents)} · pgto: ${d.order.payment_status}` : ""}
                    </p>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs ${DISPUTE_STATUS_STYLE[d.status as DisputeStatus]}`}>
                    {DISPUTE_STATUS_LABEL[d.status as DisputeStatus]}
                  </span>
                </div>
                {d.description && <p className="mt-3 text-sm text-stone-300">{d.description}</p>}
                <div className="mt-3 flex flex-wrap gap-2 text-[0.7rem] uppercase tracking-[0.12em] text-stone-500">
                  {d.order?.stripe_payment_intent_id && <span className="rounded-full border border-campo-border px-2.5 py-1">PaymentIntent salvo</span>}
                  {d.stripe_dispute_id && <span className="rounded-full border border-campo-border px-2.5 py-1">Disputa Stripe {compactId(d.stripe_dispute_id)}</span>}
                  {d.stripe_status && <span className="rounded-full border border-campo-border px-2.5 py-1">Stripe: {d.stripe_status}</span>}
                  {stripeRefundId && <span className="rounded-full border border-forest-700 px-2.5 py-1 text-forest-200">Refund {compactId(stripeRefundId)}</span>}
                  {d.refund_amount_cents != null && <span className="rounded-full border border-campo-border px-2.5 py-1">Reembolso {formatBRL(d.refund_amount_cents)}</span>}
                </div>
                {d.resolution_note && <p className="mt-2 text-xs text-stone-500">Resolução: {d.resolution_note}</p>}

                {pending && (
                  <form action={resolveDispute} className="mt-4 space-y-2 rounded-xl border border-campo-border bg-campo-surface2/50 p-3">
                    <input type="hidden" name="dispute_id" value={d.id} />
                    {!canRefund && !stripeRefundId && (
                      <p className="text-xs text-stone-500">Reembolso automático indisponível até o pedido ter um PaymentIntent Stripe registrado.</p>
                    )}
                    <textarea name="note" rows={2} placeholder="Nota da resolução (opcional)" className="w-full rounded-lg border border-campo-border bg-campo-bg px-3 py-2 text-sm text-stone-100 outline-none focus:border-gold" />
                    <div className="flex flex-wrap gap-2">
                      <button
                        name="decision"
                        value="reembolsar"
                        disabled={!canRefund}
                        className={`rounded-lg border border-forest-700 px-3 py-1.5 text-xs text-forest-200 transition ${canRefund ? "hover:bg-forest-900/40" : "cursor-not-allowed opacity-45"}`}
                      >
                        Reembolsar via Stripe
                      </button>
                      <button name="decision" value="encerrar" className="rounded-lg border border-stone-700 px-3 py-1.5 text-xs text-stone-300 transition hover:bg-stone-900/40">Encerrar sem reembolso</button>
                      <button name="decision" value="recusar" className="rounded-lg border border-red-900/50 px-3 py-1.5 text-xs text-red-300 transition hover:bg-red-950/40">Recusar</button>
                    </div>
                  </form>
                )}
              </article>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}

function compactId(value: string): string {
  return value.length > 18 ? `${value.slice(0, 10)}...${value.slice(-4)}` : value;
}
