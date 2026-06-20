import Link from "next/link";
import { requireRole } from "@/lib/guard";
import { greeting } from "@/lib/greeting";
import { createClient } from "@/lib/supabase/server";
import { AppShell, CLIENTE_NAV } from "@/components/AppShell";
import { ProductCard, type ProductWithProducer } from "@/components/ProductCard";
import { producerName, locationLabel, type PublicProfile } from "@/lib/profile";

const PRODUCER_FIELDS =
  "id, full_name, display_name, farm_name, city, state, avatar_url, bio";

export default async function ClientePage() {
  const { profile } = await requireRole("cliente");
  const supabase = await createClient();

  const { data: productsData } = await supabase
    .from("products")
    .select(`*, producer:profiles!products_producer_id_fkey(${PRODUCER_FIELDS})`)
    .eq("available", true)
    .order("created_at", { ascending: false })
    .limit(12);

  const products = (productsData ?? []) as unknown as ProductWithProducer[];

  const fresh = products.filter((p) => p.production_status === "pronto").slice(0, 8);
  const reservas = products.filter(
    (p) => p.production_status === "reservado" || p.available_from
  ).slice(0, 4);

  const { data: producersData } = await supabase
    .from("profiles")
    .select(PRODUCER_FIELDS)
    .eq("role", "produtor")
    .limit(6);

  const producers = (producersData ?? []) as Partial<PublicProfile>[];
  const firstName = profile?.full_name?.split(" ")[0] || "";

  return (
    <AppShell badge="Clube Gourmet" nav={CLIENTE_NAV} userName={profile?.full_name ?? "Cliente"} title={greeting(profile?.full_name)} subtitle="Sabores que nascem na serra. Conheça quem produz.">
      {/* Hero */}
      <section className="mb-10 overflow-hidden rounded-2xl border border-campo-border bg-gradient-to-br from-forest-900 via-campo-surface to-campo-bg p-8 sm:p-12">
        <p className="font-serif text-sm uppercase tracking-[0.3em] text-gold">Colheita fresca</p>
        <h2 className="mt-2 max-w-xl font-serif text-3xl text-forest-100 sm:text-4xl">
          Direto do campo para a sua mesa
        </h2>
        <p className="mt-3 max-w-lg text-stone-400">
          Produtos colhidos no ponto certo, com a história de quem os cultiva.
        </p>
      </section>

      {/* Colheita fresca de hoje */}
      <Section title="Colheita fresca de hoje" subtitle="Disponível para entrega agora">
        {fresh.length === 0 ? (
          <Empty>Ainda não há produtos disponíveis na sua região.</Empty>
        ) : (
          <Grid>
            {fresh.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </Grid>
        )}
      </Section>

      {/* Reserva de colheita */}
      {reservas.length > 0 && (
        <Section title="Reserve sua colheita" subtitle="Garanta antes de colher">
          <Grid>
            {reservas.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </Grid>
        </Section>
      )}

      {/* Conheça quem produz */}
      <Section title="Conheça quem produz" subtitle="Os produtores da sua rede">
        {producers.length === 0 ? (
          <Empty>Nenhum produtor cadastrado ainda.</Empty>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {producers.map((prod) => (
              <Link
                key={prod.id}
                href={`/cliente/produtor/${prod.id}`}
                className="flex items-center gap-4 rounded-2xl border border-campo-border glass p-4 transition hover:border-gold/50"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-campo-surface2 text-xl">
                  {prod.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={prod.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    "🌾"
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-serif text-lg text-forest-100">{producerName(prod)}</p>
                  <p className="truncate text-xs text-stone-500">{locationLabel(prod) || "Brasil"}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Section>
    </AppShell>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <div className="mb-4">
        <h2 className="font-serif text-xl text-forest-100">{title}</h2>
        {subtitle && <p className="text-sm text-stone-500">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{children}</div>;
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-campo-border glass p-8 text-center text-sm text-stone-400">
      {children}
    </div>
  );
}
