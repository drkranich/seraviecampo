import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { AppShell, ADMIN_NAV } from "@/components/AppShell";
import { ROLE_LABEL, type UserRole } from "@/lib/roles";
import { VERIFICATION_LABEL, VERIFICATION_STYLE, locationLabel } from "@/lib/profile";
import { ViewDocumentButton } from "@/components/ViewDocumentButton";
import { Avatar } from "@/components/Avatar";
import { formatBRL } from "@/lib/catalog";
import { ORDER_STATUS_LABEL, ORDER_STATUS_STYLE, type OrderStatus } from "@/lib/orders";
import { EXP_STATUS_LABEL, EXP_STATUS_STYLE, type ExperienceBooking } from "@/lib/experiences";
import { RES_STATUS_LABEL, RES_STATUS_STYLE, type ReservationStatus } from "@/lib/reservations";
import { DISPUTE_STATUS_LABEL, DISPUTE_STATUS_STYLE, DISPUTE_REASON_LABEL, type DisputeStatus } from "@/lib/disputes";
import { setVerification } from "../../actions";

type ProfileRecord = {
  id: string;
  role: UserRole;
  full_name: string | null;
  display_name: string | null;
  farm_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  verification_status: string;
  face_verified: boolean;
  document_url: string | null;
  document_type: string | null;
  selfie_url: string | null;
  kyc_exempt: boolean | null;
  last_ip: string | null;
  last_country: string | null;
  last_device: string | null;
  created_at: string;
};
type AcceptanceRow = { id: string; terms_slug: string; terms_version: number; accepted_at: string; ip: string | null; country: string | null; device: string | null };
type OrderLite = { id: string; total_cents: number; status: OrderStatus; payment_status: string; created_at: string; delivery_name: string | null };
type ProductLite = { id: string; name: string; available: boolean; archived: boolean; stock: number; created_at: string };
type ExperienceLite = { id: string; title: string; active: boolean; archived: boolean; created_at: string };
type ReservationLite = { id: string; product_id: string; status: ReservationStatus; quantity: number; created_at: string };
type DisputeLite = { id: string; status: DisputeStatus; reason: string; created_at: string };
type SubscriptionLite = { plan: string | null; status: string | null; created_at?: string | null };

