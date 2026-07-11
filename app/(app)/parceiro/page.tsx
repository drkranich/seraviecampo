import Link from "next/link";
import { requireRole } from "@/lib/guard";
import { greeting } from "@/lib/greeting";
import { createClient } from "@/lib/supabase/server";
import { AppShell, PARCEIRO_NAV } from "@/components/AppShell";
import { AreaChart } from "@/components/charts";
import { stripeEnabled } from "@/lib/stripe";
import { getPlanById, experiencePlanIdOf, experienceCommissionPct } from "@/lib/plans-db";
import { formatMoney } from "@/lib/money";
import {
  EXP_STATUS_LABEL,
  EXP_STATUS_STYLE,
  formatExpPrice,
  type Experience,
  type ExperienceBooking,
} from "@/lib/experiences";
import { getSite } from "@/lib/site";

type CustomerPreview = { id: string; full_name: string | null; display_name: string | null };

function startOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

export default async function ParceiroPage() {
  const { user, profile } = await requireRole("parceiro");
  const supabase = await createClient();
  const site = await getSite(supabase);
  const panel = site.panel_content.parceiro;

  const [{ data: expData }, { data: bookData }, { data: acc }] = await Promise.all([
    supabase.from("experiences").select("*").eq("producer_id", user.id).order("created_at", { ascending: false }),
    supabase.from("experience_bookings").select("*").eq("producer_id", user.id).order("created_at", { ascending: false }),
    supabase.from("profiles").select("stripe_account_id, stripe_charges_enabled, currency").eq("id", user.id).single(),
  ]);

  const exps = (expData ?? []) as Experience[];
  const bookings = (bookData ?? []) as ExperienceBooking[];
  const currency = (acc?.currency as string) || exps[0]?.currency || "BRL";
  const connected = Boolean(acc?.stripe_account_id) && Boolean(acc?.stripe_charges_enabled);
  const planId = await experiencePlanIdOf(supabase, user.id);
  const plan = await getPlanById(supabase, planId);
  const pct = await experienceCommissionPct(supabase, user.id);

  const customerIds = [...new Set(bookings.map((booking) => booking.customer_id))];
  const { data: customersData } = await supabase
    .from("profiles")
    .select("id, full_name, display_name")
    .in("id", customerIds.length ? customerIds : ["00000000-0000-0000-0000-000000000000"]);
  const customerName = new Map(
    ((customersData ?? []) as CustomerPreview[]).map((customer) => [
      customer.id,
      customer.full_name || customer.display_name || "Cliente",
    ])
  );

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const ativos = exps.filter((experience) => !experience.archived && experience.active);
  const rascunhos = exps.filter((experience) => !experience.archived && !experience.active);
  const paid = bookings.filter((booking) => booking.payment_status === "pago");
  const pending = bookings.filter((booking) => booking.status === "pendente");
  const paidMonth = paid.filter((booking) => new Date(booking.created_at) >= monthStart);
  const receitaMes = paidMonth.reduce((total, booking) => total + (booking.total_cents || 0), 0);
  const receitaTotal = paid.reduce((total, booking) => total + (booking.total_cents || 0), 0);
  const commissionMonth = Math.round((receitaMes * pct) / 100);
  const netMonth = receitaMes - commissionMonth;
  const upcoming = bookings
    .filter((booking) => booking.status !== "cancelado" && booking.status !== "concluido" && new Date(`${booking.date}T${booking.time || "00:00"}`) >= now)
    .sort((a, b) => new Date(`${a.date}T${a.time || "00:00"}`).getTime() - new Date(`${b.date}T${b.time || "00:00"}`).getTime());
  const expName = new Map(exps.map((experience) => [experience.id, experience.title]));

  const labels: string[] = [];
  const series: number[] = [];
  for (let i = 13; i >= 0; i--) {
    const date = startOfDay(new Date(now));
    date.setDate(date.getDate() - i);
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    labels.push(date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }));
    series.push(
      paid
        .filter((booking) => {
          const created = new Date(booking.created_at);
          return created >= date && created < next;
        })
        .reduce((total, booking) => total + booking.total_cents, 0) / 100
    );
  }

  return (
    <AppShell
      badge="Parceiro de Experiências"
      nav={PARCEIRO_NAV}
      userName={profile?.full_name ?? "Parceiro"}
      profileHref="/parceiro/perfil"
      title={greeting(profile?.full_name)}
      subtitle={panel.subtitle}
    >
      <section className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="glass rounded-2xl border border-campo-border p-6 lg:col-span-2">
          <p className="text-xs uppercase tracking-wider text-gold">{panel.label}</p>
          <h2 className="mt-2 max-w-2xl font-serif text-3xl text-forest-100">{panel.title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-400">
            {panel.text}
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <ActionTile href="/parceiro/experiencias" label="Ativas" value={String(ativos.length)} />
            <ActionTile href="/parceiro/experiencias" label="Pendentes" value={String(pending.length)} />
            <ActionTile href="/parceiro/experiencias" label="Agenda" value={String(upcoming.length)} />
            <ActionTile href="/parceiro/financeiro" label="A receber" value={formatMoney(netMonth, currency)} />
          </div>
        </div>

        <aside className="glass rounded-2xl border border-campo-border p-6">
          <p className="text-xs uppercase tracking-wider text-stone-500">Próxima ação</p>
          {!connected ? (
            <>
              <h3 className="mt-2 font-serif text-xl text-forest-100">Conecte seus recebimentos</h3>
              <p className="mt-2 text-sm text-stone-400">A conta Stripe libera pagamento online das reservas.</p>
              <Link href="/parceiro/financeiro" className="mt-4 inline-block rounded-lg bg-gold px-4 py-2 text-sm font-medium text-campo-bg transition hover:bg-gold-light">Conectar Stripe</Link>
            </>
          ) : pending.length > 0 ? (
            <>
              <h3 className="mt-2 font-serif text-xl text-forest-100">Confirme reservas pendentes</h3>
              <p className="mt-2 text-sm text-stone-400">Dê resposta rápida para manter a confiança do visitante.</p>
              <Link href="/parceiro/experiencias" className="mt-4 inline-block rounded-lg bg-gold px-4 py-2 text-sm font-medium text-campo-bg transition hover:bg-gold-light">Ver reservas</Link>
            </>
          ) : ativos.length === 0 ? (
            <>
              <h3 className="mt-2 font-serif text-xl text-forest-100">Publique sua primeira experiência</h3>
              <p className="mt-2 text-sm text-stone-400">Comece por uma vivência curta, com preço por pessoa e capacidade clara.</p>
              <Link href="/parceiro/experiencias/nova" className="mt-4 inline-block rounded-lg bg-gold px-4 py-2 text-sm font-medium text-campo-bg transition hover:bg-gold-light">Criar experiência</Link>
            </>
          ) : (
            <>
              <h3 className="mt-2 font-serif text-xl text-forest-100">Mantenha sua agenda viva</h3>
              <p className="mt-2 text-sm text-stone-400">Revise disponibilidade, fotos e descrições das experiências ativas.</p>
              <Link href="/parceiro/experiencias" className="mt-4 inline-block rounded-lg border border-campo-border px-4 py-2 text-sm text-stone-200 transition hover:border-gold/50">Gerenciar vitrine</Link>
            </>
          )}
        </aside>
      </section>

      {!connected && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold/30 bg-gold/5 p-4">
          <p className="text-sm text-stone-300">Conecte sua conta Stripe para receber pelas reservas das suas experiências.</p>
          <Link href="/parceiro/financeiro" className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-campo-bg transition hover:bg-gold-light">Conectar recebimentos</Link>
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Experiências ativas" value={String(ativos.length)} />
        <Stat label="Rascunhos" value={String(rascunhos.length)} />
        <Stat label="Reservas pagas" value={String(paid.length)} />
        <Stat label="Receita total" value={formatExpPrice(receitaTotal, currency)} accent />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <section className="glass rounded-2xl border border-campo-border p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-lg text-forest-100">Receita confirmada</h2>
            <span className="rounded-lg border border-campo-border px-3 py-1 text-xs text-stone-400">Últimos 14 dias</span>
          </div>
          <AreaChart data={series} labels={labels} />
        </section>

        <section className="glass rounded-2xl border border-campo-border p-5">
          <h2 className="mb-3 font-serif text-lg text-forest-100">Plano e repasse</h2>
          <p className="font-serif text-xl text-gold">{plan?.name ?? "Experiências - Inicial"}</p>
          <p className="mt-1 text-sm text-stone-400">Mensalidade {formatMoney(plan?.price_cents ?? 0, currency)} · comissão {pct}% por reserva.</p>
          <div className="mt-4 space-y-2">
            <Line label="Receita do mês" value={formatMoney(receitaMes, currency)} />
            <Line label={`Comissão (${pct}%)`} value={`- ${formatMoney(commissionMonth, currency)}`} />
            <Line label="A receber" value={formatMoney(netMonth, currency)} accent />
          </div>
          {!stripeEnabled() && <p className="mt-3 text-xs text-stone-500">Pagamentos em configuração pela plataforma.</p>}
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="glass rounded-2xl border border-campo-border p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-lg text-forest-100">Agenda e reservas recentes</h2>
            <Link href="/parceiro/experiencias" className="text-xs text-gold hover:underline">Ver todas</Link>
          </div>
          {bookings.length === 0 ? (
            <p className="py-8 text-center text-sm text-stone-500">Nenhuma reserva ainda. Crie sua primeira experiência.</p>
          ) : (
            <ul className="space-y-3">
              {bookings.slice(0, 6).map((booking) => (
                <li key={booking.id} className="flex items-center justify-between gap-2 rounded-lg border border-campo-border bg-campo-bg/35 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-forest-100">{expName.get(booking.experience_id) ?? "Experiência"}</p>
                    <p className="text-xs text-stone-500">
                      {customerName.get(booking.customer_id) ?? "Cliente"} · {new Date(`${booking.date}T00:00:00`).toLocaleDateString("pt-BR")}
                      {booking.time ? ` às ${booking.time}` : ""} · {booking.people} pessoa(s) · {formatExpPrice(booking.total_cents, booking.currency)}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[0.65rem] ${EXP_STATUS_STYLE[booking.status]}`}>{EXP_STATUS_LABEL[booking.status]}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="glass rounded-2xl border border-campo-border p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-lg text-forest-100">Vitrine</h2>
            <Link href="/parceiro/experiencias/nova" className="text-xs text-gold hover:underline">Nova</Link>
          </div>
          {exps.length === 0 ? (
            <p className="py-8 text-center text-sm text-stone-500">Nenhuma experiência criada.</p>
          ) : (
            <ul className="space-y-3">
              {exps.slice(0, 5).map((experience) => (
                <li key={experience.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-forest-100">{experience.title}</p>
                    <p className="text-xs text-stone-500">{experience.archived ? "Arquivada" : experience.active ? "Publicada" : "Rascunho"}</p>
                  </div>
                  <Link href={`/parceiro/experiencias/${experience.id}`} className="rounded-lg border border-campo-border px-3 py-1.5 text-xs text-stone-200 transition hover:border-gold/50">Editar</Link>
                </li>
              ))}
            </ul>
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
      <span className="mt-2 block font-serif text-xl text-forest-100">{value}</span>
    </Link>
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

function Line({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-campo-border bg-campo-bg/35 px-3 py-2">
      <p className="text-xs uppercase tracking-wider text-stone-500">{label}</p>
      <p className={`mt-1 font-serif text-base ${accent ? "text-gold" : "text-forest-100"}`}>{value}</p>
    </div>
  );
}
