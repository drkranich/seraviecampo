import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { AppShell, CLIENTE_NAV } from "@/components/AppShell";
import { ProductCard, type ProductWithProducer } from "@/components/ProductCard";
import { Avatar } from "@/components/Avatar";
import { producerName, locationLabel, type PublicProfile } from "@/lib/profile";

export default async function PerfilProdutorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("cliente");
  const { id } = await params;
  const supabase = await createClient();

  const { data: profileData } = await supabase
    .from("profiles")
    .select("id, full_name, display_name, farm_name, city, state, avatar_url, cover_url, bio, role, verification_status")
    .eq("id", id)
    .eq("role", "produtor")
    .single();

  if (!profileData) notFound();
  const producer = profileData as Partial<PublicProfile>;

  const { data: productsData } = await supabase
    .from("products")
    .select("*")
    .eq("producer_id", id)
    .eq("available", true)
    .order("created_at", { ascending: false });

  const products = ((productsData ?? []) as ProductWithProducer[]).map((p) => ({
    ...p,
    producer,
  }));

  return (
    <AppShell badge="Clube Gourmet" nav={CLIENTE_NAV} title={producerName(producer)} subtitle={locationLabel(producer)}>
      <Link href="/cliente" className="mb-6 inline-block text-sm text-stone-400 hover:text-gold">
        ← Voltar para descobertas
      </Link>

      {/* Capa + identidade */}
      <section className="overflow-hidden rounded-2xl border border-campo-border glass">
        <div className="relative h-40 bg-gradient-to-br from-forest-800 to-campo-bg sm:h-56">
          {producer.cover_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={producer.cover_url} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        <div className="flex items-end gap-4 px-6 pb-6">
          <div className="-mt-10">
            <Avatar url={producer.avatar_url} size={80} verified={producer.verification_status === "verificado"} fallback="🌾" />
          </div>
          <div className="pb-1">
            <h2 className="font-serif text-2xl text-forest-100">{producerName(producer)}</h2>
            <p className="text-sm text-stone-500">{locationLabel(producer) || "Brasil"}</p>
          </div>
        </div>
      </section>

      {/* História */}
      {producer.bio && (
        <section className="mt-6 rounded-2xl border border-campo-border glass p-6">
          <h3 className="font-serif text-lg text-forest-100">Nossa história</h3>
          <p className="mt-2 whitespace-pre-line leading-relaxed text-stone-300">{producer.bio}</p>
        </section>
      )}

      {/* Produtos do produtor */}
      <section className="mt-8">
        <h3 className="mb-4 font-serif text-xl text-forest-100">Produtos disponíveis</h3>
        {products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-campo-border glass p-8 text-center text-sm text-stone-400">
            Este produtor ainda não tem produtos publicados.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
