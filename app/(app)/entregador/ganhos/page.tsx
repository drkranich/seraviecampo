import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { AppShell, ENTREGADOR_NAV } from "@/components/AppShell";
import { AreaChart } from "@/components/charts";
import { formatBRL } from "@/lib/catalog";

type Row = { delivery_fee_cents: number; created_at: string };
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
  const total = rows.reduce((s, r) => s + r.delivery_fee_cents, 0);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const mes = rows.filter((r) => new Date(r.created_at) >= monthStart).reduce((s, r) => s + r.delivery_fee_cents, 0);

  const labels: string[] = [];
  const series: number[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = startOfDay(new Date(now)); d.setDate(d.getDate() - i);
    const next = new Date(d); next.setDate(next.getDate() + 1);
    labels.push(d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }));
    series.push(rows.filter((r) => { const rd = new Date(r.created_at); return rd >= d && rd < next; }).reduce((s, r) => s + r.delivery_fee_cents, 0) / 100);
  }

  return (
    <AppShell badge="Entregador" nav={ENTREGADOR_NAV} userName={profile?.full_name ?? "Entregador"} title="Ganhos" subtitle="Suas comissões de entrega.">
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Este mês" value={formatBRL(mes)} accent />
        <Stat label="Últimos 30 dias" value={formatBRL(total)} />
        <Stat label="Entregas (30d)" value={String(rows.length)} />
      </div>
      <section className="glass rounded-2xl border border-campo-border p-5">
        <h2 className="mb-4 font-serif text-lg text-forest-100">Ganhos por dia</h2>
        <AreaChart data={series} labels={labels} />
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
