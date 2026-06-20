import { requireRole } from "@/lib/guard";
import { greeting } from "@/lib/greeting";
import { createClient } from "@/lib/supabase/server";
import { AppShell, ENTREGADOR_NAV } from "@/components/AppShell";
import { formatBRL } from "@/lib/catalog";
import { acceptDelivery } from "./actions";
import { DeliveryProof } from "@/components/DeliveryProof";

type ItemRow = { product_name: string; quantity: number };
type DeliveryRow = {
  id: string; total_cents: number; delivery_fee_cents: number; status: string;
  delivery_name: string | null; delivery_address: string | null; delivery_phone: string | null;
  delivery_notes: string | null; created_at: string; items: ItemRow[];
};

const SELECT = "id, total_cents, delivery_fee_cents, status, delivery_name, delivery_address, delivery_phone, delivery_notes, created_at, items:order_items(product_name, quantity)";

export default async function EntregadorPage() {
  const { user, profile } = await requireRole("entregador");
  const supabase = await createClient();

  const [{ data: avail }, { data: mineData }] = await Promise.all([
    supabase.from("orders").select(SELECT).eq("status", "saiu_entrega").is("delivery_person_id", null).eq("self_delivery", false).order("created_at", { ascending: true }),
    supabase.from("orders").select(SELECT).eq("delivery_person_id", user.id).order("created_at", { ascending: false }),
  ]);

  const available = (avail ?? []) as unknown as DeliveryRow[];
  const mine = (mineData ?? []) as unknown as DeliveryRow[];
  const active = mine.filter((o) => o.status === "saiu_entrega");
  const done = mine.filter((o) => o.status === "entregue");

  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const ganhosMes = done.filter((o) => new Date(o.created_at) >= monthStart).reduce((s, o) => s + o.delivery_fee_cents, 0);

  return (
    <AppShell badge="Entregador" nav={ENTREGADOR_NAV} userName={profile?.full_name ?? "Entregador"} title={greeting(profile?.full_name)} subtitle="Suas entregas e ganhos.">
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Disponíveis" value={String(available.length)} accent={available.length > 0} />
        <Stat label="Em rota" value={String(active.length)} />
        <Stat label="Concluídas (mês)" value={String(done.filter((o) => new Date(o.created_at) >= monthStart).length)} />
        <Stat label="Ganhos (mês)" value={formatBRL(ganhosMes)} accent />
      </div>

      <section className="mb-8">
        <h2 className="mb-3 font-serif text-lg text-forest-100">Minhas entregas em rota</h2>
        {active.length === 0 ? (
          <Empty>Você não tem entregas em rota.</Empty>
        ) : (
          <div className="space-y-3">{active.map((o) => <Card key={o.id} o={o} mode="complete" />)}</div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-serif text-lg text-forest-100">Entregas disponíveis</h2>
        {available.length === 0 ? (
          <Empty>Nenhuma entrega disponível agora. Volte em breve.</Empty>
        ) : (
          <div className="space-y-3">{available.map((o) => <Card key={o.id} o={o} mode="accept" />)}</div>
        )}
      </section>
    </AppShell>
  );
}

function Card({ o, mode }: { o: DeliveryRow; mode: "accept" | "complete" }) {
  const accept = acceptDelivery.bind(null, o.id);
  const itemCount = o.items.reduce((s, it) => s + Number(it.quantity), 0);
  return (
    <article className="glass rounded-2xl border border-campo-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-serif text-forest-100">{o.delivery_name || "Cliente"}</p>
          <p className="text-sm text-stone-400">{o.delivery_address || "Endereço não informado"}</p>
          <p className="mt-1 text-xs text-stone-500">
            {itemCount} item(ns) · pedido {formatBRL(o.total_cents)}
            {o.delivery_phone ? ` · ${o.delivery_phone}` : ""}
          </p>
          {o.delivery_notes && <p className="mt-1 text-xs text-stone-500">Obs: {o.delivery_notes}</p>}
        </div>
        <div className="text-right">
          <p className="text-xs text-stone-500">Você ganha</p>
          <p className="font-serif text-lg text-gold">{formatBRL(o.delivery_fee_cents)}</p>
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        {mode === "accept" ? (
          <form action={accept}>
            <button className="rounded-lg bg-gold px-5 py-2 text-sm font-medium text-campo-bg transition hover:bg-gold-light">Aceitar entrega</button>
          </form>
        ) : (
          <DeliveryProof orderId={o.id} back="/entregador" />
        )}
      </div>
    </article>
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

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-campo-border glass p-8 text-center text-sm text-stone-400">{children}</div>;
}
