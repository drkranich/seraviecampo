import Link from "next/link";
import { requireRole } from "@/lib/guard";
import { greeting } from "@/lib/greeting";
import { createClient } from "@/lib/supabase/server";
import { AppShell, ADMIN_NAV } from "@/components/AppShell";
import { AreaChart } from "@/components/charts";
import { formatBRL } from "@/lib/catalog";
import { ROLE_LABEL, type UserRole } from "@/lib/roles";
import { ORDER_STATUS_LABEL, ORDER_STATUS_STYLE, type OrderStatus } from "@/lib/orders";

type ProfileRow = {
  id: string;
  role: UserRole;
  full_name: string | null;
  display_name: string | null;
  farm_name: string | null;
  city: string | null;
  state: string | null;
  verification_status: string;
  face_verified: boolean;
  document_url: string | null;
  created_at: string;
};
type OrderRow = {
  id: string;
  producer_id: string;
  delivery_person_id: string | null;
  total_cents: number;
  delivery_fee_cents: number;
  status: OrderStatus;
  payment_status: string;
  self_delivery: boolean;
  delivery_name: string | null;
  created_at: string;
};
type ProductRow = {
  id: string;
  producer_id: string;
  name: string;
  available: boolean;
  archived: boolean;
  stock: number;
  production_status: string;
  created_at: string;
};
type ExperienceRow = { id: string; producer_id: string; title: string; active: boolean; archived: boolean; created_at: string };
type ExperienceBookingRow = {
  id: string;
  producer_id: string;
  total_cents: number;
  status: string;
  payment_status: string;
  date: string;
  created_at: string;
};
type ReservationRow = { id: string; producer_id: string; status: string; created_at: string };
type DisputeRow = { id: string; status: string; reason: string; created_at: string };

function startOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

