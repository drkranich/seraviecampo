import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicSupportChatWidget } from "@/components/PublicSupportChatWidget";
import { findPublicDestination, getDestinationListings, type DestinationExperience, type DestinationProduct, type DestinationProducer } from "@/lib/public-destinations";
import { createClient } from "@/lib/supabase/server";
import { destinationHighlights, getSite } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const site = await getSite(supabase);
  const destination = await findPublicDestination(supabase, site, slug);

  if (!destination) return { title: site.seo_title, description: site.seo_description };

  return {
    title: `${destination.name} | ${site.brand}`,
    description: destination.intro || destination.description || destination.region,
    openGraph: {
      title: `${destination.name} | ${site.brand}`,
      description: destination.intro || destination.description || destination.region,
      images: destination.image ? [{ url: destination.image }] : undefined,
    },
  };
}

export default async function DestinoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const site = await getSite(supabase);
  const destination = await findPublicDestination(supabase, site, slug);
  if (!destination) notFound();

  const highlights = destinationHighlights(destination);
  const listings = await getDestinationListings(supabase, site, destination);
  const hasLiveListings = listings.products.length > 0 || listings.experiences.length > 0 || listings.producers.length > 0;

  return (
    <main className="min-h-screen bg-[#10140E] text-forest-100">
      <header className="relative min-h-[78vh] overflow-hidden bg-[#15190f]">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={destination.image} alt={destination.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(13,17,11,0.92),rgba(13,17,11,0.58),rgba(13,17,11,0.18)),linear-gradient(180deg,rgba(13,17,11,0.15),rgba(13,17,11,0.9))]" />
        </div>

        <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-6">
          <Link href="/" className="font-serif text-xl text-forest-50">{site.brand}</Link>
          <div className="flex items-center gap-4 text-sm text-forest-100/80">
            <Link href="/destinos" className="hover:text-gold">Destinos</Link>
            <Link href="/experiencias" className="hover:text-gold">Experiências</Link>
            <Link href="/login" className="hover:text-gold">Entrar</Link>
          </div>
        </nav>

        <section className="relative z-10 mx-auto max-w-7xl px-5 pb-12 pt-16 sm:px-6 lg:pt-28">
          <p className="text-xs uppercase tracking-[0.26em] text-gold">{destination.region}</p>
          <h1 className="mt-4 max-w-4xl font-serif text-6xl font-semibold leading-none text-forest-50 sm:text-7xl">{destination.name}</h1>
          <p className="mt-6 max-w-2xl text-xl leading-relaxed text-forest-50/80">{destination.intro || destination.description || site.destinations_text}</p>
          {destination.listing_count > 0 && (
            <p className="mt-4 max-w-2xl text-sm uppercase tracking-[0.18em] text-[#D9C68D]">{destination.offer_label}</p>
          )}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={destination.cta_href || "/experiencias"} className="rounded-lg bg-gold px-5 py-3 text-sm font-semibold text-campo-bg transition hover:bg-gold-light">
              {destination.cta_label || "Ver experiências"}
            </Link>
            <Link href="/destinos" className="rounded-lg border border-white/20 px-5 py-3 text-sm font-semibold text-forest-50 transition hover:border-gold/60 hover:text-gold">
              Outros destinos
            </Link>
          </div>
        </section>
      </header>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-6 lg:grid-cols-[1fr_0.8fr] lg:py-20">
        <article>
          <p className="text-xs uppercase tracking-[0.24em] text-[#A9C875]">Guia do destino</p>
          <h2 className="mt-3 font-serif text-4xl text-forest-50">Por que ir agora</h2>
          <p className="mt-6 text-lg leading-relaxed text-stone-300">{destination.description || destination.intro || site.destinations_text}</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-[#2D3326] bg-[#151A12] p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-gold">Melhor época</p>
              <p className="mt-2 text-sm leading-relaxed text-stone-300">{destination.best_time || "Consulte a sazonalidade com os anfitriões locais."}</p>
            </div>
            <div className="rounded-lg border border-[#2D3326] bg-[#151A12] p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-gold">Tempo sugerido</p>
              <p className="mt-2 text-sm leading-relaxed text-stone-300">{destination.travel_time || "Roteiros curtos e extensões de fim de semana."}</p>
            </div>
          </div>
        </article>

        <aside className="rounded-lg border border-[#2D3326] bg-[#151A12] p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-[#A8C7D3]">Destaques</p>
          <div className="mt-5 space-y-3">
            {(highlights.length ? highlights : site.stay_types.slice(0, 5)).map((item) => (
              <p key={item} className="rounded-lg border border-[#2D3326] bg-[#10140E] px-4 py-3 text-sm text-stone-300">{item}</p>
            ))}
          </div>
        </aside>
      </section>

      {hasLiveListings && (
        <section id="ofertas" className="border-y border-[#2D3326] bg-[#0F1514] py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-5 sm:px-6">
            <div className="grid gap-5 md:grid-cols-[0.8fr_1.2fr] md:items-end">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[#A8C7D3]">Ofertas publicadas</p>
                <h2 className="mt-3 font-serif text-4xl text-forest-50">O que já está ativo neste destino</h2>
              </div>
              <p className="max-w-2xl text-sm leading-relaxed text-stone-400 md:justify-self-end">
                Produtos, experiências e anfitriões locais reunidos para ajudar você a montar uma viagem com mais sabor, presença e conexão com o território.
              </p>
            </div>

            {listings.experiences.length > 0 && (
              <DestinationSection title="Experiências">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {listings.experiences.map((experience) => (
                    <ExperienceCard key={experience.id} experience={experience} />
                  ))}
                </div>
              </DestinationSection>
            )}

            {listings.products.length > 0 && (
              <DestinationSection title="Produtos regionais">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {listings.products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </DestinationSection>
            )}

            {listings.producers.length > 0 && (
              <DestinationSection title="Anfitriões e produtores locais">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {listings.producers.map((producer) => (
                    <ProducerCard key={producer.id} producer={producer} />
                  ))}
                </div>
              </DestinationSection>
            )}
          </div>
        </section>
      )}

      <section className="border-y border-[#2D3326] bg-[#17140F] py-14">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 px-5 sm:px-6 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-gold">{site.brand}</p>
            <h2 className="mt-3 font-serif text-4xl text-forest-50">Monte seu roteiro com experiências locais.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-400">Combine estadia, gastronomia, vivências rurais e produtos regionais em uma jornada só.</p>
          </div>
          <Link href={destination.cta_href || "/experiencias"} className="w-fit rounded-lg bg-gold px-5 py-3 text-sm font-semibold text-campo-bg transition hover:bg-gold-light">
            {destination.cta_label || "Explorar experiências"}
          </Link>
        </div>
      </section>
      <PublicSupportChatWidget />
    </main>
  );
}

function DestinationSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h3 className="font-serif text-3xl text-forest-50">{title}</h3>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function ExperienceCard({ experience }: { experience: DestinationExperience }) {
  return (
    <Link href={`/experiencias/${experience.id}`} className="group overflow-hidden rounded-lg border border-[#293A34] bg-[#151F1B] transition hover:border-[#A8C7D3]/60">
      <div className="aspect-[16/10] overflow-hidden bg-campo-surface2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={experience.image} alt={experience.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
      </div>
      <div className="p-5">
        <p className="text-xs uppercase tracking-[0.22em] text-[#A8C7D3]">{experience.category_label}</p>
        <h4 className="mt-2 font-serif text-2xl text-forest-50">{experience.title}</h4>
        {experience.summary && <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-stone-400">{experience.summary}</p>}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
          <span className="text-stone-500">{experience.duration_label}</span>
          <span className="text-gold">{experience.price_label}</span>
        </div>
      </div>
    </Link>
  );
}

function ProductCard({ product }: { product: DestinationProduct }) {
  return (
    <article className="overflow-hidden rounded-lg border border-[#3C3524] bg-[#211B12]">
      <div className="aspect-[4/3] overflow-hidden bg-campo-surface2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
      </div>
      <div className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs uppercase tracking-[0.18em] text-[#D4BD8C]">{product.category_label}</p>
          {product.is_organic && <span className="rounded-full border border-[#7CA049]/50 px-2 py-0.5 text-[0.65rem] text-[#A9C875]">Orgânico</span>}
        </div>
        <h4 className="mt-2 font-serif text-xl text-forest-50">{product.name}</h4>
        <p className="mt-1 text-xs text-stone-500">{product.producer_name}{product.location ? ` · ${product.location}` : ""}</p>
        {product.description && <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-stone-400">{product.description}</p>}
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-sm text-gold">{product.price_label}</span>
          <Link href="/signup?role=cliente" className="rounded-lg border border-[#3C3524] px-3 py-2 text-xs text-stone-300 transition hover:border-gold/60 hover:text-gold">
            Comprar
          </Link>
        </div>
      </div>
    </article>
  );
}

function ProducerCard({ producer }: { producer: DestinationProducer }) {
  return (
    <article className="rounded-lg border border-[#2D3326] bg-[#151A12] p-5">
      <div className="flex items-center gap-3">
        <div className="h-14 w-14 overflow-hidden rounded-full bg-campo-surface2">
          {producer.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={producer.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-serif text-lg text-gold">SC</div>
          )}
        </div>
        <div className="min-w-0">
          <h4 className="truncate font-serif text-xl text-forest-50">{producer.name}</h4>
          <p className="text-xs uppercase tracking-[0.14em] text-stone-500">
            {producer.location || "Seravie Campo"}{producer.verified ? " · verificado" : ""}
          </p>
        </div>
      </div>
      {producer.bio && <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-stone-400">{producer.bio}</p>}
      <Link href="/signup?role=cliente" className="mt-5 inline-flex rounded-lg border border-campo-border px-4 py-2 text-xs font-semibold text-stone-300 transition hover:border-gold/60 hover:text-gold">
        Acompanhar produtor
      </Link>
    </article>
  );
}
