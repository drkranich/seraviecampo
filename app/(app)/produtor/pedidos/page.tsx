import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { AppShell, PRODUTOR_NAV } from "@/components/AppShell";
import { formatBRL, UNIT_LABEL } from "@/lib/catalog";
import {
  ORDER_STATUS_LABEL,
  ORDER_STATUS_STYLE,
  PAYMENT_LABEL,
  type Order,
  type OrderItem,
  type OrderStatus,
  type PaymentMethod,
} from "@/lib/orders";
import { advanceOrderStatus, dispatchOrder, selfDeliverOrder, cancelOrder } from "./actions";

type OrderRow = Order & { items: OrderItem[] };

export default async function PedidosProdutorPage() {
  const { user } = await requireRole("produtor");
  const supabase = await createClient();

  const { data } = await supabase
    .from("orders")
    .select("*, items:order_items(*)")
    .eq("producer_id", user.id)
    .order("created_at", { ascending: false });

  const orders = (data ?? []) as unknown as OrderRow[];
  const ativos = orders.filter((o) => o.status !== "entregue" && o.status !== "cancelado");
  const finalizados = orders.filter((o) => o.status === "entregue" || o.status === "cancelado");

  return (
    <AppShell badge="Produtor Rural" nav={PRODUTOR_NAV} title="Pedidos recebidos" subtitle={`${ativos.length} em andamento`}>
      {orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-campo-border glass p-10 text-center text-stone-400">
          Nenhum pedido recebido ainda.
        </div>
      ) : (
        <div className="space-y-8">
          {ativos.length > 0 && (
            <section className="space-y-4">
              {ativos.map((o) => (
                <OrderCard key={o.id} order={o} />
              ))}
            </section>
          )}
          {finalizados.length > 0 && (
            <section>
              <h2 className="mb-3 font-serif text-lg text-stone-400">Finalizados</h2>
              <div className="space-y-4">
                {finalizados.map((o) => (
                  <OrderCard key={o.id} order={o} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </AppShell>
  );
}

function OrderCard({ order: o }: { order: OrderRow }) {
  const cancel = cancelOrder.bind(null, o.id);
  const toPreparing = advanceOrderStatus.bind(null, o.id, "preparando");
  const dispatch = dispatchOrder.bind(null, o.id);
  const selfDeliver = selfDeliverOrder.bind(null, o.id);
  const markDelivered = advanceOrderStatus.bind(null, o.id, "entregue");

  return (
    <article className="rounded-2xl border border-campo-border glass p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-campo-border pb-3">
        <div>
          <p className="font-serif text-lg text-forest-100">{o.delivery_name || "Cliente"}</p>
          <p className="text-xs text-stone-500">
            {new Date(o.created_at).toLocaleString("pt-BR")}
            {o.payment_method ? ` · ${PAYMENT_LABEL[o.payment_method as PaymentMethod]}` : ""}
          </p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs ${ORDER_STATUS_STYLE[o.status]}`}>
          {ORDER_STATUS_LABEL[o.status]}
        </span>
      </div>

      <ul className="mt-3 space-y-1 text-sm">
        {o.items.map((it) => (
          <li key={it.id} className="flex justify-between text-stone-300">
            <span>{it.quantity} {UNIT_LABEL[it.unit]} · {it.product_name}</span>
            <span className="text-stone-400">{formatBRL(it.line_total_cents)}</span>
          </li>
        ))}
      </ul>

      {(o.delivery_address || o.delivery_phone) && (
        <p className="mt-3 text-xs text-stone-500">
          {o.delivery_address}{o.delivery_address && o.delivery_phone ? " · " : ""}{o.delivery_phone}
          {o.delivery_notes ? ` — ${o.delivery_notes}` : ""}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-campo-border pt-3">
        <span className="font-serif text-lg text-gold">{formatBRL(o.total_cents)}</span>
        <div className="flex flex-wrap items-center gap-3">
          {o.status !== "entregue" && o.status !== "cancelado" && (
            <form action={cancel}>
              <button className="text-xs text-red-400 transition hover:text-red-300">Cancelar</button>
            </form>
          )}
          {o.status === "novo" && (
            <form action={toPreparing}>
              <button className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-campo-bg transition hover:bg-gold-light">Aceitar e preparar</button>
            </form>
          )}
          {o.status === "preparando" && (
            <>
              <form action={dispatch}>
                <button className="rounded-lg border border-gold/50 px-4 py-2 text-sm text-gold transition hover:bg-gold/10">Despachar p/ entregador</button>
              </form>
              <form action={selfDeliver}>
                <button className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-campo-bg transition hover:bg-gold-light">Vou entregar eu mesmo</button>
              </form>
            </>
          )}
          {o.status === "saiu_entrega" && o.self_delivery && (
            <form action={markDelivered}>
              <button className="rounded-lg bg-leaf px-4 py-2 text-sm font-medium text-campo-bg transition hover:bg-leaf-light">Marcar como entregue</button>
            </form>
          )}
          {o.status === "saiu_entrega" && !o.self_delivery && !o.delivery_person_id && (
            <>
              <span className="text-xs text-stone-500">Aguardando um entregador aceitar…</span>
              <form action={selfDeliver}>
                <button className="rounded-lg border border-gold/50 px-4 py-2 text-sm text-gold transition hover:bg-gold/10">Assumir a entrega</button>
              </form>
            </>
          )}
          {o.status === "saiu_entrega" && !o.self_delivery && o.delivery_person_id && (
            <span className="text-xs text-blue-300">Entregador a caminho</span>
          )}
        </div>
      </div>
    </article>
  );
}
