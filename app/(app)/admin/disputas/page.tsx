import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { AppShell, ADMIN_NAV } from "@/components/AppShell";
import { formatBRL } from "@/lib/catalog";
import { DISPUTE_STATUS_LABEL, DISPUTE_STATUS_STYLE, DISPUTE_REASON_LABEL, type Dispute, type DisputeStatus } from "@/lib/disputes";
import { resolveDispute } from "@/lib/actions/disputes";

type Row = Dispute & {
  order: { id: string; total_cents: number; payment_status: string; status: string; customer_id: string; producer_id: string } | null;
};

export default async function AdminDisputasPage({
  searchParams,
}: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  await requireRole("super_admin");
  const sp = await searchParams;
  const supabase = await createClient();

  const { data } = await supabase
    .from("disputes")
    .select("*, order:orders(id, total_cents, payment_status, status, customer_id, producer_id)")
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
                {d.resolution_note && <p className="mt-2 text-xs text-stone-500">Resolução: {d.resolution_note}</p>}

                {pending && (
                  <form action={resolveDispute} className="mt-4 space-y-2 rounded-xl border border-campo-border bg-campo-surface2/50 p-3">
                    <input type="hidden" name="dispute_id" value={d.id} />
                    <textarea name="note" rows={2} placeholder="Nota da resolução (opcional)" className="w-full rounded-lg border border-campo-border bg-campo-bg px-3 py-2 text-sm text-stone-100 outline-none focus:border-gold" />
                    <div className="flex flex-wrap gap-2">
                      <button name="decision" value="reembolsar" className="rounded-lg border border-forest-700 px-3 py-1.5 text-xs text-forest-200 transition hover:bg-forest-900/40">Reembolsar cliente</button>
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
