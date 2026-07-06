import Link from "next/link";
import { requireRole } from "@/lib/guard";
import { greeting } from "@/lib/greeting";
import { createClient } from "@/lib/supabase/server";
import { AppShell, ENTREGADOR_NAV } from "@/components/AppShell";
import { PanelNotice } from "@/components/PanelNotice";
import { AreaChart } from "@/components/charts";
import { formatBRL } from "@/lib/catalog";
import { acceptDelivery } from "./actions";
import { DeliveryProof } from "@/components/DeliveryProof";

type ItemRow = { product_name: string; quantity: number };
type DeliveryRow = {
  id: string;
  total_cents: number;
  delivery_fee_cents: number;
  status: string;
  delivery_name: string | null;
  delivery_address: string | null;
  delivery_phone: string | null;
  delivery_notes: string | null;
  created_at: string;
  items: ItemRow[];
};

const SELECT = "id, total_cents, delivery_fee_cents, status, delivery_name, delivery_address, delivery_phone, delivery_notes, created_at, items:order_items(product_name, quantity)";

function startOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

export default async function EntregadorPage() {
  const { user, profile } = await requireRole("entregador");
  const supabase = await createClient();

  const [{ data: avail }, { data: mineData }] = await Promise.all([
    supabase
      .from("orders")
      .select(SELECT)
      .eq("status", "saiu_entrega")
      .is("delivery_person_id", null)
      .eq("self_delivery", false)
      .order("created_at", { ascending: true }),
    supabase
      .from("orders")
      .select(SELECT)
      .eq("delivery_person_id", user.id)
      .order("created_at", { ascending: false })
      .limit(60),
  ]);

  const available = (avail ?? []) as unknown as DeliveryRow[];
  const mine = (mineData ?? []) as unknown as DeliveryRow[];
  const active = mine.filter((order) => order.status === "saiu_entrega");
  const done = mine.filter((order) => order.status === "entregue");

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const todayStart = startOfDay(now);
  const ganhosMes = done.filter((order) => new Date(order.created_at) >= monthStart).reduce((total, order) => total + order.delivery_fee_cents, 0);
  const ganhosHoje = done.filter((order) => new Date(order.created_at) >= todayStart).reduce((total, order) => total + order.delivery_fee_cents, 0);
  const concluidasMes = done.filter((order) => new Date(order.created_at) >= monthStart).length;
  const routeGain = active.reduce((total, order) => total + order.delivery_fee_cents, 0);
  const availableGain = available.reduce((total, order) => total + order.delivery_fee_cents, 0);
  const nextStop = active[0];

  const labels: string[] = [];
  const series: number[] = [];
  for (let i = 13; i >= 0; i--) {
    const date = startOfDay(new Date(now));
    date.setDate(date.getDate() - i);
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    labels.push(date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }));
    series.push(
      done
        .filter((order) => {
          const created = new Date(order.created_at);
          return created >= date && created < next;
        })
        .reduce((total, order) => total + order.delivery_fee_cents, 0) / 100
    );
  }

  return (
    <AppShell badge="Entregador" nav={ENTREGADOR_NAV} userName={profile?.full_name ?? "Entregador"} title={greeting(profile?.full_name)} subtitle="Central de rotas, paradas e ganhos.">
      <PanelNotice role="entregador" />

      <section className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="glass rounded-2xl border border-campo-border p-6 lg:col-span-2">
          <p className="text-xs uppercase tracking-wider text-gold">Operação de entrega</p>
          <h2 className="mt-2 max-w-2xl font-serif text-3xl text-forest-100">Veja sua rota, aceite novas entregas e acompanhe ganhos.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-400">
            A tela inicial agora prioriza o que o entregador precisa em campo: próxima parada, valores, contatos e comprovante de entrega.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <ActionTile href="/entregador/rotas" label="Em rota" value={String(active.length)} />
            <ActionTile href="/entregador" label="Disponíveis" value={String(available.length)} />
            <ActionTile href="/entregador/ganhos" label="Hoje" value={formatBRL(ganhosHoje)} />
            <ActionTile href="/entregador/historico" label="Mês" value={formatBRL(ganhosMes)} />
          </div>
        </div>

        <aside className="glass rounded-2xl border border-campo-border p-6">
          <p className="text-xs uppercase tracking-wider text-stone-500">Próxima parada</p>
          {nextStop ? (
            <>
              <h3 className="mt-2 font-serif text-xl text-forest-100">{nextStop.delivery_name || "Cliente"}</h3>
              <p className="mt-2 text-sm text-stone-400">{nextStop.delivery_address || "Endereço não informado"}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {nextStop.delivery_address && <MapLink address={nextStop.delivery_address} />}
                <Link href="/entregador/rotas" className="rounded-lg border border-campo-border px-4 py-2 text-sm text-stone-200 transition hover:border-gold/50">Ver rota</Link>
              </div>
            </>
          ) : available.length > 0 ? (
            <>
              <h3 className="mt-2 font-serif text-xl text-forest-100">Há entregas disponíveis</h3>
              <p className="mt-2 text-sm text-stone-400">Potencial agora: {formatBRL(availableGain)} em taxas de entrega.</p>
              <a href="#entregas-disponiveis" className="mt-4 inline-block rounded-lg bg-gold px-4 py-2 text-sm font-medium text-campo-bg transition hover:bg-gold-light">Escolher entrega</a>
            </>
          ) : (
            <>
              <h3 className="mt-2 font-serif text-xl text-forest-100">Sem rota ativa</h3>
              <p className="mt-2 text-sm text-stone-400">Quando um produtor liberar pedido para entrega, ele aparecerá aqui.</p>
              <Link href="/entregador/historico" className="mt-4 inline-block rounded-lg border border-campo-border px-4 py-2 text-sm text-stone-200 transition hover:border-gold/50">Ver histórico</Link>
            </>
          )}
        </aside>
      </section>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Disponíveis" value={String(available.length)} accent={available.length > 0} />
        <Stat label="Em rota" value={String(active.length)} />
        <Stat label="Concluídas (mês)" value={String(concluidasMes)} />
        <Stat label="Ganhos (mês)" value={formatBRL(ganhosMes)} accent />
      </div>

      <div className="mb-8 grid gap-4 lg:grid-cols-3">
        <section className="glass rounded-2xl border border-campo-border p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-lg text-forest-100">Ganhos por dia</h2>
            <span className="rounded-lg border border-campo-border px-3 py-1 text-xs text-stone-400">Últimos 14 dias</span>
          </div>
          <AreaChart data={series} labels={labels} />
        </section>

        <section className="glass rounded-2xl border border-campo-border p-5">
          <h2 className="mb-4 font-serif text-lg text-forest-100">Resumo da rota</h2>
          <div className="space-y-2">
            <Line label="Paradas em rota" value={String(active.length)} />
            <Line label="A receber nesta rota" value={formatBRL(routeGain)} accent />
            <Line label="Entregas disponíveis" value={String(available.length)} />
            <Line label="Potencial disponível" value={formatBRL(availableGain)} />
          </div>
        </section>
      </div>

      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-serif text-lg text-forest-100">Minhas entregas em rota</h2>
          <Link href="/entregador/rotas" className="text-xs text-gold hover:underline">Ver mapa</Link>
        </div>
        {active.length === 0 ? (
          <Empty>Você não tem entregas em rota.</Empty>
        ) : (
          <div className="space-y-3">{active.map((order) => <Card key={order.id} order={order} mode="complete" />)}</div>
        )}
      </section>

      <section id="entregas-disponiveis">
        <h2 className="mb-3 font-serif text-lg text-forest-100">Entregas disponíveis</h2>
        {available.length === 0 ? (
          <Empty>Nenhuma entrega disponível agora. Volte em breve.</Empty>
        ) : (
          <div className="space-y-3">{available.map((order) => <Card key={order.id} order={order} mode="accept" />)}</div>
        )}
      </section>
    </AppShell>
  );
}

