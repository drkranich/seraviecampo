import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import {
  formatBRL,
  UNIT_LABEL,
  CATEGORY_LABEL,
  STATUS_LABEL,
  type Product,
} from "@/lib/catalog";
import { producerName, locationLabel, type PublicProfile } from "@/lib/profile";

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

  return (
    <AppShell badge="Clube Gourmet" title={product.name} subtitle={CATEGORY_LABEL[product.category]}>
      <Link href="/cliente" className="mb-6 inline-block text-sm text-stone-400 hover:text-gold">
        ← Voltar para descobertas
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-campo-border bg-campo-surface2">
          {product.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.image_url} alt={product.name} className="aspect-square w-full object-cover" />
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

          {/* Produtor */}
          {product.producer && (
            <Link
              href={`/cliente/produtor/${product.producer.id}`}
              className="mt-6 flex items-center gap-3 rounded-2xl border border-campo-border bg-campo-surface p-4 transition hover:border-gold/50"
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

          <div className="mt-6">
            <button
              disabled
              className="w-full cursor-not-allowed rounded-lg border border-gold/40 bg-gold/10 py-3 font-medium text-gold/70"
            >
              Adicionar à cesta · em breve
            </button>
            <p className="mt-2 text-center text-xs text-stone-600">
              Cesta e pagamento chegam na próxima etapa.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
