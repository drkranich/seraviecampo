import Link from "next/link";
import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { AppShell, CLIENTE_NAV } from "@/components/AppShell";
import { OrdersCalendar } from "@/components/OrdersCalendar";
import { formatBRL, UNIT_LABEL } from "@/lib/catalog";
import {
  ORDER_STATUS_LABEL, ORDER_STATUS_STYLE, PAYMENT_LABEL, PAYMENT_METHODS,
  PAYMENT_STATUS_LABEL, PAYMENT_STATUS_STYLE,
  type Order, type OrderItem, type PaymentMethod, type PaymentStatus,
} from "@/lib/orders";
import { producerName, type PublicProfile } from "@/lib/profile";
import { OpenDisputeButton } from "@/components/OpenDisputeButton";
import { cancelOrder } from "./actions";

type OrderRow = Order & { producer: Partial<PublicProfile> | null; items: OrderItem[] };

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const CANCEL_WINDOW_MS = 24 * 60 * 60 * 1000;

export default async function PedidosClientePage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string; mes?: string; pagamento?: string; fornecedor?: string; canceled?: string; pago?: string; disputa?: string; error?: string }>;
}) {
  const { profile } = await requireRole("cliente");
  const sp = await searchParams;
  const supabase = await createClient();

  const { data } = await supabase
    .from("orders")
    .select("*, producer:profiles!orders_producer_id_fkey(id, full_name, farm_name, display_name), items:order_items(*)")
    .order("created_at", { ascending: false });
  const orders = (data ?? []) as unknown as OrderRow[];

  const now = new Date();
  const selYear = sp.ano ? Number(sp.ano) : now.getFullYear();
  const selMonth = sp.mes ? Number(sp.mes) : now.getMonth() + 1;

  const years = [...new Set(orders.map((o) => new Date(o.created_at).getFullYear()))].sort((a, b) => b - a);
  const producersMap = new Map<string, string>();
  for (const o of orders) if (o.producer?.id) producersMap.set(o.producer.id, producerName(o.producer));
  const producers = [...producersMap.entries()];

  const matchesPF = (o: OrderRow) =>
    (!sp.pagamento || o.payment_method === sp.pagamento) &&
    (!sp.fornecedor || o.producer?.id === sp.fornecedor);

  const filtered = orders.filter(
    (o) => matchesPF(o) && (!sp.ano || new Date(o.created_at).getFullYear() === selYear) && (!sp.mes || new Date(o.created_at).getMonth() + 1 === selMonth)
  );
  const validF = filtered.filter((o) => o.status !== "cancelado");

  const totalGasto = validF.reduce((s, o) => s + o.total_cents, 0);
  const ticket = validF.length ? Math.round(totalGasto / validF.length) : 0;

  const qtyMap = new Map<string, number>();
  for (const o of validF) for (const it of o.items) qtyMap.set(it.product_name, (qtyMap.get(it.product_name) ?? 0) + Number(it.quantity));
  const ranked = [...qtyMap.entries()].sort((a, b) => b[1] - a[1]);
  const maisConsumidos = ranked.slice(0, 3);
  const menosConsumidos = ranked.slice(-3).reverse();

  const dayMap = new Map<number, { count: number; total: number }>();
  for (const o of orders) {
    const d = new Date(o.created_at);
    if (d.getFullYear() === selYear && d.getMonth() + 1 === selMonth && matchesPF(o) && o.status !== "cancelado") {
      const day = d.getDate();
      const cur = dayMap.get(day) ?? { count: 0, total: 0 };
      cur.count++; cur.total += o.total_cents;
      dayMap.set(day, cur);
    }
  }

  const selectCls = "rounded-lg border border-campo-border bg-campo-bg px-3 py-2 text-sm text-stone-100 outline-none focus:border-gold";

  return (
    <AppShell badge="Clube Gourmet" nav={CLIENTE_NAV} userName={profile?.full_name ?? "Cliente"} title="Meus pedidos" subtitle="Seu histórico, gastos e calendário de compras.">
      {sp.canceled && <div className="mb-4 rounded-lg border border-forest-700 bg-forest-900/40 px-3 py-2 text-sm text-forest-200">Pedido cancelado.</div>}
      {sp.pago && <div className="mb-4 rounded-lg border border-forest-700 bg-forest-900/40 px-3 py-2 text-sm text-forest-200">Pagamento confirmado.</div>}
      {sp.disputa && <div className="mb-4 rounded-lg border border-blue-900/60 bg-blue-950/40 px-3 py-2 text-sm text-blue-300">Sua solicitação foi registrada. Nossa equipe vai analisar.</div>}
      {sp.error && <div className="mb-4 rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">{decodeURIComponent(sp.error)}</div>}

      <div className="mb-6 flex items-start gap-2 rounded-lg border border-gold/30 bg-gold/5 px-4 py-3 text-sm text-stone-300">
        <span aria-hidden className="mt-0.5 text-gold">i</span>
        <p><strong className="text-gold">Política de cancelamento:</strong> você pode cancelar uma compra em até <strong>24 horas</strong> após a sua realização, enquanto o pedido ainda estiver como Novo ou Em preparo. Depois desse prazo, o cancelamento não fica mais disponível no app.</p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Gasto (filtro)" value={formatBRL(totalGasto)} accent />
        <Stat label="Pedidos" value={String(filtered.length)} />
        <Stat label="Ticket médio" value={formatBRL(ticket)} />
        <Stat label="Fornecedores" value={String(new Set(validF.map((o) => o.producer?.id)).size)} />
      </div>

      <form className="mb-6 flex flex-wrap items-end gap-3" action="/cliente/pedidos">
        <Field label="Ano">
          <select name="ano" defaultValue={sp.ano ?? ""} className={selectCls}>
            <option value="">Todos</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </Field>
        <Field label="Mês">
          <select name="mes" defaultValue={sp.mes ?? ""} className={selectCls}>
            <option value="">Todos</option>
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        </Field>
        <Field label="Pagamento">
          <select name="pagamento" defaultValue={sp.pagamento ?? ""} className={selectCls}>
            <option value="">Todos</option>
            {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{PAYMENT_LABEL[m]}</option>)}
          </select>
        </Field>
        <Field label="Fornecedor">
          <select name="fornecedor" defaultValue={sp.fornecedor ?? ""} className={selectCls}>
            <option value="">Todos</option>
            {producers.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
        </Field>
        <button className="rounded-lg bg-gold px-5 py-2 text-sm font-medium text-campo-bg transition hover:bg-gold-light">Filtrar</button>
        <Link href="/cliente/pedidos" className="px-2 py-2 text-sm text-stone-400 hover:text-gold">Limpar</Link>
      </form>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="glass rounded-2xl border border-campo-border p-5 lg:col-span-2">
          <OrdersCalendar year={selYear} month={selMonth} dayMap={dayMap} />
        </section>

        <section className="glass rounded-2xl border border-campo-border p-5">
          <h2 className="mb-3 font-serif text-lg text-forest-100">Mais consumidos</h2>
          {maisConsumidos.length === 0 ? (
            <p className="text-sm text-stone-500">Sem dados.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {maisConsumidos.map(([n, q]) => (
                <li key={n} className="flex justify-between"><span className="text-stone-300">{n}</span><span className="text-gold">{q}</span></li>
              ))}
            </ul>
          )}
          <h2 className="mb-3 mt-5 font-serif text-lg text-forest-100">Menos consumidos</h2>
          {menosConsumidos.length === 0 ? (
            <p className="text-sm text-stone-500">Sem dados.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {menosConsumidos.map(([n, q]) => (
                <li key={n} className="flex justify-between"><span className="text-stone-300">{n}</span><span className="text-stone-400">{q}</span></li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <h2 className="mb-3 mt-8 font-serif text-xl text-forest-100">Histórico de compras</h2>
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-campo-border glass p-10 text-center text-stone-400">
          Nenhum pedido com esses filtros.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((o) => {
            const age = Date.now() - new Date(o.created_at).getTime();
            const cancelable = (o.status === "novo" || o.status === "preparando") && age <= CANCEL_WINDOW_MS;
            const cancel = cancelOrder.bind(null, o.id);
            return (
              <article key={o.id} className="glass rounded-2xl border border-campo-border p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-campo-border pb-3">
                  <div>
                    <p className="font-serif text-lg text-forest-100">{producerName(o.producer)}</p>
                    <p className="text-xs text-stone-500">
                      {new Date(o.created_at).toLocaleString("pt-BR")}
                      {o.payment_method ? ` · ${PAYMENT_LABEL[o.payment_method as PaymentMethod]}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`rounded-full border px-3 py-1 text-xs ${ORDER_STATUS_STYLE[o.status]}`}>
                      {ORDER_STATUS_LABEL[o.status]}
                    </span>
                    <span className={`rounded-full border px-2.5 py-0.5 text-[0.65rem] ${PAYMENT_STATUS_STYLE[o.payment_status as PaymentStatus]}`}>
                      {PAYMENT_STATUS_LABEL[o.payment_status as PaymentStatus]}
                    </span>
                  </div>
                </div>
                <ul className="mt-3 space-y-1 text-sm">
                  {o.items.map((it) => (
                    <li key={it.id} className="flex justify-between text-stone-300">
                      <span>{it.quantity} {UNIT_LABEL[it.unit]} · {it.product_name}</span>
                      <span className="text-stone-400">{formatBRL(it.line_total_cents)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-campo-border pt-3">
                  <span className="font-serif text-lg text-gold">{formatBRL(o.total_cents)}</span>
                  <div className="flex flex-wrap items-center gap-3">
                    {o.payment_status === "pendente" && (
                      <Link href="/cliente/pagamento" className="rounded-lg bg-gold px-3 py-1.5 text-xs font-medium text-campo-bg transition hover:bg-gold-light">Finalizar pagamento</Link>
                    )}
                    {cancelable ? (
                      <form action={cancel}>
                        <button className="rounded-lg border border-red-900/50 px-3 py-1.5 text-xs text-red-300 transition hover:bg-red-950/40">Cancelar compra</button>
                      </form>
                    ) : (o.status === "novo" || o.status === "preparando") ? (
                      <span className="text-xs text-stone-600">Prazo de cancelamento (24h) expirado</span>
                    ) : null}
                    <OpenDisputeButton orderId={o.id} back="/cliente/pedidos" />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </AppShell>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-wider text-stone-500">{label}</span>
      {children}
    </label>
  );
}
