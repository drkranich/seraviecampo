import Link from "next/link";
import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { AppShell, CLIENTE_NAV } from "@/components/AppShell";
import { formatBRL } from "@/lib/catalog";
import { PAYMENT_LABEL, type Order, type OrderItem, type PaymentMethod } from "@/lib/orders";
import { producerName, type PublicProfile } from "@/lib/profile";
import { confirmPayment } from "./actions";
import { stripeEnabled } from "@/lib/stripe";

type Row = Order & { producer: Partial<PublicProfile> | null; items: OrderItem[] };

export default async function PagamentoPage({
  searchParams,
}: { searchParams: Promise<{ ok?: string; novo?: string; error?: string }> }) {
  const { profile } = await requireRole("cliente");
  const sp = await searchParams;
  const supabase = await createClient();
  const enabled = stripeEnabled();
  const errMsg: Record<string, string> = {
    stripe_off: "Pagamento online temporariamente indisponível. Tente novamente em instantes ou acione o suporte.",
    pedido: "Pedido não encontrado.",
    cancelado: "Pagamento cancelado. Você pode tentar novamente quando quiser.",
  };

  const { data } = await supabase
    .from("orders")
    .select("*, producer:profiles!orders_producer_id_fkey(id, full_name, farm_name, display_name), items:order_items(*)")
    .eq("payment_status", "pendente")
    .order("created_at", { ascending: false });
  const orders = (data ?? []) as unknown as Row[];

  return (
    <AppShell badge="Clube Gourmet" nav={CLIENTE_NAV} userName={profile?.full_name ?? "Cliente"} title="Pagamento" subtitle="Finalize o pagamento dos seus pedidos.">
      {sp.ok && <div className="mb-4 rounded-lg border border-forest-700 bg-forest-900/40 px-3 py-2 text-sm text-forest-200">Pagamento confirmado! Acompanhe em Meus pedidos.</div>}
      {sp.error && <div className="mb-4 rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">{errMsg[sp.error] ?? decodeURIComponent(sp.error)}</div>}

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-campo-border glass p-10 text-center text-stone-400">
          Nenhum pagamento pendente. <Link href="/cliente/pedidos" className="text-gold hover:underline">Ver meus pedidos</Link>
        </div>
      ) : (
        <div className="space-y-5">
          {orders.map((o) => {
            const pay = confirmPayment.bind(null, o.id);
            const method = (o.payment_method ?? "pix") as PaymentMethod;
            return (
              <article key={o.id} className="glass rounded-2xl border border-campo-border p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-campo-border pb-3">
                  <p className="font-serif text-lg text-forest-100">{producerName(o.producer)}</p>
                  <span className="font-serif text-2xl text-gold">{formatBRL(o.total_cents)}</span>
                </div>
                <ul className="mt-3 space-y-1 text-sm">
                  {o.items.map((it) => (
                    <li key={it.id} className="flex justify-between text-stone-300">
                      <span>{it.quantity} · {it.product_name}</span>
                      <span className="text-stone-400">{formatBRL(it.line_total_cents)}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 rounded-xl border border-campo-border bg-campo-surface2/50 p-4">
                  <p className="text-sm text-stone-300">Forma de pagamento: <strong className="text-gold">{PAYMENT_LABEL[method]}</strong></p>
                  {method === "pix" && (
                    <p className="mt-2 text-xs text-stone-400">O Pix é processado com segurança pela Seravie Campo via Stripe. Ao concluir, o pedido fica confirmado na plataforma.</p>
                  )}
                  {method === "cartao" && (
                    <p className="mt-2 text-xs text-stone-400">O cartão é processado com segurança pela Seravie Campo via Stripe. O pedido só fica confirmado após o pagamento.</p>
                  )}
                  {method === "dinheiro" && (
                    <p className="mt-2 text-xs text-stone-400">Você pagará em dinheiro no momento da entrega. O pedido permanece registrado na plataforma.</p>
                  )}
                  {method === "dinheiro" ? (
                    <form action={pay} className="mt-3">
                      <button className="rounded-lg bg-gold px-5 py-2 text-sm font-medium text-campo-bg transition hover:bg-gold-light">
                        Confirmar (pagar na entrega)
                      </button>
                    </form>
                  ) : enabled ? (
                    <form action="/api/stripe/pay-order" method="post" className="mt-3">
                      <input type="hidden" name="order_id" value={o.id} />
                      <button className="rounded-lg bg-gold px-5 py-2 text-sm font-medium text-campo-bg transition hover:bg-gold-light">
                        Pagar com {method === "cartao" ? "cartão" : "Pix"} (Stripe)
                      </button>
                    </form>
                  ) : (
                    <button disabled className="mt-3 rounded-lg bg-gold px-5 py-2 text-sm font-medium text-campo-bg opacity-50">
                      Pagamento online indisponível
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
