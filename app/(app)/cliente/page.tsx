import Link from "next/link";
import { requireRole } from "@/lib/guard";
import { greeting } from "@/lib/greeting";
import { createClient } from "@/lib/supabase/server";
import { AppShell, CLIENTE_NAV } from "@/components/AppShell";
import { PanelNotice } from "@/components/PanelNotice";
import { ProductCard, type ProductWithProducer } from "@/components/ProductCard";
import { producerName, locationLabel, type PublicProfile } from "@/lib/profile";
import { Avatar } from "@/components/Avatar";
import { formatBRL } from "@/lib/catalog";
import { ORDER_STATUS_LABEL, ORDER_STATUS_STYLE, type OrderStatus, type PaymentStatus } from "@/lib/orders";
import { RES_STATUS_LABEL, RES_STATUS_STYLE, type Reservation, type ReservationStatus } from "@/lib/reservations";
import { EXP_STATUS_LABEL, EXP_STATUS_STYLE, formatExpPrice, type ExperienceBooking } from "@/lib/experiences";
import { getSite } from "@/lib/site";

const PRODUCER_FIELDS =
  "id, full_name, display_name, farm_name, city, state, avatar_url, bio, verification_status";

type ClientOrderRow = {
  id: string;
  created_at: string;
  total_cents: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  producer: Partial<PublicProfile> | null;
};

type ExperiencePreview = { id: string; title: string; location: string | null };
type ProductPreview = { id: string; name: string };

