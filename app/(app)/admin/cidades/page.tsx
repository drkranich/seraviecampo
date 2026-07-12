import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { AppShell, ADMIN_NAV } from "@/components/AppShell";

type Prof = { role: string; city: string | null; state: string | null };

export default async function CidadesPage() {
  const { profile } = await requireRole("super_admin");
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("role, city, state");
  const profs = (data ?? []) as Prof[];

  const map = new Map<string, { city: string; produtores: number; clientes: number; entregadores: number }>();
  for (const p of profs) {
    const key = [p.city, p.state].filter(Boolean).join(", ") || "Sem cidade";
    const cur = map.get(key) ?? { city: key, produtores: 0, clientes: 0, entregadores: 0 };
    if (p.role === "produtor") cur.produtores++;
    else if (p.role === "cliente") cur.clientes++;
    else if (p.role === "entregador") cur.entregadores++;
    map.set(key, cur);
  }
  const cities = [...map.values()].sort((a, b) => (b.produtores + b.clientes + b.entregadores) - (a.produtores + a.clientes + a.entregadores));

  return (
    <AppShell badge="Seravie Hub" nav={ADMIN_NAV} userName={profile?.full_name ?? "Administrador"} title="Cidades" subtitle={`${cities.length} localidade(s) ativas`}>
      {cities.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-campo-border glass p-10 text-center text-stone-400">Sem dados de cidade ainda.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cities.map((c) => (
            <article key={c.city} className="glass rounded-2xl border border-campo-border p-5">
              <h3 className="font-serif text-lg text-forest-100">📍 {c.city}</h3>
              <div className="mt-3 flex gap-4 text-sm">
                <span className="text-leaf">🌾 {c.produtores}</span>
                <span className="text-gold">👥 {c.clientes}</span>
                <span className="text-leaf-light">🛵 {c.entregadores}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </AppShell>
  );
}
