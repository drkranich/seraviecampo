import Link from "next/link";
import { formatBRL, UNIT_LABEL, STATUS_LABEL, type Product } from "@/lib/catalog";
import { producerName, locationLabel, type PublicProfile } from "@/lib/profile";

export type ProductWithProducer = Product & {
  producer: Partial<PublicProfile> | null;
};

export function ProductCard({ product }: { product: ProductWithProducer }) {
  const reserva = product.production_status === "reservado" || !!product.available_from;
  return (
    <Link
      href={`/cliente/produto/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-campo-border bg-campo-surface transition hover:border-gold/50"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-campo-surface2">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl opacity-40">🧺</div>
        )}
        {product.is_organic && (
          <span className="absolute left-3 top-3 rounded-full bg-forest-700/90 px-2 py-0.5 text-[0.65rem] uppercase tracking-wider text-forest-100">
            Orgânico
          </span>
        )}
        {reserva && (
          <span className="absolute right-3 top-3 rounded-full bg-gold/90 px-2 py-0.5 text-[0.65rem] uppercase tracking-wider text-campo-bg">
            Reserva
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-serif text-lg text-forest-100">{product.name}</h3>
        <p className="mt-0.5 text-xs text-stone-500">
          {producerName(product.producer)}
          {locationLabel(product.producer) ? ` · ${locationLabel(product.producer)}` : ""}
        </p>
        <div className="mt-3 flex items-end justify-between">
          <span className="text-gold">
            {formatBRL(product.price_cents)}
            <span className="text-xs text-stone-500"> /{UNIT_LABEL[product.unit]}</span>
          </span>
          <span className="text-[0.65rem] text-stone-500">{STATUS_LABEL[product.production_status]}</span>
        </div>
      </div>
    </Link>
  );
}
