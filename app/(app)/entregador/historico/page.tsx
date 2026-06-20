import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { AppShell, ENTREGADOR_NAV } from "@/components/AppShell";
import { formatBRL } from "@/lib/catalog";

type Row = { id: string; delivery_name: string | null; delivery_address: string | null; delivery_fee_cents: number; created_at: string };

export default async function HistoricoPage() {
  const { user, profile } = await requireRole("entregador");
  const supabase = await createClient();

  const { data } = await supabase
    .from("orders")
    .select("id, delivery_name, delivery_address, delivery_fee_cents, created_at")
    .eq("delivery_person_id", user.id)
    .eq("status", "entregue")
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as Row[];

  return (
    <AppShell badge="Entregador" nav={ENTREGADOR_NAV} userName={profile?.full_name ?? "Entregador"} title="Histórico" subtitle={`${rows.length} entrega(s) concluída(s)`}>
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-campo-border glass p-10 text-center text-stone-400">
          Nenhuma entrega concluída ainda.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((o) => (
            <article key={o.id} className="glass flex items-center justify-between rounded-2xl border border-campo-border p-4">
              <div>
                <p className="text-sm text-forest-100">{o.delivery_name || "Cliente"}</p>
                <p className="text-xs text-stone-500">{o.delivery_address || "—"} · {new Date(o.created_at).toLocaleDateString("pt-BR")}</p>
              </div>
              <span className="font-serif text-gold">{formatBRL(o.delivery_fee_cents)}</span>
            </article>
          ))}
        </div>
      )}
    </AppShell>
  );
}
