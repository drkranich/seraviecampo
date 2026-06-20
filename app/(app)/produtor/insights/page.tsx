import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { AppShell, PRODUTOR_NAV } from "@/components/AppShell";
import { AreaChart, Donut, type DonutSegment } from "@/components/charts";
import { formatBRL, CATEGORY_LABEL, type ProductCategory } from "@/lib/catalog";

const DONUT_COLORS = ["#6FA63F", "#4F7A35", "#9A9A66", "#C9BE93", "#C2A878", "#7CA049"];
type ItemRow = { product_id: string | null; product_name: string; quantity: number; line_total_cents: number };
type OrderRow = { id: string; created_at: string; total_cents: number; status: string; items: ItemRow[] };

export default async function InsightsPage() {
  const { user, profile } = await requireRole("produtor");
  const supabase = await createClient();
  const since = new Date(); since.setDate(since.getDate() - 60);

  const [{ data: od }, { data: pd }] = await Promise.all([
    supabase.from("orders").select("id, created_at, total_cents, status, items:order_items(product_id, product_name, quantity, line_total_cents)").eq("producer_id", user.id).gte("created_at", since.toISOString()),
    supabase.from("products").select("id, category").eq("producer_id", user.id),
  ]);
  const orders = ((od ?? []) as unknown as OrderRow[]).filter((o) => o.status !== "cancelado");
  const catOf = new Map(((pd ?? []) as { id: string; category: ProductCategory }[]).map((p) => [p.id, p.category]));

  const fat = orders.reduce((s, o) => s + o.total_cents, 0);
  const ticket = orders.length ? Math.round(fat / orders.length) : 0;

  const now = new Date();
  const labels: string[] = []; const serie: number[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now); d.setHours(0,0,0,0); d.setDate(d.getDate() - i);
    const nx = new Date(d); nx.setDate(nx.getDate() + 1);
    labels.push(d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }));
    serie.push(orders.filter((o) => { const t = new Date(o.created_at); return t >= d && t < nx; }).reduce((s, o) => s + o.total_cents, 0) / 100);
  }

  const sell = new Map<string, { qty: number; rev: number }>();
  const catMap = new Map<ProductCategory, number>();
  for (const o of orders) for (const it of o.items) {
    const cur = sell.get(it.product_name) ?? { qty: 0, rev: 0 };
    cur.qty += Number(it.quantity); cur.rev += it.line_total_cents; sell.set(it.product_name, cur);
    const cat = (it.product_id && catOf.get(it.product_id)) || "outros";
    catMap.set(cat as ProductCategory, (catMap.get(cat as ProductCategory) ?? 0) + it.line_total_cents);
  }
  const top = [...sell.entries()].sort((a, b) => b[1].rev - a[1].rev).slice(0, 5);
  const donut: DonutSegment[] = [...catMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)
    .map(([c, v], i) => ({ value: Math.round(v / 100), color: DONUT_COLORS[i % DONUT_COLORS.length], label: CATEGORY_LABEL[c] }));

  return (
    <AppShell badge="Produtor Rural" nav={PRODUTOR_NAV} userName={profile?.full_name ?? "Produtor"} profileHref="/produtor/perfil" title="Insights" subtitle="O que os números dizem sobre os últimos 60 dias.">
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card label="Faturamento (60d)" value={formatBRL(fat)} accent />
        <Card label="Pedidos (60d)" value={String(orders.length)} />
        <Card label="Ticket médio" value={formatBRL(ticket)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="glass rounded-2xl border border-campo-border p-5 lg:col-span-2">
          <h2 className="mb-4 font-serif text-lg text-forest-100">Vendas — últimos 14 dias</h2>
          <AreaChart data={serie} labels={labels} />
        </section>
        <section className="glass rounded-2xl border border-campo-border p-5">
          <h2 className="mb-4 font-serif text-lg text-forest-100">Por categoria</h2>
          {donut.length === 0 ? <p className="text-sm text-stone-500">Sem vendas ainda.</p> : <Donut segments={donut} centerTop={formatBRL(fat)} centerBottom="60 dias" />}
        </section>
      </div>

      <section className="glass mt-4 rounded-2xl border border-campo-border p-5">
        <h2 className="mb-4 font-serif text-lg text-forest-100">Produtos mais vendidos</h2>
        {top.length === 0 ? (
          <p className="text-sm text-stone-500">Nenhuma venda no período.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {top.map(([name, v]) => (
              <li key={name} className="flex items-center justify-between border-b border-campo-border pb-2">
                <span className="text-stone-200">{name} <span className="text-stone-500">· {v.qty} un.</span></span>
                <span className="text-gold">{formatBRL(v.rev)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
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
