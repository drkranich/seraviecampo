import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { AppShell, PRODUTOR_NAV } from "@/components/AppShell";
import { formatBRL } from "@/lib/catalog";

type Ord = { customer_id: string; total_cents: number; status: string; created_at: string };

export default async function ClientesProdutorPage() {
  const { user, profile } = await requireRole("produtor");
  const supabase = await createClient();

  const { data } = await supabase.from("orders").select("customer_id, total_cents, status, created_at").eq("producer_id", user.id);
  const orders = (data ?? []) as Ord[];
  const valid = orders.filter((o) => o.status !== "cancelado");

  const agg = new Map<string, { count: number; total: number; last: string }>();
  for (const o of valid) {
    const cur = agg.get(o.customer_id) ?? { count: 0, total: 0, last: o.created_at };
    cur.count++; cur.total += o.total_cents;
    if (new Date(o.created_at) > new Date(cur.last)) cur.last = o.created_at;
    agg.set(o.customer_id, cur);
  }
  const ids = [...agg.keys()];
  const { data: profs } = await supabase.from("profiles").select("id, full_name, display_name, city, state").in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
  const pmap = new Map((profs ?? []).map((p) => [p.id as string, p]));
  const rows = [...agg.entries()].map(([id, v]) => ({ id, ...v, p: pmap.get(id) })).sort((a, b) => b.total - a.total);

  const totalFat = rows.reduce((s, r) => s + r.total, 0);

  return (
    <AppShell badge="Produtor Rural" nav={PRODUTOR_NAV} userName={profile?.full_name ?? "Produtor"} profileHref="/produtor/perfil" title="Meus clientes" subtitle={`${rows.length} cliente(s) · ${formatBRL(totalFat)} em compras`}>
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-campo-border glass p-10 text-center text-stone-400">Ainda não há clientes. Quando alguém comprar, aparece aqui.</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-campo-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-campo-surface2 text-xs uppercase tracking-wider text-stone-500">
              <tr><th className="px-4 py-3">Cliente</th><th className="px-4 py-3">Local</th><th className="px-4 py-3">Pedidos</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Último</th></tr>
            </thead>
            <tbody className="divide-y divide-campo-border glass">
              {rows.map((r) => {
                const pp = r.p as { full_name?: string|null; display_name?: string|null; city?: string|null; state?: string|null } | undefined;
                return (
                  <tr key={r.id} className="transition hover:bg-campo-surface2">
                    <td className="px-4 py-3 text-forest-100">{pp?.full_name || pp?.display_name || "Cliente"}</td>
                    <td className="px-4 py-3 text-stone-400">{[pp?.city, pp?.state].filter(Boolean).join(", ") || "—"}</td>
                    <td className="px-4 py-3 text-stone-300">{r.count}</td>
                    <td className="px-4 py-3 text-gold">{formatBRL(r.total)}</td>
                    <td className="px-4 py-3 text-stone-500">{new Date(r.last).toLocaleDateString("pt-BR")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