export default async function AdminPage() {
  const { profile } = await requireRole("super_admin");
  const supabase = await createClient();

  const since = new Date();
  since.setDate(since.getDate() - 60);

  const [
    { data: profilesData },
    { data: ordersData },
    { data: productsData },
    { data: experiencesData },
    { data: bookingsData },
    { data: reservationsData },
    { data: disputesData },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, role, full_name, display_name, farm_name, city, state, verification_status, face_verified, document_url, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("orders")
      .select("id, producer_id, delivery_person_id, total_cents, delivery_fee_cents, status, payment_status, self_delivery, delivery_name, created_at")
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false }),
    supabase
      .from("products")
      .select("id, producer_id, name, available, archived, stock, production_status, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("experiences")
      .select("id, producer_id, title, active, archived, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("experience_bookings")
      .select("id, producer_id, total_cents, status, payment_status, date, created_at")
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false }),
    supabase
      .from("harvest_reservations")
      .select("id, producer_id, status, created_at")
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false }),
    supabase
      .from("disputes")
      .select("id, status, reason, created_at")
      .order("created_at", { ascending: false }),
  ]);

  const profiles = (profilesData ?? []) as ProfileRow[];
  const orders = (ordersData ?? []) as OrderRow[];
  const products = (productsData ?? []) as ProductRow[];
  const experiences = (experiencesData ?? []) as ExperienceRow[];
  const bookings = (bookingsData ?? []) as ExperienceBookingRow[];
  const reservations = (reservationsData ?? []) as ReservationRow[];
  const disputes = (disputesData ?? []) as DisputeRow[];

  const now = new Date();
  const validOrders = orders.filter((order) => order.status !== "cancelado");
  const paidBookings = bookings.filter((booking) => booking.payment_status === "pago" && booking.status !== "cancelado");
  const clients = profiles.filter((item) => item.role === "cliente");
  const producers = profiles.filter((item) => item.role === "produtor");
  const partners = profiles.filter((item) => item.role === "parceiro");
  const deliverers = profiles.filter((item) => item.role === "entregador");
  const cities = new Set(profiles.map((item) => item.city).filter(Boolean)).size;
  const pendingApprovals = profiles.filter(
    (item) =>
      (item.role === "produtor" || item.role === "entregador" || item.role === "parceiro") &&
      (item.verification_status === "pendente" || item.verification_status === "em_analise" || !item.face_verified || !item.document_url)
  );
  const openDisputes = disputes.filter((item) => item.status === "aberta" || item.status === "em_analise");
  const pendingOrders = orders.filter((order) => order.status === "novo" || order.status === "preparando");
  const unassignedDeliveries = orders.filter((order) => order.status === "saiu_entrega" && !order.self_delivery && !order.delivery_person_id);
  const lowStockProducts = products.filter((product) => !product.archived && product.available && Number(product.stock ?? 0) <= 3);
  const productDrafts = products.filter((product) => !product.archived && !product.available);
  const experienceDrafts = experiences.filter((experience) => !experience.archived && !experience.active);
  const activeProducts = products.filter((product) => !product.archived && product.available);
  const activeExperiences = experiences.filter((experience) => !experience.archived && experience.active);
  const activeReservations = reservations.filter((reservation) => reservation.status === "reservado" || reservation.status === "confirmado");

  const orderGmv = validOrders.reduce((total, order) => total + order.total_cents, 0);
  const experienceGmv = paidBookings.reduce((total, booking) => total + booking.total_cents, 0);
  const gmv = orderGmv + experienceGmv;
  const serviceVolume = validOrders.length + paidBookings.length + activeReservations.length;

  const labels: string[] = [];
  const gmvSeries: number[] = [];
  for (let i = 13; i >= 0; i--) {
    const date = startOfDay(new Date(now));
    date.setDate(date.getDate() - i);
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    labels.push(date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }));
    const ordersDay = validOrders
      .filter((order) => {
        const created = new Date(order.created_at);
        return created >= date && created < next;
      })
      .reduce((total, order) => total + order.total_cents, 0);
    const bookingsDay = paidBookings
      .filter((booking) => {
        const created = new Date(booking.created_at);
        return created >= date && created < next;
      })
      .reduce((total, booking) => total + booking.total_cents, 0);
    gmvSeries.push((ordersDay + bookingsDay) / 100);
  }

  const profileName = new Map(
    profiles.map((item) => [item.id, item.farm_name || item.display_name || item.full_name || ROLE_LABEL[item.role] || "Conta"])
  );
  const revenueByProvider = new Map<string, number>();
  for (const order of validOrders) {
    revenueByProvider.set(order.producer_id, (revenueByProvider.get(order.producer_id) ?? 0) + order.total_cents);
  }
  for (const booking of paidBookings) {
    revenueByProvider.set(booking.producer_id, (revenueByProvider.get(booking.producer_id) ?? 0) + booking.total_cents);
  }
  const providerRanking = [...revenueByProvider.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const recentUsers = profiles.slice(0, 6);
  const recentOrders = orders.slice(0, 5);

  return (
    <AppShell
      badge="Seravie Hub"
      nav={ADMIN_NAV}
      userName={profile?.full_name ?? "Administrador"}
      title={greeting(profile?.full_name)}
      subtitle="Central de comando para operação, conteúdo, pagamentos e confiança."
    >
      <section className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="glass rounded-2xl border border-campo-border p-6 lg:col-span-2">
          <p className="text-xs uppercase tracking-wider text-gold">Sala de controle</p>
          <h2 className="mt-2 max-w-2xl font-serif text-3xl text-forest-100">Veja onde a plataforma precisa de decisão hoje.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-400">
            Aprovações, disputas, entregas sem responsável, vitrine e volume financeiro ficam juntos para reduzir ruído operacional.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <ActionTile href="/admin/aprovacoes" label="Aprovações" value={String(pendingApprovals.length)} alert={pendingApprovals.length > 0} />
            <ActionTile href="/admin/disputas" label="Disputas" value={String(openDisputes.length)} alert={openDisputes.length > 0} />
            <ActionTile href="/admin/pagamentos" label="GMV 60d" value={formatBRL(gmv)} />
            <ActionTile href="/admin/site" label="CMS" value="Editar" />
          </div>
        </div>

        <aside className="glass rounded-2xl border border-campo-border p-6">
          <p className="text-xs uppercase tracking-wider text-stone-500">Prioridade</p>
          {pendingApprovals.length > 0 ? (
            <>
              <h3 className="mt-2 font-serif text-xl text-forest-100">Contas aguardando análise</h3>
              <p className="mt-2 text-sm text-stone-400">Produtores, parceiros ou entregadores precisam de validação para operar.</p>
              <Link href="/admin/aprovacoes" className="mt-4 inline-block rounded-lg bg-gold px-4 py-2 text-sm font-medium text-campo-bg transition hover:bg-gold-light">Abrir aprovações</Link>
            </>
          ) : openDisputes.length > 0 ? (
            <>
              <h3 className="mt-2 font-serif text-xl text-forest-100">Disputas em aberto</h3>
              <p className="mt-2 text-sm text-stone-400">Resolva antes que vire atrito entre cliente e fornecedor.</p>
              <Link href="/admin/disputas" className="mt-4 inline-block rounded-lg bg-gold px-4 py-2 text-sm font-medium text-campo-bg transition hover:bg-gold-light">Resolver disputas</Link>
            </>
          ) : unassignedDeliveries.length > 0 ? (
            <>
              <h3 className="mt-2 font-serif text-xl text-forest-100">Entregas sem responsável</h3>
              <p className="mt-2 text-sm text-stone-400">Há pedidos liberados para rota ainda sem entregador.</p>
              <Link href="/admin/pagamentos" className="mt-4 inline-block rounded-lg border border-campo-border px-4 py-2 text-sm text-stone-200 transition hover:border-gold/50">Ver operação</Link>
            </>
          ) : (
            <>
              <h3 className="mt-2 font-serif text-xl text-forest-100">Operação sem alerta crítico</h3>
              <p className="mt-2 text-sm text-stone-400">Use esse momento para revisar conteúdo público, planos e ranking de fornecedores.</p>
              <Link href="/admin/site" className="mt-4 inline-block rounded-lg bg-gold px-4 py-2 text-sm font-medium text-campo-bg transition hover:bg-gold-light">Revisar CMS</Link>
            </>
          )}
        </aside>
      </section>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="GMV total (60d)" value={formatBRL(gmv)} accent />
        <Stat label="Pedidos + reservas" value={String(serviceVolume)} />
        <Stat label="Fornecedores" value={String(producers.length + partners.length)} />
        <Stat label="Clientes" value={String(clients.length)} />
        <Stat label="Entregadores" value={String(deliverers.length)} />
        <Stat label="Cidades" value={String(cities)} />
        <Stat label="Aprovações pendentes" value={String(pendingApprovals.length)} warn={pendingApprovals.length > 0} />
        <Stat label="Disputas abertas" value={String(openDisputes.length)} warn={openDisputes.length > 0} />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <section className="glass rounded-2xl border border-campo-border p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-lg text-forest-100">Volume negociado</h2>
            <span className="rounded-lg border border-campo-border px-3 py-1 text-xs text-stone-400">Últimos 14 dias</span>
          </div>
          <AreaChart data={gmvSeries} labels={labels} />
        </section>

        <section className="glass rounded-2xl border border-campo-border p-5">
          <h2 className="mb-4 font-serif text-lg text-forest-100">Saúde da vitrine</h2>
          <div className="space-y-2">
            <Line label="Produtos publicados" value={String(activeProducts.length)} />
            <Line label="Experiências publicadas" value={String(activeExperiences.length)} />
            <Line label="Produtos com estoque baixo" value={String(lowStockProducts.length)} alert={lowStockProducts.length > 0} />
            <Line label="Rascunhos" value={String(productDrafts.length + experienceDrafts.length)} />
          </div>
          <Link href="/admin/site" className="mt-4 inline-block rounded-lg border border-campo-border px-4 py-2 text-sm text-stone-200 transition hover:border-gold/50">Editar página pública</Link>
        </section>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <section className="glass rounded-2xl border border-campo-border p-5">
          <h2 className="mb-4 font-serif text-lg text-forest-100">Fila operacional</h2>
          <div className="space-y-2">
            <Line label="Pedidos em preparo" value={String(pendingOrders.length)} alert={pendingOrders.length > 0} />
            <Line label="Entregas sem entregador" value={String(unassignedDeliveries.length)} alert={unassignedDeliveries.length > 0} />
            <Line label="Reservas de colheita ativas" value={String(activeReservations.length)} />
            <Line label="Pagamentos pendentes" value={String(orders.filter((order) => order.payment_status === "pendente").length)} />
          </div>
        </section>

        <section className="glass rounded-2xl border border-campo-border p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-lg text-forest-100">Top fornecedores</h2>
            <Link href="/admin/usuarios" className="text-xs text-gold hover:underline">Ver usuários</Link>
          </div>
          {providerRanking.length === 0 ? (
            <p className="py-6 text-center text-sm text-stone-500">Sem vendas ainda.</p>
          ) : (
            <ul className="space-y-3">
              {providerRanking.map(([providerId, revenue], index) => (
                <li key={providerId} className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate text-sm text-forest-100">
                    <span className="mr-2 text-stone-500">{index + 1}.</span>{profileName.get(providerId) ?? "Fornecedor"}
                  </span>
                  <span className="shrink-0 text-sm text-gold">{formatBRL(revenue)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="glass rounded-2xl border border-campo-border p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-lg text-forest-100">Cadastros recentes</h2>
            <Link href="/admin/usuarios" className="text-xs text-gold hover:underline">Ver todos</Link>
          </div>
          <ul className="space-y-3">
            {recentUsers.map((user) => (
              <li key={user.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm text-forest-100">{user.farm_name || user.full_name || user.display_name || "Conta sem nome"}</p>
                  <p className="text-xs text-stone-500">{ROLE_LABEL[user.role]} · {user.city || "Sem cidade"}</p>
                </div>
                <span className="shrink-0 text-xs text-stone-500">{new Date(user.created_at).toLocaleDateString("pt-BR")}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="glass rounded-2xl border border-campo-border p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-lg text-forest-100">Pedidos recentes</h2>
          <Link href="/admin/pagamentos" className="text-xs text-gold hover:underline">Ver financeiro</Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="py-6 text-center text-sm text-stone-500">Nenhum pedido recente.</p>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-campo-border bg-campo-bg/35 px-4 py-3">
                <div>
                  <p className="text-sm text-forest-100">{profileName.get(order.producer_id) ?? "Fornecedor"}</p>
                  <p className="text-xs text-stone-500">
                    {order.delivery_name || "Cliente"} · {new Date(order.created_at).toLocaleString("pt-BR")} · pgto {order.payment_status}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gold">{formatBRL(order.total_cents)}</span>
                  <span className={`rounded-full border px-2.5 py-0.5 text-[0.65rem] ${ORDER_STATUS_STYLE[order.status]}`}>
                    {ORDER_STATUS_LABEL[order.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}

function ActionTile({ href, label, value, alert }: { href: string; label: string; value: string; alert?: boolean }) {
  return (
    <Link href={href} className={`rounded-lg border bg-campo-bg/40 p-3 transition hover:border-gold/60 hover:bg-gold/5 ${alert ? "border-gold/50" : "border-campo-border"}`}>
      <span className="block text-xs uppercase tracking-wider text-stone-500">{label}</span>
      <span className={`mt-2 block font-serif text-xl ${alert ? "text-gold" : "text-forest-100"}`}>{value}</span>
    </Link>
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

function Line({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-campo-border bg-campo-bg/35 px-3 py-2">
      <span className="text-sm text-stone-400">{label}</span>
      <span className={alert ? "font-serif text-gold" : "font-serif text-forest-100"}>{value}</span>
    </div>
  );
}
