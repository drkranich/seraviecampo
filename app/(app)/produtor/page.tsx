import Link from "next/link";
import { requireRole } from "@/lib/guard";
import { greeting } from "@/lib/greeting";
import { createClient } from "@/lib/supabase/server";
import { AppShell, PRODUTOR_NAV } from "@/components/AppShell";
import { Sparkline, AreaChart, Donut, type DonutSegment } from "@/components/charts";
import { formatBRL, CATEGORY_LABEL, type ProductCategory } from "@/lib/catalog";
import { ORDER_STATUS_LABEL, ORDER_STATUS_STYLE, type OrderStatus } from "@/lib/orders";

type ItemRow = { product_id: string | null; product_name: string; quantity: number; line_total_cents: number };
type OrderRow = {
  id: string; created_at: string; total_cents: number; status: OrderStatus;
  customer_id: string; delivery_name: string | null; items: ItemRow[];
};

const DONUT_COLORS = ["#6FA63F", "#4F7A35", "#9A9A66", "#C9BE93", "#C2A878", "#7CA049"];

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x; }

export default async function ProdutorPage() {
  const { user, profile } = await requireRole("produtor");
  const supabase = await createClient();

  const since = new Date(); since.setDate(since.getDate() - 60);

  const [{ data: ordersData }, { data: productsData }] = await Promise.all([
    supabase
      .from("orders")
      .select("id, created_at, total_cents, status, customer_id, delivery_name, items:order_items(product_id, product_name, quantity, line_total_cents)")
      .eq("producer_id", user.id)
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false }),
    supabase
      .from("products")
      .select("id, name, category, price_cents, available, production_status")
      .eq("producer_id", user.id),
  ]);

  const orders = (ordersData ?? []) as unknown as OrderRow[];
  const products = (productsData ?? []) as { id: string; name: string; category: ProductCategory }[];
  const valid = orders.filter((o) => o.status !== "cancelado");

  // Janelas: mês atual vs mês anterior
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const inThis = (o: OrderRow) => new Date(o.created_at) >= monthStart;
  const inPrev = (o: OrderRow) => { const d = new Date(o.created_at); return d >= prevStart && d < monthStart; };

  const sum = (arr: OrderRow[]) => arr.reduce((s, o) => s + o.total_cents, 0);
  const fatThis = sum(valid.filter(inThis));
  const fatPrev = sum(valid.filter(inPrev));
  const pedThis = valid.filter(inThis).length;
  const pedPrev = valid.filter(inPrev).length;
  const cliThis = new Set(valid.filter(inThis).map((o) => o.customer_id)).size;
  const cliPrev = new Set(valid.filter(inPrev).map((o) => o.customer_id)).size;
  const ticThis = pedThis ? Math.round(fatThis / pedThis) : 0;
  const ticPrev = pedPrev ? Math.round(fatPrev / pedPrev) : 0;

  const delta = (a: number, b: number) => (b > 0 ? Math.round(((a - b) / b) * 100) : a > 0 ? 100 : 0);

  // Série diária (14 dias) de faturamento e pedidos
  const days = 14;
  const dayKeys: string[] = [];
  const fatSeries: number[] = [];
  const pedSeries: number[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = startOfDay(new Date(now)); d.setDate(d.getDate() - i);
    const next = new Date(d); next.setDate(next.getDate() + 1);
    const dayOrders = valid.filter((o) => { const od = new Date(o.created_at); return od >= d && od < next; });
    dayKeys.push(d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }));
    fatSeries.push(dayOrders.reduce((s, o) => s + o.total_cents, 0) / 100);
    pedSeries.push(dayOrders.length);
  }

  // Produtos mais vendidos
  const sellMap = new Map<string, { name: string; qty: number; revenue: number; pid: string | null }>();
  for (const o of valid) for (const it of o.items) {
    const key = it.product_name;
    const cur = sellMap.get(key) ?? { name: it.product_name, qty: 0, revenue: 0, pid: it.product_id };
    cur.qty += Number(it.quantity); cur.revenue += it.line_total_cents;
    sellMap.set(key, cur);
  }
  const bestSellers = [...sellMap.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  // Vendas por categoria (donut)
  const catOf = new Map(products.map((p) => [p.id, p.category]));
  const catMap = new Map<ProductCategory, number>();
  for (const o of valid) for (const it of o.items) {
    const cat = (it.product_id && catOf.get(it.product_id)) || "outros";
    catMap.set(cat as ProductCategory, (catMap.get(cat as ProductCategory) ?? 0) + it.line_total_cents);
  }
  const donutSegs: DonutSegment[] = [...catMap.entries()]
    .sort((a, b) => b[1] - a[1]).slice(0, 6)
    .map(([cat, v], i) => ({ value: Math.round(v / 100), color: DONUT_COLORS[i % DONUT_COLORS.length], label: CATEGORY_LABEL[cat] }));

  const recent = orders.slice(0, 5);
  const firstName = profile?.full_name?.split(" ")[0] || "Produtor";

  return (
    <AppShell
      badge="Produtor Rural"
      nav={PRODUTOR_NAV}
      userName={profile?.full_name ?? "Produtor"}
      profileHref="/produtor/perfil"
      title={greeting(profile?.full_name)}
      subtitle="Aqui está o resumo da sua operação gourmet de hoje."
    >
      {/* Métricas */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon="cash" label="Faturamento (mês)" value={formatBRL(fatThis)} delta={delta(fatThis, fatPrev)} series={fatSeries} />
        <Metric icon="bag" label="Pedidos (mês)" value={String(pedThis)} delta={delta(pedThis, pedPrev)} series={pedSeries} />
        <Metric icon="users" label="Clientes ativos" value={String(cliThis)} delta={delta(cliThis, cliPrev)} series={pedSeries} />
        <Metric icon="cart" label="Ticket médio" value={formatBRL(ticThis)} delta={delta(ticThis, ticPrev)} series={fatSeries} />
      </div>

      {/* Vendas + Próximas entregas */}
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <section className="glass rounded-2xl border border-campo-border p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-lg text-forest-100">Desempenho de vendas</h2>
            <span className="rounded-lg border border-campo-border px-3 py-1 text-xs text-stone-400">Últimos 14 dias</span>
          </div>
          <AreaChart data={fatSeries} labels={dayKeys} />
        </section>

        <section className="glass rounded-2xl border border-campo-border p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-lg text-forest-100">Pedidos recentes</h2>
            <Link href="/produtor/pedidos" className="text-xs text-gold hover:underline">Ver todos</Link>
          </div>
          {recent.length === 0 ? (
            <p className="py-8 text-center text-sm text-stone-500">Nenhum pedido ainda.</p>
          ) : (
            <ul className="space-y-3">
              {recent.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-forest-100">{o.delivery_name || "Cliente"}</p>
                    <p className="text-xs text-stone-500">{new Date(o.created_at).toLocaleDateString("pt-BR")} · {formatBRL(o.total_cents)}</p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[0.65rem] ${ORDER_STATUS_STYLE[o.status]}`}>
                    {ORDER_STATUS_LABEL[o.status]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Mais vendidos + Categorias */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="glass rounded-2xl border border-campo-border p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-lg text-forest-100">Produtos mais vendidos</h2>
            <Link href="/produtor/produtos" className="text-xs text-gold hover:underline">Ver catálogo</Link>
          </div>
          {bestSellers.length === 0 ? (
            <p className="py-8 text-center text-sm text-stone-500">Sem vendas registradas ainda.</p>
          ) : (
            <ul className="space-y-3">
              {bestSellers.map((b) => (
                <li key={b.name} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-forest-100">{b.name}</p>
                    <p className="text-xs text-stone-500">{b.qty} un. vendidas</p>
                  </div>
                  <span className="text-sm text-gold">{formatBRL(b.revenue)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="glass rounded-2xl border border-campo-border p-5">
          <h2 className="mb-4 font-serif text-lg text-forest-100">Vendas por categoria</h2>
          {donutSegs.length === 0 ? (
            <p className="py-8 text-center text-sm text-stone-500">Sem dados de vendas ainda.</p>
          ) : (
            <Donut segments={donutSegs} centerTop={String(donutSegs.reduce((s, x) => s + x.value, 0))} centerBottom="em R$" />
          )}
        </section>
      </div>
    </AppShell>
  );
}

function Metric({
  icon, label, value, delta, series,
}: {
  icon: "cash" | "bag" | "users" | "cart";
  label: string; value: string; delta: number; series: number[];
}) {
  const up = delta >= 0;
  return (
    <article className="glass rounded-2xl border border-campo-border p-5">
      <div className="flex items-start justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/40 text-gold">
          <MetricGlyph name={icon} />
        </span>
        <Sparkline data={series} />
      </div>
      <p className="mt-4 text-xs uppercase tracking-wider text-stone-500">{label}</p>
      <p className="mt-1 font-serif text-2xl text-forest-100">{value}</p>
      <p className="mt-1 text-xs">
        <span className={up ? "text-leaf" : "text-flame"}>{up ? "▲" : "▼"} {Math.abs(delta)}%</span>
        <span className="text-stone-500"> vs mês anterior</span>
      </p>
    </article>
  );
}

function MetricGlyph({ name }: { name: "cash" | "bag" | "users" | "cart" }) {
  const c = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "cash") return <svg {...c}><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /></svg>;
  if (name === "bag") return <svg {...c}><path d="M6 7h12l1 13H5z" /><path d="M9 7a3 3 0 016 0" /></svg>;
  if (name === "users") return <svg {...c}><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3 3-5 6-5s6 2 6 5" /><path d="M16 6a3 3 0 010 6" /></svg>;
  return <svg {...c}><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /><path d="M2 3h3l2.5 13h11L21 7H6" /></svg>;
}
