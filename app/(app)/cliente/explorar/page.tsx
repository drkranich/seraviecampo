import Link from "next/link";
import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { AppShell, CLIENTE_NAV } from "@/components/AppShell";
import { ProductCard, type ProductWithProducer } from "@/components/ProductCard";
import { CATEGORIES, CATEGORY_LABEL, type ProductCategory } from "@/lib/catalog";

const PRODUCER_FIELDS = "id, full_name, display_name, farm_name, city, state, avatar_url";

export default async function ExplorarPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { profile } = await requireRole("cliente");
  const { category, q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select(`*, producer:profiles!products_producer_id_fkey(${PRODUCER_FIELDS})`)
    .eq("available", true)
    .order("created_at", { ascending: false })
    .limit(60);

  if (category && CATEGORIES.includes(category as ProductCategory)) {
    query = query.eq("category", category);
  }
  if (q && q.trim()) {
    query = query.ilike("name", `%${q.trim()}%`);
  }

  const { data } = await query;
  const products = (data ?? []) as unknown as ProductWithProducer[];

  return (
    <AppShell badge="Clube Gourmet" nav={CLIENTE_NAV} userName={profile?.full_name ?? "Cliente"} title="Explorar" subtitle="Tudo o que a sua região produz.">
      {/* Busca */}
      <form className="mb-5 flex gap-2" action="/cliente/explorar">
        {category && <input type="hidden" name="category" value={category} />}
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Buscar produto..."
          className="w-full rounded-lg border border-campo-border bg-campo-bg px-4 py-2.5 text-stone-100 outline-none focus:border-gold"
        />
        <button className="rounded-lg bg-gold px-5 py-2.5 text-sm font-medium text-campo-bg transition hover:bg-gold-light">Buscar</button>
      </form>

      {/* Chips de categoria */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Chip href="/cliente/explorar" active={!category} label="Todos" />
        {CATEGORIES.map((c) => (
          <Chip key={c} href={`/cliente/explorar?category=${c}`} active={category === c} label={CATEGORY_LABEL[c]} />
        ))}
      </div>

      {products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-campo-border glass p-10 text-center text-stone-400">
          Nenhum produto encontrado{category ? ` em ${CATEGORY_LABEL[category as ProductCategory]}` : ""}.
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </AppShell>
  );
}

function Chip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1.5 text-xs transition ${
        active ? "border-gold bg-gold/15 text-gold" : "border-campo-border text-stone-400 hover:border-gold/50"
      }`}
    >
      {label}
    </Link>
  );
}
