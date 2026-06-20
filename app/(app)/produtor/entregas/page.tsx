import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { AppShell, PRODUTOR_NAV } from "@/components/AppShell";
import { formatBRL } from "@/lib/catalog";
import { ORDER_STATUS_LABEL, ORDER_STATUS_STYLE, type OrderStatus } from "@/lib/orders";

type Ord = { id: string; status: OrderStatus; self_delivery: boolean; delivery_person_id: string | null; delivery_name: string | null; delivery_address: string | null; total_cents: number; delivery_fee_cents: number; created_at: string };

export default async function EntregasProdutorPage() {
  const { user, profile } = await requireRole("produtor");
  const supabase = await createClient();

  const { data } = await supabase.from("orders")
    .select("id, status, self_delivery, delivery_person_id, delivery_name, delivery_address, total_cents, delivery_fee_cents, created_at")
    .eq("producer_id", user.id).in("status", ["preparando", "saiu_entrega", "entregue"]).order("created_at", { ascending: false });
  const orders = (data ?? []) as Ord[];

  const couriers = [...new Set(orders.map((o) => o.delivery_person_id).filter(Boolean))] as string[];
  const { data: cp } = await supabase.from("profiles").select("id, full_name").in("id", couriers.length ? couriers : ["00000000-0000-0000-0000-000000000000"]);
  const cname = new Map((cp ?? []).map((c) => [c.id as string, (c.full_name || "Entregador") as string]));

  const aguardando = orders.filter((o) => o.status === "preparando").length;
  const emRota = orders.filter((o) => o.status === "saiu_entrega").length;
  const entregues = orders.filter((o) => o.status === "entregue").length;

  function quem(o: Ord) {
    if (o.self_delivery) return "Você (entrega própria)";
    if (o.delivery_person_id) return cname.get(o.delivery_person_id) ?? "Entregador";
    if (o.status === "saiu_entrega") return "Aguardando entregador";
    return "—";
  }

  return (
    <AppShell badge="Produtor Rural" nav={PRODUTOR_NAV} userName={profile?.full_name ?? "Produtor"} profileHref="/produtor/perfil" title="Entregas" subtitle="Acompanhe quem leva cada pedido.">
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card label="A despachar" value={String(aguardando)} />
        <Card label="Em rota" value={String(emRota)} accent={emRota > 0} />
        <Card label="Entregues" value={String(entregues)} />
      </div>
      {orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-campo-border glass p-10 text-center text-stone-400">Nenhuma entrega em andamento. Aceite pedidos em “Pedidos” e despache para um entregador (ou entregue você mesmo).</div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <article key={o.id} className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-campo-border p-4">
              <div className="min-w-0">
                <p className="font-serif text-forest-100">{o.delivery_name || "Cliente"}</p>
                <p className="text-xs text-stone-500">{o.delivery_address || "Endereço não informado"}</p>
                <p className="mt-1 text-xs text-stone-400">Entrega por: <span className="text-stone-300">{quem(o)}</span> · frete {formatBRL(o.delivery_fee_cents)}</p>
              </div>
              <span className={`rounded-full border px-3 py-1 text-xs ${ORDER_STATUS_STYLE[o.status]}`}>{ORDER_STATUS_LABEL[o.status]}</span>
            </article>
          ))}
        </div>
      )}
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
