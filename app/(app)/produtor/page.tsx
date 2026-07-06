import Link from "next/link";
import { requireRole } from "@/lib/guard";
import { greeting } from "@/lib/greeting";
import { createClient } from "@/lib/supabase/server";
import { AppShell, PRODUTOR_NAV } from "@/components/AppShell";
import { PanelNotice } from "@/components/PanelNotice";
import { Sparkline, AreaChart, Donut, type DonutSegment } from "@/components/charts";
import { formatBRL, CATEGORY_LABEL, type ProductCategory, type ProductionStatus } from "@/lib/catalog";
import { ORDER_STATUS_LABEL, ORDER_STATUS_STYLE, type OrderStatus } from "@/lib/orders";
import { RES_STATUS_LABEL, RES_STATUS_STYLE, type Reservation, type ReservationStatus } from "@/lib/reservations";
import { EXP_STATUS_LABEL, EXP_STATUS_STYLE, type Experience, type ExperienceBooking } from "@/lib/experiences";

type ItemRow = { product_id: string | null; product_name: string; quantity: number; line_total_cents: number };
type OrderRow = {
  id: string;
  created_at: string;
  total_cents: number;
  status: OrderStatus;
  customer_id: string;
  delivery_name: string | null;
  items: ItemRow[];
};
type DashboardProduct = {
  id: string;
  name: string;
  category: ProductCategory;
  price_cents: number;
  available: boolean;
  production_status: ProductionStatus;
  stock: number;
  available_from: string | null;
  archived: boolean;
};

