import Link from "next/link";
import { requireRole } from "@/lib/guard";
import { greeting } from "@/lib/greeting";
import { createClient } from "@/lib/supabase/server";
import { AppShell, ADMIN_NAV } from "@/components/AppShell";
import { AreaChart } from "@/components/charts";
import { formatBRL } from "@/lib/catalog";

type Prof = { id: string; role: string; full_name: string | null; farm_name: string | null; city: string | null; verification_status: string; created_at: string };
type Ord = { producer_id: string; total_cents: number; status: string; created_at: string; delivery_name: string | null };

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x; }

export default async function AdminPage() {
  const { profile } = await requireRole("super_admin");
  const supabase = await createClient();

  const since = new Date(); since.setDate(since.getDate() - 60);
  const [{ data: profsData }, { data: ordsData }] = await Promise.all([
    supabase.from("profiles").select("id, role, full_name, farm_name, city, verification_status, created_at"),
    supabase.from("orders").select("producer_id, total_cents, status, created_at, delivery_name").gte("created_at", since.toISOString()),
  ]);

  const profs = (profsData ?? []) as Prof[];
  const orders = (ordsData ?? []) as Ord[];
  const valid = orders.filter((o) => o.status !== "cancelado");

  const producers = profs.filter((p) => p.role === "produtor");
  const clients = profs.filter((p) => p.role === "cliente");
  const deliverers = profs.filter((p) => p.role === "entregador");
  const cities = new Set(profs.map((p) => p.city).filter(Boolean)).size;
  const pending = profs.filter((p) => (p.role === "produtor" || p.role === "entregador") && (p.verification_status === "pendente" || p.verification_status === "em_analise")).length;

  const gmv = valid.reduce((s, o) => s + o.total_cents, 0);
  const orderCount = valid.length;

  // Série diária de GMV (14 dias)
  const now = new Date();
  const dayKeys: string[] = [];
  const gmvSeries: number[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = startOfDay(new Date(now)); d.setDate(d.getDate() - i);
    const next = new Date(d); next.setDate(next.getDate() + 1);
    const dd = valid.filter((o) => { const od = new Date(o.created_at); return od >= d && od < next; });
    dayKeys.push(d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }));
    gmvSeries.push(dd.reduce((s, o) => s + o.total_cents, 0) / 100);
  }

  // Ranking de produtores por receita
  const nameOf = new Map(producers.map((p) => [p.id, p.farm_name || p.full_name || "Produtor"]));
  const revMap = new Map<string, number>();
  for (const o of valid) revMap.set(o.producer_id, (revMap.get(o.producer_id) ?? 0) + o.total_cents);
  const ranking = [...revMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Atividades recentes (novos cadastros)
  const recentUsers = [...profs].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 6);

  return (
    <AppShell badge="Seravie Hub" nav={ADMIN_NAV} userName={profile?.full_name ?? "Administrador"} title={greeting(profile?.full_name)} subtitle="Você enxerga o ecossistema inteiro.">
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="GMV (60 dias)" value={formatBRL(gmv)} accent />
        <Stat label="Pedidos" value={String(orderCount)} />
        <Stat label="Produtores" value={String(producers.length)} />
        <Stat label="Clientes" value={String(clients.length)} />
        <Stat label="Entregadores" value={String(deliverers.length)} />
        <Stat label="Cidades" value={String(cities)} />
        <Stat label="Aprovações pendentes" value={String(pending)} warn={pending > 0} />
        <Stat label="Usuários" value={String(profs.length)} />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <section className="glass rounded-2xl border border-campo-border p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-lg text-forest-100">Volume negociado (GMV)</h2>
            <span className="rounded-lg border border-campo-border px-3 py-1 text-xs text-stone-400">Últimos 14 dias</span>
          </div>
          <AreaChart data={gmvSeries} labels={dayKeys} />
        </section>

        <section className="glass rounded-2xl border border-campo-border p-5">
          <h2 className="mb-4 font-serif text-lg text-forest-100">Ranking de produtores</h2>
          {ranking.length === 0 ? (
            <p className="py-6 text-center text-sm text-stone-500">Sem vendas ainda.</p>
          ) : (
            <ul className="space-y-3">
              {ranking.map(([pid, rev], i) => (
                <li key={pid} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-forest-100">
                    <span className="text-stone-500">{i + 1}.</span> {nameOf.get(pid) ?? "Produtor"}
                  </span>
                  <span className="text-sm text-gold">{formatBRL(rev)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="glass rounded-2xl border border-campo-border p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-lg text-forest-100">Cadastros recentes</h2>
          <Link href="/admin/usuarios" className="text-xs text-gold hover:underline">Ver todos</Link>
        </div>
        <ul className="divide-y divide-campo-border">
          {recentUsers.map((u) => (
            <li key={u.id} className="flex items-center justify-between py-2.5">
              <div>
                <p className="text-sm text-forest-100">{u.full_name || "—"}</p>
                <p className="text-xs text-stone-500">{u.role} · {u.city || "—"}</p>
              </div>
              <span className="text-xs text-stone-500">{new Date(u.created_at).toLocaleDateString("pt-BR")}</span>
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}

function Stat({ label, value, accent, warn }: { label: string; value: string; accent?: boolean; warn?: boolean }) {
  return (
    <div className="glass rounded-2xl border border-campo-border p-5">
      <p className="text-xs uppercase tracking-wider text-stone-500">{label}</p>
      <p className={`mt-2 font-serif text-2xl ${warn ? "text-flame" : accent ? "text-gold" : "text-forest-100"}`}>{value}</p>
    </div>
  );
}
