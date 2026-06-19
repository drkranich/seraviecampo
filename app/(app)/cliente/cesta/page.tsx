import Link from "next/link";
import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { AppShell, CLIENTE_NAV } from "@/components/AppShell";
import { formatBRL, UNIT_LABEL, type Product } from "@/lib/catalog";
import { producerName, type PublicProfile } from "@/lib/profile";
import { PAYMENT_METHODS, PAYMENT_LABEL } from "@/lib/orders";
import { updateCartItem, removeCartItem, checkout } from "./actions";

type CartRow = {
  quantity: number;
  product: (Product & { producer: Partial<PublicProfile> | null }) | null;
};

const inputCls =
  "w-full rounded-lg border border-campo-border bg-campo-bg px-3 py-2 text-stone-100 outline-none focus:border-gold";

export default async function CestaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { profile } = await requireRole("cliente");
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data } = await supabase
    .from("cart_items")
    .select(
      "quantity, product:products(*, producer:profiles!products_producer_id_fkey(id, full_name, farm_name, display_name))"
    )
    .order("created_at", { ascending: true });

  const rows = ((data ?? []) as unknown as CartRow[]).filter((r) => r.product);
  const total = rows.reduce((s, r) => s + (r.product!.price_cents * r.quantity), 0);
  const producers = new Set(rows.map((r) => r.product!.producer_id)).size;

  return (
    <AppShell badge="Clube Gourmet" nav={CLIENTE_NAV} title="Minha cesta" subtitle={`${rows.length} item(ns)`}>
      <Link href="/cliente" className="mb-6 inline-block text-sm text-stone-400 hover:text-gold">
        ← Continuar descobrindo
      </Link>

      {error && (
        <div className="mb-4 rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-campo-border bg-campo-surface p-10 text-center text-stone-400">
          Sua cesta está vazia.{" "}
          <Link href="/cliente" className="text-gold hover:underline">
            Explore os produtos
          </Link>
          .
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Itens */}
          <div className="space-y-3 lg:col-span-2">
            {rows.map((r) => {
              const p = r.product!;
              const update = updateCartItem.bind(null, p.id);
              const remove = removeCartItem.bind(null, p.id);
              return (
                <div key={p.id} className="flex items-center gap-4 rounded-2xl border border-campo-border bg-campo-surface p-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-campo-surface2 text-2xl">
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      "🧺"
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-serif text-forest-100">{p.name}</p>
                    <p className="text-xs text-stone-500">{producerName(p.producer)}</p>
                    <p className="text-sm text-gold">
                      {formatBRL(p.price_cents)}<span className="text-stone-500"> /{UNIT_LABEL[p.unit]}</span>
                    </p>
                  </div>
                  <form action={update} className="flex items-center gap-2">
                    <input
                      name="quantity"
                      type="number"
                      step="any"
                      min="0"
                      defaultValue={r.quantity}
                      className="w-20 rounded-lg border border-campo-border bg-campo-bg px-2 py-1.5 text-center text-stone-100 outline-none focus:border-gold"
                    />
                    <button className="rounded-lg border border-campo-border px-3 py-1.5 text-xs text-stone-300 transition hover:border-gold/50">
                      Atualizar
                    </button>
                  </form>
                  <form action={remove}>
                    <button className="text-xs text-red-400 transition hover:text-red-300">Remover</button>
                  </form>
                </div>
              );
            })}
            {producers > 1 && (
              <p className="px-1 text-xs text-stone-500">
                Sua cesta tem itens de {producers} produtores — será criado um pedido para cada um.
              </p>
            )}
          </div>

          {/* Checkout */}
          <div className="lg:col-span-1">
            <form action={checkout} className="space-y-4 rounded-2xl border border-campo-border bg-campo-surface p-5">
              <div className="flex items-center justify-between border-b border-campo-border pb-3">
                <span className="text-stone-400">Total</span>
                <span className="font-serif text-2xl text-gold">{formatBRL(total)}</span>
              </div>

              <input name="name" required defaultValue={profile?.full_name ?? ""} placeholder="Seu nome" className={inputCls} />
              <input name="phone" required placeholder="Telefone / WhatsApp" className={inputCls} />
              <input name="address" required placeholder="Endereço de entrega" className={inputCls} />
              <textarea name="notes" rows={2} placeholder="Observações (opcional)" className={inputCls} />

              <div>
                <label className="mb-1 block text-sm text-stone-300">Pagamento</label>
                <select name="payment" className={inputCls} defaultValue="pix">
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>{PAYMENT_LABEL[m]}</option>
                  ))}
                </select>
              </div>

              <button className="w-full rounded-lg bg-gold py-3 font-medium text-campo-bg transition hover:bg-gold-light">
                Finalizar pedido
              </button>
              <p className="text-center text-[0.7rem] leading-relaxed text-stone-600">
                A Seravie Campo conecta você ao produtor. O pagamento e a entrega são
                combinados diretamente com ele.
              </p>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