export default async function ClientePage() {
  const { user, profile } = await requireRole("cliente");
  const supabase = await createClient();
  const site = await getSite(supabase);
  const panel = site.panel_content.cliente;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [{ data: productsData }, { data: producersData }, { data: ordersData }, { data: reservationsData }, { data: bookingsData }] =
    await Promise.all([
      supabase
        .from("products")
        .select(`*, producer:profiles!products_producer_id_fkey(${PRODUCER_FIELDS})`)
        .eq("available", true)
        .order("created_at", { ascending: false })
        .limit(12),
      supabase
        .from("profiles")
        .select(PRODUCER_FIELDS)
        .eq("role", "produtor")
        .limit(6),
      supabase
        .from("orders")
        .select("id, created_at, total_cents, status, payment_status, producer:profiles!orders_producer_id_fkey(id, full_name, display_name, farm_name, city, state, avatar_url, verification_status)")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false })
        .limit(12),
      supabase
        .from("harvest_reservations")
        .select("*")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("experience_bookings")
        .select("*")
        .eq("customer_id", user.id)
        .order("date", { ascending: true })
        .limit(8),
    ]);

  const products = (productsData ?? []) as unknown as ProductWithProducer[];
  const producers = (producersData ?? []) as Partial<PublicProfile>[];
  const orders = (ordersData ?? []) as unknown as ClientOrderRow[];
  const reservations = (reservationsData ?? []) as Reservation[];
  const bookings = (bookingsData ?? []) as ExperienceBooking[];

  const experienceIds = [...new Set(bookings.map((booking) => booking.experience_id))];
  const reservationProductIds = [...new Set(reservations.map((reservation) => reservation.product_id))];
  const [{ data: experienceRows }, { data: reservationProducts }] = await Promise.all([
    supabase
      .from("experiences")
      .select("id, title, location")
      .in("id", experienceIds.length ? experienceIds : ["00000000-0000-0000-0000-000000000000"]),
    supabase
      .from("products")
      .select("id, name")
      .in("id", reservationProductIds.length ? reservationProductIds : ["00000000-0000-0000-0000-000000000000"]),
  ]);

  const experienceById = new Map((experienceRows ?? []).map((experience) => [experience.id as string, experience as ExperiencePreview]));
  const productById = new Map((reservationProducts ?? []).map((product) => [product.id as string, product as ProductPreview]));

  const fresh = products.filter((product) => product.production_status === "pronto").slice(0, 8);
  const reservas = products.filter(
    (product) => product.production_status === "reservado" || product.available_from
  ).slice(0, 4);

  const activeOrders = orders.filter((order) => order.status !== "entregue" && order.status !== "cancelado");
  const activeReservations = reservations.filter((reservation) => reservation.status === "reservado" || reservation.status === "confirmado");
  const upcomingBookings = bookings
    .filter((booking) => booking.status !== "cancelado" && new Date(`${booking.date}T${booking.time || "00:00"}`) >= now)
    .sort((a, b) => new Date(`${a.date}T${a.time || "00:00"}`).getTime() - new Date(`${b.date}T${b.time || "00:00"}`).getTime());
  const monthSpent = orders
    .filter((order) => order.status !== "cancelado" && new Date(order.created_at) >= monthStart)
    .reduce((sum, order) => sum + order.total_cents, 0);
  const pendingPayments = orders.filter((order) => order.payment_status === "pendente" && order.status !== "cancelado").length;
  const nextBooking = upcomingBookings[0];

  return (
    <AppShell badge="Clube Gourmet" nav={CLIENTE_NAV} userName={profile?.full_name ?? "Cliente"} title={greeting(profile?.full_name)} subtitle={panel.subtitle}>
      <PanelNotice role="cliente" />

      <section className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="glass rounded-2xl border border-campo-border p-6 lg:col-span-2">
          <p className="text-xs uppercase tracking-wider text-gold">{panel.label}</p>
          <h2 className="mt-2 max-w-2xl font-serif text-3xl text-forest-100">{panel.title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-400">
            {panel.text}
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <ActionCard href="/cliente/explorar" label="Comprar agora" text={`${fresh.length} produtos frescos`} />
            <ActionCard href="/cliente/reservas" label="Reservar colheita" text={`${reservas.length} ofertas futuras`} />
            <ActionCard href="/experiencias" label="Planejar experiência" text={`${upcomingBookings.length} na agenda`} />
          </div>
        </div>

        <aside className="glass rounded-2xl border border-campo-border p-6">
          <p className="text-xs uppercase tracking-wider text-stone-500">Próxima ação</p>
          {pendingPayments > 0 ? (
            <>
              <h3 className="mt-2 font-serif text-xl text-forest-100">Há pagamento pendente</h3>
              <p className="mt-2 text-sm text-stone-400">Finalize para liberar o fluxo do produtor e da entrega.</p>
              <Link href="/cliente/pagamento" className="mt-4 inline-block rounded-lg bg-gold px-4 py-2 text-sm font-medium text-campo-bg transition hover:bg-gold-light">Ir para pagamento</Link>
            </>
          ) : nextBooking ? (
            <>
              <h3 className="mt-2 font-serif text-xl text-forest-100">{experienceById.get(nextBooking.experience_id)?.title ?? "Experiência reservada"}</h3>
              <p className="mt-2 text-sm text-stone-400">
                {new Date(`${nextBooking.date}T00:00:00`).toLocaleDateString("pt-BR")}
                {nextBooking.time ? ` às ${nextBooking.time}` : ""} · {nextBooking.people} pessoa(s)
              </p>
              <Link href="/cliente/experiencias" className="mt-4 inline-block rounded-lg border border-campo-border px-4 py-2 text-sm text-stone-200 transition hover:border-gold/50">Ver agenda</Link>
            </>
          ) : (
            <>
              <h3 className="mt-2 font-serif text-xl text-forest-100">Monte uma jornada no campo</h3>
              <p className="mt-2 text-sm text-stone-400">Comece por um produtor, uma cesta ou uma experiência pública.</p>
              <Link href="/experiencias" className="mt-4 inline-block rounded-lg bg-gold px-4 py-2 text-sm font-medium text-campo-bg transition hover:bg-gold-light">Explorar experiências</Link>
            </>
          )}
        </aside>
      </section>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Pedidos em andamento" value={String(activeOrders.length)} href="/cliente/pedidos" />
        <Metric label="Reservas de colheita" value={String(activeReservations.length)} href="/cliente/reservas" />
        <Metric label="Experiências futuras" value={String(upcomingBookings.length)} href="/cliente/experiencias" />
        <Metric label="Gasto no mês" value={formatBRL(monthSpent)} href="/cliente/pedidos" accent />
      </div>

      <div className="mb-10 grid gap-4 lg:grid-cols-3">
        <section className="glass rounded-2xl border border-campo-border p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-xl text-forest-100">Atividade recente</h2>
            <Link href="/cliente/pedidos" className="text-xs text-gold hover:underline">Ver histórico</Link>
          </div>
          {orders.length === 0 && reservations.length === 0 && bookings.length === 0 ? (
            <Empty>Nenhuma atividade ainda. Quando você comprar, reservar ou agendar, tudo aparece aqui.</Empty>
          ) : (
            <div className="space-y-3">
              {activeOrders.slice(0, 3).map((order) => (
                <ActivityRow
                  key={order.id}
                  href="/cliente/pedidos"
                  title={producerName(order.producer)}
                  meta={`${new Date(order.created_at).toLocaleDateString("pt-BR")} · ${formatBRL(order.total_cents)}`}
                  badge={ORDER_STATUS_LABEL[order.status]}
                  badgeClass={ORDER_STATUS_STYLE[order.status]}
                />
              ))}
              {activeReservations.slice(0, 3).map((reservation) => (
                <ActivityRow
                  key={reservation.id}
                  href="/cliente/reservas"
                  title={productById.get(reservation.product_id)?.name ?? "Reserva de colheita"}
                  meta={`Qtd: ${reservation.quantity} · ${new Date(reservation.created_at).toLocaleDateString("pt-BR")}`}
                  badge={RES_STATUS_LABEL[reservation.status as ReservationStatus]}
                  badgeClass={RES_STATUS_STYLE[reservation.status as ReservationStatus]}
                />
              ))}
              {upcomingBookings.slice(0, 3).map((booking) => (
                <ActivityRow
                  key={booking.id}
                  href="/cliente/experiencias"
                  title={experienceById.get(booking.experience_id)?.title ?? "Experiência"}
                  meta={`${new Date(`${booking.date}T00:00:00`).toLocaleDateString("pt-BR")} · ${formatExpPrice(booking.total_cents, booking.currency)}`}
                  badge={EXP_STATUS_LABEL[booking.status]}
                  badgeClass={EXP_STATUS_STYLE[booking.status]}
                />
              ))}
            </div>
          )}
        </section>

        <section className="glass rounded-2xl border border-campo-border p-5">
          <h2 className="font-serif text-xl text-forest-100">Roteiro rápido</h2>
          <div className="mt-4 space-y-3">
            <ActionCard href="/cliente/proximos" label="Perto de mim" text="Produtores e rotas próximas" compact />
            <ActionCard href="/cliente/clube" label="Clube Gourmet" text="Assinaturas e recorrência" compact />
            <ActionCard href="/cliente/suporte" label="Suporte" text="Ajuda com pedidos e reservas" compact />
          </div>
        </section>
      </div>

      <Section title="Colheita fresca de hoje" subtitle="Disponível para entrega agora">
        {fresh.length === 0 ? (
          <Empty>Ainda não há produtos disponíveis na sua região.</Empty>
        ) : (
          <Grid>
            {fresh.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </Grid>
        )}
      </Section>

      {reservas.length > 0 && (
        <Section title="Reserve sua colheita" subtitle="Garanta antes de colher">
          <Grid>
            {reservas.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </Grid>
        </Section>
      )}

      <Section title="Conheça quem produz" subtitle="Os produtores da sua rede">
        {producers.length === 0 ? (
          <Empty>Nenhum produtor cadastrado ainda.</Empty>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {producers.map((producer) => (
              <Link
                key={producer.id}
                href={`/cliente/produtor/${producer.id}`}
                className="glass flex items-center gap-4 rounded-2xl border border-campo-border p-4 transition hover:border-gold/50"
              >
                <Avatar url={producer.avatar_url} size={56} verified={producer.verification_status === "verificado"} fallback="SC" />
                <div className="min-w-0">
                  <p className="truncate font-serif text-lg text-forest-100">{producerName(producer)}</p>
                  <p className="truncate text-xs text-stone-500">{locationLabel(producer) || "Brasil"}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Section>
    </AppShell>
  );
}

function ActionCard({ href, label, text, compact = false }: { href: string; label: string; text: string; compact?: boolean }) {
  return (
    <Link href={href} className={`block rounded-lg border border-campo-border bg-campo-bg/40 transition hover:border-gold/60 hover:bg-gold/5 ${compact ? "p-3" : "p-4"}`}>
      <span className="block text-sm font-medium text-forest-100">{label}</span>
      <span className="mt-1 block text-xs text-stone-500">{text}</span>
    </Link>
  );
}

function Metric({ label, value, href, accent }: { label: string; value: string; href: string; accent?: boolean }) {
  return (
    <Link href={href} className="glass rounded-2xl border border-campo-border p-5 transition hover:border-gold/50">
      <p className="text-xs uppercase tracking-wider text-stone-500">{label}</p>
      <p className={`mt-2 font-serif text-2xl ${accent ? "text-gold" : "text-forest-100"}`}>{value}</p>
    </Link>
  );
}

function ActivityRow({ href, title, meta, badge, badgeClass }: { href: string; title: string; meta: string; badge: string; badgeClass: string }) {
  return (
    <Link href={href} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-campo-border bg-campo-bg/35 px-4 py-3 transition hover:border-gold/50">
      <span className="min-w-0">
        <span className="block truncate text-sm text-forest-100">{title}</span>
        <span className="block text-xs text-stone-500">{meta}</span>
      </span>
      <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[0.65rem] ${badgeClass}`}>{badge}</span>
    </Link>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <div className="mb-4">
        <h2 className="font-serif text-xl text-forest-100">{title}</h2>
        {subtitle && <p className="text-sm text-stone-500">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{children}</div>;
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-campo-border bg-campo-bg/30 p-8 text-center text-sm text-stone-400">
      {children}
    </div>
  );
}