function Card({ order, mode }: { order: DeliveryRow; mode: "accept" | "complete" }) {
  const accept = acceptDelivery.bind(null, order.id);
  const itemCount = order.items.reduce((total, item) => total + Number(item.quantity), 0);

  return (
    <article className="glass rounded-2xl border border-campo-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-serif text-forest-100">{order.delivery_name || "Cliente"}</p>
          <p className="text-sm text-stone-400">{order.delivery_address || "Endereço não informado"}</p>
          <p className="mt-1 text-xs text-stone-500">
            {itemCount} item(ns) · pedido {formatBRL(order.total_cents)}
            {order.delivery_phone ? ` · ${order.delivery_phone}` : ""}
          </p>
          {order.delivery_notes && <p className="mt-1 text-xs text-stone-500">Obs: {order.delivery_notes}</p>}
        </div>
        <div className="text-right">
          <p className="text-xs text-stone-500">Você ganha</p>
          <p className="font-serif text-lg text-gold">{formatBRL(order.delivery_fee_cents)}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap justify-end gap-2">
        {order.delivery_address && <MapLink address={order.delivery_address} />}
        {mode === "accept" ? (
          <form action={accept}>
            <button className="rounded-lg bg-gold px-5 py-2 text-sm font-medium text-campo-bg transition hover:bg-gold-light">Aceitar entrega</button>
          </form>
        ) : (
          <DeliveryProof orderId={order.id} back="/entregador" />
        )}
      </div>
    </article>
  );
}

function MapLink({ address }: { address: string }) {
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  return (
    <a href={maps} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-gold/40 px-4 py-2 text-sm text-gold transition hover:bg-gold/10">
      Abrir mapa
    </a>
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
    <div className="flex items-center justify-between rounded-lg border border-campo-border bg-campo-bg/35 px-3 py-2">
      <span className="text-sm text-stone-400">{label}</span>
      <span className={accent ? "font-serif text-gold" : "font-serif text-forest-100"}>{value}</span>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-campo-border bg-campo-bg/30 p-8 text-center text-sm text-stone-400">{children}</div>;
}
