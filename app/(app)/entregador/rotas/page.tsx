import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { AppShell, ENTREGADOR_NAV } from "@/components/AppShell";
import { formatBRL } from "@/lib/catalog";

type Row = { id: string; delivery_name: string | null; delivery_address: string | null; delivery_phone: string | null; delivery_fee_cents: number; created_at: string };

export default async function RotasPage() {
  const { user, profile } = await requireRole("entregador");
  const supabase = await createClient();

  const { data } = await supabase.from("orders")
    .select("id, delivery_name, delivery_address, delivery_phone, delivery_fee_cents, created_at")
    .eq("delivery_person_id", user.id).eq("status", "saiu_entrega").order("created_at", { ascending: true });
  const rows = (data ?? []) as Row[];
  const ganho = rows.reduce((s, o) => s + o.delivery_fee_cents, 0);

  return (
    <AppShell badge="Entregador" nav={ENTREGADOR_NAV} userName={profile?.full_name ?? "Entregador"} title="Rotas e mapa" subtitle="Suas paradas de hoje, na ordem.">
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Card label="Paradas em rota" value={String(rows.length)} accent={rows.length > 0} />
        <Card label="A receber nesta rota" value={formatBRL(ganho)} accent />
      </div>
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-campo-border glass p-10 text-center text-stone-400">Você não tem entregas em rota. Aceite entregas na tela inicial.</div>
      ) : (
        <ol className="space-y-3">
          {rows.map((o, i) => {
            const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.delivery_address || "")}`;
            return (
              <li key={o.id} className="glass flex flex-wrap items-center gap-4 rounded-2xl border border-campo-border p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/15 font-serif text-gold">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-serif text-forest-100">{o.delivery_name || "Cliente"}</p>
                  <p className="text-sm text-stone-400">{o.delivery_address || "Endereço não informado"}</p>
                  {o.delivery_phone && <p className="text-xs text-stone-500">{o.delivery_phone}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-serif text-gold">{formatBRL(o.delivery_fee_cents)}</span>
                  {o.delivery_address && (
                    <a href={maps} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-gold/40 px-3 py-1.5 text-xs text-gold transition hover:bg-gold/10">Abrir no mapa</a>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </AppShell>
  );
}

function Card({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="glass rounded-2xl border border-campo-border p-5">
      <p className="text-xs uppercase tracking-wider text-stone-500">{label}</p>
      <p className={`mt-2 font-serif text-2xl ${accent ? "text-gold" : "text-forest-100"}`}>{value}</p>
    </div>
  );
}
