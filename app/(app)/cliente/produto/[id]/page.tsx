import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { AppShell, CLIENTE_NAV } from "@/components/AppShell";
import {
  formatBRL,
  UNIT_LABEL,
  CATEGORY_LABEL,
  STATUS_LABEL,
  type Product,
} from "@/lib/catalog";
import { producerName, locationLabel, type PublicProfile } from "@/lib/profile";
import { Carousel } from "@/components/Carousel";
import { addToCart } from "../../cesta/actions";

type ProductDetail = Product & { producer: Partial<PublicProfile> | null };

export default async function ProdutoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("cliente");
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("products")
    .select(
      "*, producer:profiles!products_producer_id_fkey(id, full_name, display_name, farm_name, city, state, avatar_url, bio)"
    )
    .eq("id", id)
    .eq("available", true)
    .single();

  if (!data) notFound();
  const product = data as unknown as ProductDetail;
  const imgs = product.images?.length ? product.images : product.image_url ? [product.image_url] : [];

  return (
    <AppShell badge="Clube Gourmet" nav={CLIENTE_NAV} title={product.name} subtitle={CATEGORY_LABEL[product.category]}>
      <Link href="/cliente" className="mb-6 inline-block text-sm text-stone-400 hover:text-gold">
        ← Voltar para descobertas
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-campo-border bg-campo-surface2">
          {imgs.length > 0 ? (
            <Carousel images={imgs} alt={product.name} className="aspect-square w-full" />
          ) : (
            <div className="flex aspect-square w-full items-center justify-center text-6xl opacity-40">🧺</div>
          )}
        </div>

        <div>
          <div className="flex flex-wrap gap-2">
            {product.is_organic && (
              <span className="rounded-full bg-forest-700 px-3 py-1 text-xs uppercase tracking-wider text-forest-100">
                Orgânico
              </span>
            )}
            <span className="rounded-full border border-campo-border px-3 py-1 text-xs text-stone-400">
              {STATUS_LABEL[product.production_status]}
            </span>
          </div>

          <p className="mt-4 font-serif text-3xl text-gold">
            {formatBRL(product.price_cents)}
            <span className="text-base text-stone-500"> /{UNIT_LABEL[product.unit]}</span>
          </p>

          {product.available_from && (
            <p className="mt-2 text-sm text-stone-400">
              Reserva de colheita · disponível a partir de{" "}
              {new Date(product.available_from).toLocaleDateString("pt-BR")}
            </p>
          )}

          {product.description && (
            <div className="mt-6">
              <h3 className="font-serif text-lg text-forest-100">A história</h3>
              <p className="mt-2 whitespace-pre-line leading-relaxed text-stone-300">
                {product.description}
              </p>
            </div>
          )}

          {product.producer && (
            <Link
              href={`/cliente/produtor/${product.producer.id}`}
              className="mt-6 flex items-center gap-3 rounded-2xl border border-campo-border glass p-4 transition hover:border-gold/50"
            >
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-campo-surface2 text-lg">
                {product.producer.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.producer.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  "🌾"
                )}
              </div>
              <div>
                <p className="font-serif text-forest-100">{producerName(product.producer)}</p>
                <p className="text-xs text-stone-500">{locationLabel(product.producer) || "Ver perfil"}</p>
              </div>
            </Link>
          )}

          <form action={addToCart.bind(null, product.id)} className="mt-6">
            <div className="flex gap-3">
              <input
                name="quantity"
                type="number"
                step="any"
                min="1"
                defaultValue={1}
                className="w-24 rounded-lg border border-campo-border bg-campo-bg px-3 py-3 text-center text-stone-100 outline-none focus:border-gold"
              />
              <button className="flex-1 rounded-lg bg-gold py-3 font-medium text-campo-bg transition hover:bg-gold-light">
                Adicionar à cesta
              </button>
            </div>
            <p className="mt-2 text-center text-xs text-stone-600">
              A Seravie Campo conecta você ao produtor. Pagamento e entrega são
              combinados diretamente com ele.
            </p>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