export default async function UsuarioDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("super_admin");
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase.from("profiles").select("*").eq("id", id).single();
  if (!data) notFound();
  const p = data as ProfileRecord;

  const [
    { data: emails },
    { data: acceptancesData },
    { data: customerOrdersData },
    { data: producerOrdersData },
    { data: deliveryOrdersData },
    { data: productsData },
    { data: experiencesData },
    { data: customerBookingsData },
    { data: producerBookingsData },
    { data: customerReservationsData },
    { data: producerReservationsData },
    { data: disputesData },
    { data: subscriptionData },
    { data: experienceSubscriptionData },
  ] = await Promise.all([
    supabase.rpc("admin_emails"),
    supabase.from("term_acceptances").select("*").eq("user_id", id).order("accepted_at", { ascending: false }),
    supabase.from("orders").select("id, total_cents, status, payment_status, created_at, delivery_name").eq("customer_id", id).order("created_at", { ascending: false }).limit(8),
    supabase.from("orders").select("id, total_cents, status, payment_status, created_at, delivery_name").eq("producer_id", id).order("created_at", { ascending: false }).limit(8),
    supabase.from("orders").select("id, total_cents, status, payment_status, created_at, delivery_name").eq("delivery_person_id", id).order("created_at", { ascending: false }).limit(8),
    supabase.from("products").select("id, name, available, archived, stock, created_at").eq("producer_id", id).order("created_at", { ascending: false }).limit(8),
    supabase.from("experiences").select("id, title, active, archived, created_at").eq("producer_id", id).order("created_at", { ascending: false }).limit(8),
    supabase.from("experience_bookings").select("*").eq("customer_id", id).order("created_at", { ascending: false }).limit(8),
    supabase.from("experience_bookings").select("*").eq("producer_id", id).order("created_at", { ascending: false }).limit(8),
    supabase.from("harvest_reservations").select("id, product_id, status, quantity, created_at").eq("customer_id", id).order("created_at", { ascending: false }).limit(8),
    supabase.from("harvest_reservations").select("id, product_id, status, quantity, created_at").eq("producer_id", id).order("created_at", { ascending: false }).limit(8),
    supabase.from("disputes").select("id, status, reason, created_at").eq("opened_by", id).order("created_at", { ascending: false }).limit(8),
    supabase.from("subscriptions").select("plan, status, created_at").eq("account_id", id).maybeSingle(),
    supabase.from("experience_subscriptions").select("plan, status, created_at").eq("account_id", id).maybeSingle(),
  ]);

  const email = ((emails ?? []) as { id: string; email: string }[]).find((item) => item.id === id)?.email ?? "—";
  const acceptances = (acceptancesData ?? []) as AcceptanceRow[];
  const customerOrders = (customerOrdersData ?? []) as OrderLite[];
  const producerOrders = (producerOrdersData ?? []) as OrderLite[];
  const deliveryOrders = (deliveryOrdersData ?? []) as OrderLite[];
  const products = (productsData ?? []) as ProductLite[];
  const experiences = (experiencesData ?? []) as ExperienceLite[];
  const customerBookings = (customerBookingsData ?? []) as ExperienceBooking[];
  const producerBookings = (producerBookingsData ?? []) as ExperienceBooking[];
  const customerReservations = (customerReservationsData ?? []) as ReservationLite[];
  const producerReservations = (producerReservationsData ?? []) as ReservationLite[];
  const disputes = (disputesData ?? []) as DisputeLite[];
  const subscription = subscriptionData as SubscriptionLite | null;
  const experienceSubscription = experienceSubscriptionData as SubscriptionLite | null;

  const approve = setVerification.bind(null, p.id, "verificado");
  const analyze = setVerification.bind(null, p.id, "em_analise");
  const reject = setVerification.bind(null, p.id, "rejeitado");
  const display = p.farm_name || p.display_name || p.full_name || "Conta sem nome";
  const roleLabel = ROLE_LABEL[p.role] ?? "—";
  const docType = p.document_type || "documento";
  const profileRevenue =
    producerOrders.filter((order) => order.status !== "cancelado").reduce((total, order) => total + order.total_cents, 0) +
    producerBookings.filter((booking) => booking.payment_status === "pago" && booking.status !== "cancelado").reduce((total, booking) => total + booking.total_cents, 0);
  const customerSpend =
    customerOrders.filter((order) => order.status !== "cancelado").reduce((total, order) => total + order.total_cents, 0) +
    customerBookings.filter((booking) => booking.payment_status === "pago" && booking.status !== "cancelado").reduce((total, booking) => total + booking.total_cents, 0);

  return (
    <AppShell badge="Seravie Hub" nav={ADMIN_NAV} title={display} subtitle={`${roleLabel} · ${email}`}>
      <Link href="/admin/usuarios" className="mb-6 inline-block text-sm text-stone-400 hover:text-gold">← Voltar para usuários</Link>

      <section className="mb-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="glass rounded-2xl border border-campo-border p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <Avatar url={p.avatar_url} size={72} verified={p.verification_status === "verificado"} fallback={fallbackFor(p.role)} />
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wider text-gold">{roleLabel}</p>
                <h2 className="truncate font-serif text-2xl text-forest-100">{display}</h2>
                <p className="text-sm text-stone-400">{locationLabel(p) || "Sem localização"} · cadastrado em {formatDate(p.created_at)}</p>
              </div>
            </div>
            <span className={`rounded-full border px-3 py-1 text-xs ${VERIFICATION_STYLE[p.verification_status] ?? ""}`}>
              {VERIFICATION_LABEL[p.verification_status] ?? p.verification_status}
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <MiniStat label="Receita gerada" value={formatBRL(profileRevenue)} />
            <MiniStat label="Compras/reservas" value={formatBRL(customerSpend)} />
            <MiniStat label="Termos aceitos" value={String(acceptances.length)} />
          </div>
        </div>

        <div className="glass rounded-2xl border border-campo-border p-5">
          <h2 className="font-serif text-lg text-forest-100">Decisão de confiança</h2>
          <div className="mt-3 grid gap-2">
            <TrustRow label="Selfie orofacial" ok={Boolean(p.face_verified || p.selfie_url)} />
            <TrustRow label="Documento" ok={Boolean(p.document_url || p.kyc_exempt)} />
            <TrustRow label="KYC isento" ok={Boolean(p.kyc_exempt)} muted />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <form action={analyze}><button className="rounded-lg border border-blue-900/60 px-3 py-1.5 text-xs text-blue-300 transition hover:bg-blue-950/40">Marcar em análise</button></form>
            <form action={reject}><button className="rounded-lg border border-red-900/50 px-3 py-1.5 text-xs text-red-300 transition hover:bg-red-950/40">Rejeitar</button></form>
            <form action={approve}><button className="rounded-lg bg-gold px-4 py-1.5 text-xs font-medium text-campo-bg transition hover:bg-gold-light">Aprovar</button></form>
          </div>
        </div>
      </section>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <section className="glass rounded-2xl border border-campo-border p-5">
          <h2 className="mb-3 font-serif text-lg text-forest-100">Dados</h2>
          <Dl label="Nome completo" value={p.full_name || "—"} />
          <Dl label="Nome público" value={p.display_name || p.farm_name || "—"} />
          <Dl label="E-mail" value={email} />
          <Dl label="Telefone" value={p.phone || "—"} />
          <Dl label="Papel" value={roleLabel} />
          <Dl label="Cidade/UF" value={locationLabel(p) || "—"} />
        </section>

        <section className="glass rounded-2xl border border-campo-border p-5">
          <h2 className="mb-3 font-serif text-lg text-forest-100">Origem e segurança</h2>
          <Dl label="IP mais recente" value={p.last_ip || "—"} />
          <Dl label="País" value={p.last_country || "—"} />
          <Dl label="Dispositivo" value={p.last_device || "—"} />
          <Dl label="Cadastro" value={formatDateTime(p.created_at)} />
          <Dl label="ID" value={p.id} />
        </section>
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <section className="glass rounded-2xl border border-campo-border p-5">
          <h2 className="mb-3 font-serif text-lg text-forest-100">Documentos sensíveis</h2>
          <div className="space-y-3">
            <DocumentLine label={`Identidade (${docType.toUpperCase()})`}>
              {p.document_url ? <ViewDocumentButton path={p.document_url} bucket="documents" label="Ver documento" /> : <p className="text-sm text-stone-500">Não enviado</p>}
            </DocumentLine>
            <DocumentLine label="Verificação orofacial">
              {p.selfie_url ? <ViewDocumentButton path={p.selfie_url} bucket="selfies" label="Ver selfie" /> : <p className="text-sm text-stone-500">Não enviada</p>}
            </DocumentLine>
          </div>
        </section>

        <section className="glass rounded-2xl border border-campo-border p-5">
          <h2 className="mb-3 font-serif text-lg text-forest-100">Assinaturas</h2>
          <div className="space-y-3">
            <PlanLine label="Plano principal" sub={subscription} />
            <PlanLine label="Plano de experiências" sub={experienceSubscription} />
          </div>
        </section>
      </div>

      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Pedidos como cliente" value={String(customerOrders.length)} />
        <MiniStat label="Pedidos como fornecedor" value={String(producerOrders.length)} />
        <MiniStat label="Entregas feitas" value={String(deliveryOrders.length)} />
        <MiniStat label="Disputas abertas por ele" value={String(disputes.length)} />
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <ActivityPanel title="Pedidos como cliente" empty="Nenhum pedido como cliente.">
          {customerOrders.map((order) => <OrderItem key={order.id} order={order} />)}
        </ActivityPanel>

        <ActivityPanel title="Pedidos como fornecedor" empty="Nenhum pedido como fornecedor.">
          {producerOrders.map((order) => <OrderItem key={order.id} order={order} />)}
        </ActivityPanel>

        <ActivityPanel title="Entregas atribuídas" empty="Nenhuma entrega atribuída.">
          {deliveryOrders.map((order) => <OrderItem key={order.id} order={order} />)}
        </ActivityPanel>

        <ActivityPanel title="Produtos publicados" empty="Nenhum produto cadastrado.">
          {products.map((product) => (
            <li key={product.id} className="flex items-center justify-between gap-3 rounded-lg border border-campo-border bg-campo-bg/35 px-3 py-2">
              <span className="min-w-0">
                <span className="block truncate text-sm text-forest-100">{product.name}</span>
                <span className="block text-xs text-stone-500">Estoque {product.stock ?? 0} · {product.archived ? "arquivado" : product.available ? "publicado" : "rascunho"}</span>
              </span>
              <Link href={`/produtor/produtos/${product.id}`} className="shrink-0 text-xs text-gold hover:underline">Abrir</Link>
            </li>
          ))}
        </ActivityPanel>

        <ActivityPanel title="Experiências" empty="Nenhuma experiência cadastrada.">
          {experiences.map((experience) => (
            <li key={experience.id} className="flex items-center justify-between gap-3 rounded-lg border border-campo-border bg-campo-bg/35 px-3 py-2">
              <span className="min-w-0">
                <span className="block truncate text-sm text-forest-100">{experience.title}</span>
                <span className="block text-xs text-stone-500">{experience.archived ? "arquivada" : experience.active ? "publicada" : "rascunho"} · {formatDate(experience.created_at)}</span>
              </span>
              <Link href={`/experiencias/${experience.id}`} className="shrink-0 text-xs text-gold hover:underline">Ver pública</Link>
            </li>
          ))}
        </ActivityPanel>

        <ActivityPanel title="Reservas de experiências" empty="Nenhuma reserva de experiência.">
          {[...producerBookings, ...customerBookings].slice(0, 8).map((booking) => <ExperienceBookingItem key={booking.id} booking={booking} />)}
        </ActivityPanel>

        <ActivityPanel title="Reservas de colheita" empty="Nenhuma reserva de colheita.">
          {[...producerReservations, ...customerReservations].slice(0, 8).map((reservation) => (
            <li key={reservation.id} className="flex items-center justify-between gap-3 rounded-lg border border-campo-border bg-campo-bg/35 px-3 py-2">
              <span className="text-sm text-forest-100">Qtd. {reservation.quantity}</span>
              <span className={`rounded-full border px-2 py-0.5 text-[0.65rem] ${RES_STATUS_STYLE[reservation.status] ?? ""}`}>{RES_STATUS_LABEL[reservation.status] ?? reservation.status}</span>
            </li>
          ))}
        </ActivityPanel>

        <ActivityPanel title="Disputas abertas por esta conta" empty="Nenhuma disputa aberta por esta conta.">
          {disputes.map((dispute) => (
            <li key={dispute.id} className="flex items-center justify-between gap-3 rounded-lg border border-campo-border bg-campo-bg/35 px-3 py-2">
              <span className="min-w-0">
                <span className="block truncate text-sm text-forest-100">{DISPUTE_REASON_LABEL[dispute.reason] ?? dispute.reason}</span>
                <span className="block text-xs text-stone-500">{formatDate(dispute.created_at)}</span>
              </span>
              <span className={`rounded-full border px-2 py-0.5 text-[0.65rem] ${DISPUTE_STATUS_STYLE[dispute.status] ?? ""}`}>{DISPUTE_STATUS_LABEL[dispute.status] ?? dispute.status}</span>
            </li>
          ))}
        </ActivityPanel>
      </div>

      <section className="glass mt-6 rounded-2xl border border-campo-border p-5">
        <h2 className="mb-3 font-serif text-lg text-forest-100">Termos aceitos</h2>
        {acceptances.length === 0 ? (
          <p className="text-sm text-stone-500">Nenhum aceite registrado.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {acceptances.map((acceptance) => (
              <li key={acceptance.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-campo-border bg-campo-bg/35 px-3 py-2">
                <span className="text-stone-300">{acceptance.terms_slug} v{acceptance.terms_version} · {formatDateTime(acceptance.accepted_at)}</span>
                <Link href={`/admin/termos/${acceptance.id}`} className="text-xs text-gold hover:underline">Ver assinado</Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}

function Dl({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-campo-border py-1.5">
      <span className="text-xs uppercase tracking-wider text-stone-500">{label}</span>
      <p className="break-words text-sm text-forest-100">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-campo-border bg-campo-surface2/35 p-4">
      <p className="text-xs uppercase tracking-wider text-stone-500">{label}</p>
      <p className="mt-1 font-serif text-xl text-forest-100">{value}</p>
    </div>
  );
}

function TrustRow({ label, ok, muted }: { label: string; ok: boolean; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-campo-border bg-campo-bg/35 px-3 py-2">
      <span className={muted ? "text-sm text-stone-500" : "text-sm text-stone-300"}>{label}</span>
      <span className={ok ? "text-sm text-forest-200" : "text-sm text-gold"}>{ok ? "ok" : "pendente"}</span>
    </div>
  );
}

function DocumentLine({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-xs uppercase tracking-wider text-stone-500">{label}</p>
      {children}
    </div>
  );
}

function PlanLine({ label, sub }: { label: string; sub: SubscriptionLite | null }) {
  return (
    <div className="rounded-lg border border-campo-border bg-campo-bg/35 px-3 py-2">
      <p className="text-xs uppercase tracking-wider text-stone-500">{label}</p>
      <p className="mt-1 text-sm text-forest-100">{sub?.plan || "Sem plano"}</p>
      <p className="text-xs text-stone-500">{sub?.status || "inativo"}</p>
    </div>
  );
}

function ActivityPanel({ title, empty, children }: { title: string; empty: string; children: React.ReactNode }) {
  const items = Array.isArray(children) ? children.flat().filter(Boolean) : children ? [children] : [];

  return (
    <section className="glass rounded-2xl border border-campo-border p-5">
      <h2 className="mb-3 font-serif text-lg text-forest-100">{title}</h2>
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-campo-border bg-campo-bg/30 px-3 py-6 text-center text-sm text-stone-500">{empty}</p>
      ) : (
        <ul className="space-y-2">{items}</ul>
      )}
    </section>
  );
}

function OrderItem({ order }: { order: OrderLite }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-campo-border bg-campo-bg/35 px-3 py-2">
      <span className="min-w-0">
        <span className="block truncate text-sm text-forest-100">{order.delivery_name || "Pedido"}</span>
        <span className="block text-xs text-stone-500">{formatBRL(order.total_cents)} · pgto {order.payment_status} · {formatDate(order.created_at)}</span>
      </span>
      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[0.65rem] ${ORDER_STATUS_STYLE[order.status] ?? ""}`}>{ORDER_STATUS_LABEL[order.status] ?? order.status}</span>
    </li>
  );
}

function ExperienceBookingItem({ booking }: { booking: ExperienceBooking }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-campo-border bg-campo-bg/35 px-3 py-2">
      <span className="min-w-0">
        <span className="block truncate text-sm text-forest-100">{formatBRL(booking.total_cents)}</span>
        <span className="block text-xs text-stone-500">{new Date(`${booking.date}T00:00:00`).toLocaleDateString("pt-BR")} · {booking.people} pessoa(s)</span>
      </span>
      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[0.65rem] ${EXP_STATUS_STYLE[booking.status] ?? ""}`}>{EXP_STATUS_LABEL[booking.status] ?? booking.status}</span>
    </li>
  );
}

function fallbackFor(role: UserRole) {
  if (role === "produtor") return "PR";
  if (role === "entregador") return "EN";
  if (role === "parceiro") return "EX";
  if (role === "super_admin") return "SA";
  return "CL";
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("pt-BR");
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("pt-BR");
}
