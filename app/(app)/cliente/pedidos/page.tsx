import Link from "next/link";
import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { AppShell, CLIENTE_NAV } from "@/components/AppShell";
import { formatBRL, UNIT_LABEL } from "@/lib/catalog";
import {
  ORDER_STATUS_LABEL,
  ORDER_STATUS_STYLE,
  PAYMENT_LABEL,
  type Order,
  type OrderItem,
  type PaymentMethod,
} from "@/lib/orders";
import { producerName, type PublicProfile } from "@/lib/profile";

type OrderRow = Order & {
  producer: Partial<PublicProfile> | null;
  items: OrderItem[];
};

export default async function PedidosClientePage({
  searchParams,
}: {
  searchParams: Promise<{ novo?: string }>;
}) {
  await requireRole("cliente");
  const { novo } = await searchParams;
  const supabase = await createClient();

  const { data } = await supabase
    .from("orders")
    .select(
      "*, producer:profiles!orders_producer_id_fkey(full_name, farm_name, display_name), items:order_items(*)"
    )
    .order("created_at", { ascending: false });

  const orders = (data ?? []) as unknown as OrderRow[];

  return (
    <AppShell badge="Clube Gourmet" nav={CLIENTE_NAV} title="Meus pedidos" subtitle={`${orders.length} pedido(s)`}>
      {novo && Number(novo) > 0 && (
        <div className="mb-6 rounded-lg border border-forest-700 bg-forest-900/40 px-4 py-3 text-sm text-forest-200">
          Pedido realizado! {Number(novo) > 1 ? `Foram criados ${novo} pedidos (um por produtor).` : "Seu pedido foi enviado ao produtor."}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-campo-border bg-campo-surface p-10 text-center text-stone-400">
          Você ainda não fez pedidos.{" "}
          <Link href="/cliente" className="text-gold hover:underline">Explore os produtos</Link>.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <article key={o.id} className="rounded-2xl border border-campo-border bg-campo-surface p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-campo-border pb-3">
                <div>
                  <p className="font-serif text-lg text-forest-100">{producerName(o.producer)}</p>
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
                    <span>
                      {it.quantity} {UNIT_LABEL[it.unit]} · {it.product_name}
                    </span>
                    <span className="text-stone-400">{formatBRL(it.line_total_cents)}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex justify-between border-t border-campo-border pt-3">
                <span className="text-stone-400">Total</span>
                <span className="font-serif text-lg text-gold">{formatBRL(o.total_cents)}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </AppShell>
  );
}