const DONUT_COLORS = ["#6FA63F", "#4F7A35", "#9A9A66", "#C9BE93", "#C2A878", "#7CA049"];

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export default async function ProdutorPage() {
  const { user, profile } = await requireRole("produtor");
  const supabase = await createClient();

  const since = new Date();
  since.setDate(since.getDate() - 60);

  const [{ data: ordersData }, { data: productsData }, { data: reservationsData }, { data: experiencesData }, { data: bookingsData }] =
    await Promise.all([
      supabase
        .from("orders")
        .select("id, created_at, total_cents, status, customer_id, delivery_name, items:order_items(product_id, product_name, quantity, line_total_cents)")
        .eq("producer_id", user.id)
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: false }),
      supabase
        .from("products")
        .select("id, name, category, price_cents, available, production_status, stock, available_from, archived")
        .eq("producer_id", user.id),
      supabase
        .from("harvest_reservations")
        .select("*")
        .eq("producer_id", user.id)
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("experiences")
        .select("id, title, active, archived")
        .eq("producer_id", user.id),
      supabase
        .from("experience_bookings")
        .select("*")
        .eq("producer_id", user.id)
        .order("date", { ascending: true })
        .limit(8),
    ]);

  const orders = (ordersData ?? []) as unknown as OrderRow[];
  const products = (productsData ?? []) as DashboardProduct[];
  const reservations = (reservationsData ?? []) as Reservation[];
  const experiences = (experiencesData ?? []) as Pick<Experience, "id" | "title" | "active" | "archived">[];
  const bookings = (bookingsData ?? []) as ExperienceBooking[];
  const valid = orders.filter((order) => order.status !== "cancelado");

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const inThis = (order: OrderRow) => new Date(order.created_at) >= monthStart;
  const inPrev = (order: OrderRow) => {
    const date = new Date(order.created_at);
    return date >= prevStart && date < monthStart;
  };

  const sum = (rows: OrderRow[]) => rows.reduce((total, order) => total + order.total_cents, 0);
  const fatThis = sum(valid.filter(inThis));
  const fatPrev = sum(valid.filter(inPrev));
  const pedThis = valid.filter(inThis).length;
  const pedPrev = valid.filter(inPrev).length;
  const cliThis = new Set(valid.filter(inThis).map((order) => order.customer_id)).size;
  const cliPrev = new Set(valid.filter(inPrev).map((order) => order.customer_id)).size;
  const ticThis = pedThis ? Math.round(fatThis / pedThis) : 0;
  const ticPrev = pedPrev ? Math.round(fatPrev / pedPrev) : 0;
  const delta = (a: number, b: number) => (b > 0 ? Math.round(((a - b) / b) * 100) : a > 0 ? 100 : 0);

  const dayKeys: string[] = [];
  const fatSeries: number[] = [];
  const pedSeries: number[] = [];
  for (let i = 13; i >= 0; i--) {
    const date = startOfDay(new Date(now));
    date.setDate(date.getDate() - i);
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    const dayOrders = valid.filter((order) => {
      const orderDate = new Date(order.created_at);
      return orderDate >= date && orderDate < next;
    });
    dayKeys.push(date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }));
    fatSeries.push(dayOrders.reduce((total, order) => total + order.total_cents, 0) / 100);
    pedSeries.push(dayOrders.length);
  }

  const sellMap = new Map<string, { name: string; qty: number; revenue: number; pid: string | null }>();
  for (const order of valid) {
    for (const item of order.items) {
      const cur = sellMap.get(item.product_name) ?? { name: item.product_name, qty: 0, revenue: 0, pid: item.product_id };
      cur.qty += Number(item.quantity);
      cur.revenue += item.line_total_cents;
      sellMap.set(item.product_name, cur);
    }
  }
  const bestSellers = [...sellMap.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  const catOf = new Map(products.map((product) => [product.id, product.category]));
  const catMap = new Map<ProductCategory, number>();
  for (const order of valid) {
    for (const item of order.items) {
      const cat = (item.product_id && catOf.get(item.product_id)) || "outros";
      catMap.set(cat as ProductCategory, (catMap.get(cat as ProductCategory) ?? 0) + item.line_total_cents);
    }
  }
  const donutSegs: DonutSegment[] = [...catMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([cat, value], index) => ({ value: Math.round(value / 100), color: DONUT_COLORS[index % DONUT_COLORS.length], label: CATEGORY_LABEL[cat] }));

  const recent = orders.slice(0, 5);
  const pendingOrders = orders.filter((order) => order.status === "novo" || order.status === "preparando");
  const pendingReservations = reservations.filter((reservation) => reservation.status === "reservado");
  const activeReservations = reservations.filter((reservation) => reservation.status === "reservado" || reservation.status === "confirmado");
  const activeProducts = products.filter((product) => !product.archived && product.available);
  const drafts = products.filter((product) => !product.archived && !product.available);
  const futureProducts = products.filter((product) => !product.archived && (product.production_status === "reservado" || product.available_from));
  const lowStock = activeProducts.filter((product) => Number(product.stock ?? 0) <= 3).slice(0, 4);
  const activeExperiences = experiences.filter((experience) => !experience.archived && experience.active);
  const upcomingBookings = bookings
    .filter((booking) => booking.status !== "cancelado" && booking.status !== "concluido" && new Date(`${booking.date}T${booking.time || "00:00"}`) >= now)
    .slice(0, 4);
  const experienceName = new Map(experiences.map((experience) => [experience.id, experience.title]));

  return (
    <AppShell
      badge="Produtor Rural"
      nav={PRODUTOR_NAV}
      userName={profile?.full_name ?? "Produtor"}
      profileHref="/produtor/perfil"
      title={greeting(profile?.full_name)}
      subtitle="Resumo da operação: vendas, catálogo, colheitas reservadas e experiências."
    >
      <PanelNotice role="produtor" />

      <section className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="glass rounded-2xl border border-campo-border p-6 lg:col-span-2">
          <p className="text-xs uppercase tracking-wider text-gold">Central do fornecedor</p>
          <h2 className="mt-2 max-w-2xl font-serif text-3xl text-forest-100">Acompanhe o que precisa de ação hoje.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-400">
            Pedidos novos, reservas de colheita, estoque, vitrine e experiências aparecem juntos para facilitar a rotina.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <ActionTile href="/produtor/pedidos" label="Pedidos" value={String(pendingOrders.length)} />
            <ActionTile href="/produtor/reservas" label="Reservas" value={String(pendingReservations.length)} />
            <ActionTile href="/produtor/produtos" label="Catálogo ativo" value={String(activeProducts.length)} />
            <ActionTile href="/produtor/experiencias" label="Experiências" value={String(activeExperiences.length)} />
          </div>
        </div>

        <aside className="glass rounded-2xl border border-campo-border p-6">
          <p className="text-xs uppercase tracking-wider text-stone-500">Próxima decisão</p>
          {pendingOrders.length > 0 ? (
            <>
              <h3 className="mt-2 font-serif text-xl text-forest-100">Há pedido aguardando ação</h3>
              <p className="mt-2 text-sm text-stone-400">Priorize o preparo para manter a experiência do cliente dentro do prazo.</p>
              <Link href="/produtor/pedidos" className="mt-4 inline-block rounded-lg bg-gold px-4 py-2 text-sm font-medium text-campo-bg transition hover:bg-gold-light">Ver pedidos</Link>
            </>
          ) : pendingReservations.length > 0 ? (
            <>
              <h3 className="mt-2 font-serif text-xl text-forest-100">Confirme pré-colheitas</h3>
              <p className="mt-2 text-sm text-stone-400">Reservas antecipadas precisam de resposta para virar compromisso de compra.</p>
              <Link href="/produtor/reservas" className="mt-4 inline-block rounded-lg bg-gold px-4 py-2 text-sm font-medium text-campo-bg transition hover:bg-gold-light">Ver reservas</Link>
            </>
          ) : lowStock.length > 0 ? (
            <>
              <h3 className="mt-2 font-serif text-xl text-forest-100">Revise o estoque baixo</h3>
              <p className="mt-2 text-sm text-stone-400">Alguns produtos publicados estão perto de zerar.</p>
              <Link href="/produtor/produtos" className="mt-4 inline-block rounded-lg border border-campo-border px-4 py-2 text-sm text-stone-200 transition hover:border-gold/50">Abrir catálogo</Link>
            </>
          ) : (
            <>
              <h3 className="mt-2 font-serif text-xl text-forest-100">Pronto para crescer a vitrine</h3>
              <p className="mt-2 text-sm text-stone-400">Inclua uma experiência ou uma pré-colheita para aumentar recorrência.</p>
              <Link href="/produtor/experiencias/nova" className="mt-4 inline-block rounded-lg bg-gold px-4 py-2 text-sm font-medium text-campo-bg transition hover:bg-gold-light">Criar experiência</Link>
            </>
          )}
        </aside>
      </section>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon="cash" label="Faturamento (mês)" value={formatBRL(fatThis)} delta={delta(fatThis, fatPrev)} series={fatSeries} />
        <Metric icon="bag" label="Pedidos (mês)" value={String(pedThis)} delta={delta(pedThis, pedPrev)} series={pedSeries} />
        <Metric icon="users" label="Clientes ativos" value={String(cliThis)} delta={delta(cliThis, cliPrev)} series={pedSeries} />
        <Metric icon="cart" label="Ticket médio" value={formatBRL(ticThis)} delta={delta(ticThis, ticPrev)} series={fatSeries} />
      </div>

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
              {recent.map((order) => (
                <li key={order.id} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-forest-100">{order.delivery_name || "Cliente"}</p>
                    <p className="text-xs text-stone-500">{new Date(order.created_at).toLocaleDateString("pt-BR")} · {formatBRL(order.total_cents)}</p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[0.65rem] ${ORDER_STATUS_STYLE[order.status]}`}>
                    {ORDER_STATUS_LABEL[order.status]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <section className="glass rounded-2xl border border-campo-border p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-lg text-forest-100">Saúde da vitrine</h2>
            <Link href="/produtor/produtos" className="text-xs text-gold hover:underline">Gerenciar</Link>
          </div>
          <div className="space-y-2">
            <HealthRow label="Produtos publicados" value={String(activeProducts.length)} />
            <HealthRow label="Rascunhos" value={String(drafts.length)} muted={drafts.length === 0} />
            <HealthRow label="Pré-colheitas ativas" value={String(futureProducts.length)} />
            <HealthRow label="Estoque baixo" value={String(lowStock.length)} warn={lowStock.length > 0} />
          </div>
          {lowStock.length > 0 && (
            <div className="mt-4 rounded-lg border border-gold/30 bg-gold/5 p-3">
              <p className="text-xs uppercase tracking-wider text-gold">Repor ou pausar</p>
              <p className="mt-1 text-sm text-stone-300">{lowStock.map((product) => product.name).join(", ")}</p>
            </div>
          )}
        </section>

        <section className="glass rounded-2xl border border-campo-border p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-lg text-forest-100">Reservas de colheita</h2>
            <Link href="/produtor/reservas" className="text-xs text-gold hover:underline">Ver todas</Link>
          </div>
          {activeReservations.length === 0 ? (
            <p className="py-8 text-center text-sm text-stone-500">Nenhuma reserva ativa.</p>
          ) : (
            <ul className="space-y-3">
              {activeReservations.slice(0, 4).map((reservation) => (
                <li key={reservation.id} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-forest-100">Qtd. {reservation.quantity}</p>
                    <p className="text-xs text-stone-500">{new Date(reservation.created_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[0.65rem] ${RES_STATUS_STYLE[reservation.status as ReservationStatus]}`}>
                    {RES_STATUS_LABEL[reservation.status as ReservationStatus]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="glass rounded-2xl border border-campo-border p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-lg text-forest-100">Agenda de experiências</h2>
            <Link href="/produtor/experiencias" className="text-xs text-gold hover:underline">Gerenciar</Link>
          </div>
          {upcomingBookings.length === 0 ? (
            <p className="py-8 text-center text-sm text-stone-500">Nenhuma vivência futura.</p>
          ) : (
            <ul className="space-y-3">
              {upcomingBookings.map((booking) => (
                <li key={booking.id} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-forest-100">{experienceName.get(booking.experience_id) ?? "Experiência"}</p>
                    <p className="text-xs text-stone-500">{new Date(`${booking.date}T00:00:00`).toLocaleDateString("pt-BR")}{booking.time ? ` · ${booking.time}` : ""} · {booking.people} pessoa(s)</p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[0.65rem] ${EXP_STATUS_STYLE[booking.status]}`}>
                    {EXP_STATUS_LABEL[booking.status]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

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
              {bestSellers.map((item) => (
                <li key={item.name} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-forest-100">{item.name}</p>
                    <p className="text-xs text-stone-500">{item.qty} un. vendidas</p>
                  </div>
                  <span className="text-sm text-gold">{formatBRL(item.revenue)}</span>
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
            <Donut segments={donutSegs} centerTop={String(donutSegs.reduce((total, item) => total + item.value, 0))} centerBottom="em R$" />
          )}
        </section>
      </div>
    </AppShell>
  );
}

function ActionTile({ href, label, value }: { href: string; label: string; value: string }) {
  return (
    <Link href={href} className="rounded-lg border border-campo-border bg-campo-bg/40 p-3 transition hover:border-gold/60 hover:bg-gold/5">
      <span className="block text-xs uppercase tracking-wider text-stone-500">{label}</span>
      <span className="mt-2 block font-serif text-2xl text-forest-100">{value}</span>
    </Link>
  );
}

function HealthRow({ label, value, warn, muted }: { label: string; value: string; warn?: boolean; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-campo-border bg-campo-bg/35 px-3 py-2">
      <span className={muted ? "text-sm text-stone-600" : "text-sm text-stone-300"}>{label}</span>
      <span className={warn ? "text-sm font-medium text-gold" : muted ? "text-sm text-stone-600" : "text-sm text-forest-100"}>{value}</span>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  delta,
  series,
}: {
  icon: "cash" | "bag" | "users" | "cart";
  label: string;
  value: string;
  delta: number;
  series: number[];
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
